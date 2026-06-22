import logging
import hashlib
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, encrypt_key, decrypt_key
from models import Source, Document, Chunk, AuditEvent
from schemas import SourceConnectRequest, SourceConnectResponse, SourceResponse, SourceSyncResponse
import services.notion_connector as notion_connector
import services.chunker as chunker
import services.embedder as embedder
import services.diff_engine as diff_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sources", tags=["Sources"])

async def perform_sync_logic(source_id: UUID, db: AsyncSession) -> Dict[str, int]:
    """
    Main synchronization routine shared by Celery tasks and direct API calls.
    Fetches pages, hashes content, checks for changes, runs semantic diff,
    updates chunks status (active/zombie), and logs audit events.
    """
    # 1. Fetch source
    stmt = select(Source).where(Source.id == source_id)
    res = await db.execute(stmt)
    source = res.scalars().first()
    if not source:
        raise ValueError(f"Source with ID {source_id} not found.")

    source.status = "syncing"
    await db.commit()

    api_key = decrypt_key(source.api_key_encrypted)

    new_chunks_count = 0
    zombified_chunks_count = 0
    unchanged_chunks_count = 0

    try:
        # 2. Get pages from notion
        pages = await notion_connector.connect(api_key, source.workspace_id)
        
        for p in pages:
            page_id = p["id"]
            page_title = p["title"]
            
            # Fetch full page details
            page_content_data = await notion_connector.fetch_page_content(api_key, page_id)
            content = page_content_data["content"]
            title = page_content_data["title"]
            
            content_hash = hashlib.md5(content.encode("utf-8")).hexdigest()

            # Check if document exists
            doc_stmt = select(Document).where(Document.source_id == source_id, Document.external_id == page_id)
            doc_res = await db.execute(doc_stmt)
            doc = doc_res.scalars().first()

            if not doc:
                # [NEW DOCUMENT]
                doc = Document(
                    source_id=source_id,
                    external_id=page_id,
                    title=title,
                    url=f"https://notion.so/{page_id.replace('-', '')}",
                    content_hash=content_hash
                )
                db.add(doc)
                await db.flush()  # Populates doc.id

                # Generate new chunks
                chunks_data = chunker.chunk_document(content)
                
                # Make chunks matching DB layout
                new_chunks = []
                for c in chunks_data:
                    chunk_obj = Chunk(
                        document_id=doc.id,
                        source_id=source_id,
                        content=c["content"],
                        version=1,
                        status="active",
                        chunk_index=c["chunk_index"],
                        token_count=c["token_count"]
                    )
                    db.add(chunk_obj)
                    new_chunks.append(chunk_obj)
                
                await db.flush()

                # Generate and upload embeddings
                embed_payloads = [{"id": c.id, "content": c.content, "document_id": doc.id, "source_id": source_id} for c in new_chunks]
                embeddings_res = await embedder.embed_chunks(embed_payloads)
                
                # Update chunk embedding reference
                emb_map = {item["chunk_id"]: item["embedding_id"] for item in embeddings_res}
                for c in new_chunks:
                    c.embedding_id = emb_map.get(c.id)

                # Log Audit Events
                for c in new_chunks:
                    audit = AuditEvent(
                        event_type="chunk_created",
                        chunk_id=c.id,
                        document_id=doc.id,
                        status="active",
                        action="create",
                        event_metadata={"title": title, "version": 1}
                    )
                    db.add(audit)

                new_chunks_count += len(new_chunks)

            else:
                # [DOCUMENT EXISTS]
                # Fetch active chunks for this doc
                chunk_stmt = select(Chunk).where(Chunk.document_id == doc.id, Chunk.status == "active").order_by(Chunk.chunk_index)
                chunk_res = await db.execute(chunk_stmt)
                active_chunks = chunk_res.scalars().all()

                if doc.content_hash == content_hash:
                    # Unchanged
                    unchanged_chunks_count += len(active_chunks)
                else:
                    # Content drift detected
                    # Construct old content text by joining old active chunks
                    old_content = "\n\n".join([ac.content for ac in active_chunks]) if active_chunks else ""
                    
                    diff_res = await diff_engine.compute_diff(old_content, content)
                    
                    if diff_res["changed"]:
                        # Zombie old chunks
                        max_version = 1
                        for ac in active_chunks:
                            ac.status = "zombie"
                            max_version = max(max_version, ac.version)
                            
                            # Audit event for zombification
                            audit_zombie = AuditEvent(
                                event_type="chunk_zombified",
                                chunk_id=ac.id,
                                document_id=doc.id,
                                status="zombie",
                                action="zombify",
                                event_metadata={"reason": "content_drift", "similarity": diff_res.get("similarity")}
                            )
                            db.add(audit_zombie)

                        zombified_chunks_count += len(active_chunks)
                        
                        # Generate new chunks
                        new_version = max_version + 1
                        chunks_data = chunker.chunk_document(content)
                        new_chunks = []
                        for c in chunks_data:
                            chunk_obj = Chunk(
                                document_id=doc.id,
                                source_id=source_id,
                                content=c["content"],
                                version=new_version,
                                status="active",
                                chunk_index=c["chunk_index"],
                                token_count=c["token_count"]
                            )
                            db.add(chunk_obj)
                            new_chunks.append(chunk_obj)
                        
                        await db.flush()

                        # Embed and upload
                        embed_payloads = [{"id": c.id, "content": c.content, "document_id": doc.id, "source_id": source_id} for c in new_chunks]
                        embeddings_res = await embedder.embed_chunks(embed_payloads)
                        emb_map = {item["chunk_id"]: item["embedding_id"] for item in embeddings_res}
                        
                        for c in new_chunks:
                            c.embedding_id = emb_map.get(c.id)

                        # Audit event for new versions
                        for c in new_chunks:
                            audit_new = AuditEvent(
                                event_type="chunk_version_drift",
                                chunk_id=c.id,
                                document_id=doc.id,
                                old_version=max_version,
                                new_version=new_version,
                                status="active",
                                action="create_version",
                                event_metadata={
                                    "similarity": diff_res.get("similarity"),
                                    "explanation": diff_res.get("explanation"),
                                    "risk_level": diff_res.get("risk_level")
                                }
                            )
                            db.add(audit_new)

                        new_chunks_count += len(new_chunks)
                        
                        # Update doc hash & title
                        doc.content_hash = content_hash
                        doc.title = title
                        doc.updated_at = datetime.utcnow()
                    else:
                        # Change was semantically trivial, no new chunk versions generated
                        # Just update hash and title
                        doc.content_hash = content_hash
                        doc.title = title
                        doc.updated_at = datetime.utcnow()
                        unchanged_chunks_count += len(active_chunks)

        # 3. Calculate and update health score
        # health_score = active_chunks / total_chunks * 100
        active_cnt_stmt = select(func.count(Chunk.id)).where(Chunk.source_id == source_id, Chunk.status == "active")
        total_cnt_stmt = select(func.count(Chunk.id)).where(Chunk.source_id == source_id)
        
        active_cnt = (await db.execute(active_cnt_stmt)).scalar() or 0
        total_cnt = (await db.execute(total_cnt_stmt)).scalar() or 0

        source.health_score = (active_cnt / total_cnt * 100) if total_cnt > 0 else 100.0
        source.last_sync = datetime.utcnow()
        source.status = "connected"
        await db.commit()

    except Exception as e:
        logger.error(f"Error executing perform_sync_logic for source {source_id}: {e}")
        source.status = "error"
        await db.commit()
        raise e

    return {
        "new_chunks": new_chunks_count,
        "zombified_chunks": zombified_chunks_count,
        "unchanged": unchanged_chunks_count
    }

