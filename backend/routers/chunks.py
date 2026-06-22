import logging
from typing import Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, redis_client
from models import Chunk, AuditEvent
from schemas import PaginatedChunksResponse, ChunkInvalidateResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chunks", tags=["Chunks"])

@router.get("", response_model=PaginatedChunksResponse)
async def get_chunks(
    status: Optional[str] = Query(None, description="Filter chunks by status (active/zombie/expired/invalidated)"),
    source_id: Optional[UUID] = Query(None, description="Filter chunks by source ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """Returns a paginated list of chunks matching optional query filters."""
    # Build query
    query = select(Chunk)
    count_query = select(func.count(Chunk.id))
    
    if status:
        query = query.where(Chunk.status == status)
        count_query = count_query.where(Chunk.status == status)
    if source_id:
        query = query.where(Chunk.source_id == source_id)
        count_query = count_query.where(Chunk.source_id == source_id)

    # Calculate offset
    offset = (page - 1) * limit

    # Get total count
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0

    # Subquery to count retrievals per chunk
    retrieval_count_subquery = (
        select(func.count(AuditEvent.id))
        .where(AuditEvent.chunk_id == Chunk.id, AuditEvent.event_type == "chunk_retrieved")
        .scalar_subquery()
        .label("retrieval_count")
    )

    # Get page results
    query = select(Chunk, retrieval_count_subquery).options(
        selectinload(Chunk.document),
        selectinload(Chunk.source)
    ).order_by(Chunk.created_at.desc()).offset(offset).limit(limit)
    
    res = await db.execute(query)
    results = res.all()

    items = []
    for chunk, ret_count in results:
        items.append({
            "id": chunk.id,
            "document_id": chunk.document_id,
            "source_id": chunk.source_id,
            "content": chunk.content,
            "embedding_id": chunk.embedding_id,
            "version": chunk.version,
            "status": chunk.status,
            "valid_from": chunk.valid_from,
            "valid_to": chunk.valid_to,
            "chunk_index": chunk.chunk_index,
            "token_count": chunk.token_count,
            "created_at": chunk.created_at,
            "document_title": chunk.document.title if chunk.document else None,
            "source_name": chunk.source.name if chunk.source else None,
            "retrieval_count": ret_count
        })

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }

@router.post("/{id}/invalidate", response_model=ChunkInvalidateResponse)
async def invalidate_chunk(id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Invalidates a specific chunk, writes to the Redis blocklist,
    and logs an audit trail event.
    """
    stmt = select(Chunk).where(Chunk.id == id)
    res = await db.execute(stmt)
    chunk = res.scalars().first()
    
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")

    if chunk.status == "invalidated":
        # Already invalidated, return success
        # Find existing audit event or create a new one
        audit_stmt = select(AuditEvent).where(AuditEvent.chunk_id == id, AuditEvent.action == "invalidate")
        audit_res = await db.execute(audit_stmt)
        existing_audit = audit_res.scalars().first()
        
        audit_id = existing_audit.id if existing_audit else id
        return {
            "success": True,
            "audit_event_id": audit_id
        }

    # 1. Update DB chunk status
    chunk.status = "invalidated"
    
    # 2. Add to Redis blocklist
    try:
        await redis_client.set(f"blocklist:{str(id)}", "invalidated")
    except Exception as e:
        logger.error(f"Failed to cache blocklist entry in Redis: {e}")

    # 3. Create Audit Trail event
    audit_event = AuditEvent(
        event_type="chunk_invalidated",
        chunk_id=chunk.id,
        document_id=chunk.document_id,
        status="invalidated",
        action="invalidate",
        event_metadata={
            "invalidated_at": datetime.utcnow().isoformat(),
            "reason": "manual_invalidation"
        }
    )
    db.add(audit_event)
    await db.commit()
    await db.refresh(audit_event)

    return {
        "success": True,
        "audit_event_id": audit_event.id
    }

@router.post("/{id}/reembed")
async def reembed_chunk(id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Sets the chunk status to active, removes it from Redis blocklist,
    and logs an audit trail event.
    """
    stmt = select(Chunk).where(Chunk.id == id)
    res = await db.execute(stmt)
    chunk = res.scalars().first()
    
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")

    chunk.status = "active"

    # Remove from Redis blocklist
    try:
        await redis_client.delete(f"blocklist:{str(id)}")
    except Exception as e:
        logger.error(f"Failed to clear blocklist entry in Redis: {e}")

    # Create Audit Trail event
    audit_event = AuditEvent(
        event_type="chunk_reembedded",
        chunk_id=chunk.id,
        document_id=chunk.document_id,
        status="active",
        action="reembed",
        event_metadata={
            "reembedded_at": datetime.utcnow().isoformat(),
            "reason": "manual_reembed"
        }
    )
    db.add(audit_event)
    await db.commit()
    await db.refresh(audit_event)

    return {
        "success": True,
        "detail": "Successfully re-embedded chunk"
    }

