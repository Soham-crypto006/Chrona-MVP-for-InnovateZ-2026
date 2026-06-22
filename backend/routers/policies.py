import logging
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Policy, Chunk, Document, AuditEvent
from schemas import PolicyCreateRequest, PolicyCreateResponse, PolicyResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/policies", tags=["Policies"])

@router.post("", response_model=PolicyCreateResponse)
async def create_policy(req: PolicyCreateRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a new governance/compliance policy, applies it retroactively to
    existing matching chunks, sets expiration dates, and returns results.
    """
    # 1. Create and save the policy
    new_policy = Policy(
        name=req.name,
        scope=req.scope,
        ttl_days=req.ttl_days,
        document_type=req.document_type,
        risk_level=req.risk_level,
        owner_email=req.owner_email,
        status="active"
    )
    db.add(new_policy)
    await db.flush()  # Populates new_policy.id

    # 2. Select active chunks affected by this policy
    # We join with Document to filter by document_type (e.g. title keyword match)
    query = select(Chunk).where(Chunk.status == "active")
    
    # Filter by scope if it points to a specific source
    if req.scope and req.scope != "global":
        try:
            source_uuid = UUID(req.scope)
            query = query.where(Chunk.source_id == source_uuid)
        except ValueError:
            # If scope is not a valid UUID string, skip filtering by source UUID
            pass

    # Filter by document_type (checks if title matches)
    if req.document_type:
        query = query.join(Document).where(Document.title.ilike(f"%{req.document_type}%"))

    res = await db.execute(query)
    matching_chunks = res.scalars().all()

    now = datetime.utcnow()
    ttl_delta = timedelta(days=req.ttl_days)
    affected_count = 0

    for chunk in matching_chunks:
        new_valid_to = chunk.created_at + ttl_delta
        
        # If valid_to is modified, count it
        if chunk.valid_to != new_valid_to:
            chunk.valid_to = new_valid_to
            affected_count += 1
            
            # If the calculated valid_to is already in the past, expire it immediately
            if new_valid_to < now:
                chunk.status = "expired"
                
                # Write an audit trail event for the expiration
                audit_event = AuditEvent(
                    event_type="chunk_expired",
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    status="expired",
                    action="expire",
                    event_metadata={
                        "policy_id": str(new_policy.id),
                        "policy_name": new_policy.name,
                        "expired_by_policy": True
                    }
                )
                db.add(audit_event)

    await db.commit()
    await db.refresh(new_policy)

    return {
        "policy_id": new_policy.id,
        "affected_chunks": affected_count
    }

@router.get("", response_model=List[PolicyResponse])
async def get_policies(db: AsyncSession = Depends(get_db)):
    """Returns all registered compliance/governance policies."""
    stmt = select(Policy).order_by(Policy.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