@router.post("/connect", response_model=SourceConnectResponse)
async def connect_source(req: SourceConnectRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """
    Connects a Notion source, validates workspace key, stores credentials,
    and runs background indexing jobs.
    """
    try:
        pages = await notion_connector.connect(req.api_key, req.workspace_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to validate Notion API key: {e}")

    # Encrypt api key
    encrypted_key = encrypt_key(req.api_key)

    new_source = Source(
        name=req.name,
        type=req.type,
        status="syncing",
        api_key_encrypted=encrypted_key,
        workspace_id=req.workspace_id,
        health_score=100.0,
        owner_id="admin"
    )
    db.add(new_source)
    await db.commit()
    await db.refresh(new_source)

    # Estimate chunks: 5 chunks per page is a solid heuristic
    estimated_chunks = len(pages) * 5

    # Run background sync via FastAPI background tasks
    # We will import celery_app and queue it as a background job if Celery is used,
    # and additionally trigger a local background task as a fallback.
    from main import sync_source
    try:
        sync_source.delay(str(new_source.id))
    except Exception as e:
        logger.warning(f"Could not queue Celery job, running via FastAPI BackgroundTasks: {e}")
        background_tasks.add_task(perform_sync_logic, new_source.id, db)

    return {
        "source_id": new_source.id,
        "status": "syncing",
        "estimated_chunks": estimated_chunks
    }

@router.get("", response_model=List[SourceResponse])
async def get_sources(db: AsyncSession = Depends(get_db)):
    """Returns all connected sources with health scores."""
    stmt = select(Source).order_by(Source.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{id}/sync", response_model=SourceSyncResponse)
async def sync_source_manual(id: UUID, db: AsyncSession = Depends(get_db)):
    """Triggers manual synchronization for a source and returns result summaries."""
    stmt = select(Source).where(Source.id == id)
    res = await db.execute(stmt)
    source = res.scalars().first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    try:
        results = await perform_sync_logic(source.id, db)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual sync failed: {str(e)}")
