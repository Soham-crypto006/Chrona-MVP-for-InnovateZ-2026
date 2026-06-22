import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, redis_client
from models import Chunk, Source, Document, AuditEvent
from schemas import RemediationWorkflowResponse
from routers.sources import perform_sync_logic

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/remediation", tags=["Remediation"])

@router.get("/workflows", response_model=List[RemediationWorkflowResponse])
async def get_remediation_workflows(db: AsyncSession = Depends(get_db)):
    """
    Scans the database for compliance anomalies and content drift
    to generate actionable remediation tasks dynamically.
    """
    workflows = []

    # 1. Fetch Zombie Chunks (needs re-embedding)
    zombie_stmt = (
        select(Chunk)
        .options(selectinload(Chunk.document), selectinload(Chunk.source))
        .where(Chunk.status == "zombie")
        .limit(50)
    )
    zombie_res = await db.execute(zombie_stmt)
    zombies = zombie_res.scalars().all()

    for z in zombies:
        doc_title = z.document.title if z.document else "Untitled Document"
        src_name = z.source.name if z.source else "Unknown Source"
        workflows.append(
            RemediationWorkflowResponse(
                id=f"REM-ZOMBIE-{z.id}",
                type="reembed",
                status="open",
                title=f"Re-embed stale chunk",
                description=f"Content drift detected in '{doc_title}'. Current vectorized embedding is obsolete.",
                source_name=src_name,
                affected_count=1,
                est_time="~10s"
            )
        )

    # 2. Fetch Expired Chunks (needs blocking/invalidation)
    expired_stmt = (
        select(Chunk)
        .options(selectinload(Chunk.document), selectinload(Chunk.source))
        .where(Chunk.status == "expired")
        .limit(50)
    )
    expired_res = await db.execute(expired_stmt)
    expired = expired_res.scalars().all()

    for ex in expired:
        doc_title = ex.document.title if ex.document else "Untitled Document"
        src_name = ex.source.name if ex.source else "Unknown Source"
        workflows.append(
            RemediationWorkflowResponse(
                id=f"REM-EXPIRED-{ex.id}",
                type="block",
                status="open",
                title=f"Block expired chunk",
                description=f"TTL limit exceeded for chunk in '{doc_title}'. Access must be restricted.",
                source_name=src_name,
                affected_count=1,
                est_time="instant"
            )
        )

    # 3. Fetch Low Health Sources (needs re-syncing)
    source_stmt = select(Source).where(Source.health_score < 80.0)
    source_res = await db.execute(source_stmt)
    low_health_sources = source_res.scalars().all()

    for s in low_health_sources:
        workflows.append(
            RemediationWorkflowResponse(
                id=f"REM-SOURCE-{s.id}",
                type="resync",
                status="open",
                title=f"Re-sync source: {s.name}",
                description=f"Knowledge integrity degraded to {round(s.health_score, 1)}%. Run full crawler synchronization.",
                source_name=s.name,
                affected_count=int(s.health_score / 10) or 1,
                est_time="~2m"
            )
        )

    return workflows

@router.post("/{workflow_id}/execute")
async def execute_remediation(workflow_id: str, db: AsyncSession = Depends(get_db)):
    """
    Executes a remediation workflow, updates DB status,
    caches updates in Redis if necessary, and logs the audit event.
    """
    if workflow_id.startswith("REM-ZOMBIE-"):
        chunk_uuid_str = workflow_id.replace("REM-ZOMBIE-", "")
        try:
            chunk_id = UUID(chunk_uuid_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid chunk UUID format")

        stmt = select(Chunk).where(Chunk.id == chunk_id)
        res = await db.execute(stmt)
        chunk = res.scalars().first()
        if not chunk:
            raise HTTPException(status_code=404, detail="Zombie chunk not found")

        # Execute re-embedding: mark active
        chunk.status = "active"
        
        # Log audit trail event
        audit = AuditEvent(
            event_type="chunk_reembedded",
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            status="active",
            action="reembed",
            event_metadata={"reason": "manual_remediation", "remediated_at": datetime.utcnow().isoformat()}
        )
        db.add(audit)
        await db.commit()
        return {"success": True, "detail": "Successfully re-embedded knowledge vector."}

    elif workflow_id.startswith("REM-EXPIRED-"):
        chunk_uuid_str = workflow_id.replace("REM-EXPIRED-", "")
        try:
            chunk_id = UUID(chunk_uuid_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid chunk UUID format")

        stmt = select(Chunk).where(Chunk.id == chunk_id)
        res = await db.execute(stmt)
        chunk = res.scalars().first()
        if not chunk:
            raise HTTPException(status_code=404, detail="Expired chunk not found")

        # Block/invalidate chunk
        chunk.status = "invalidated"
        
        # Add to Redis blocklist
        try:
            await redis_client.set(f"blocklist:{str(chunk_id)}", "invalidated")
        except Exception as e:
            logger.error(f"Redis cache write failed: {e}")

        # Log audit trail event
        audit = AuditEvent(
            event_type="chunk_invalidated",
            chunk_id=chunk.id,
            document_id=chunk.document_id,
            status="invalidated",
            action="invalidate",
            event_metadata={"reason": "manual_remediation_expiration", "remediated_at": datetime.utcnow().isoformat()}
        )
        db.add(audit)
        await db.commit()
        return {"success": True, "detail": "Successfully blocked retrieval for expired chunk."}

    elif workflow_id.startswith("REM-SOURCE-"):
        source_uuid_str = workflow_id.replace("REM-SOURCE-", "")
        try:
            source_id = UUID(source_uuid_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid source UUID format")

        stmt = select(Source).where(Source.id == source_id)
        res = await db.execute(stmt)
        source = res.scalars().first()
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")

        try:
            sync_results = await perform_sync_logic(source.id, db)
            return {"success": True, "detail": "Synchronized source successfully.", "results": sync_results}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Synchronization failed: {e}")

    else:
        raise HTTPException(status_code=400, detail="Invalid or unsupported workflow ID format")
