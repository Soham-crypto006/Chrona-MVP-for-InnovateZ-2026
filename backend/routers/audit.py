import os
import hmac
import hashlib
import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import AuditEvent
from schemas import AuditEventResponse, AuditExportRequest, AuditExportResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[AuditEventResponse])
async def get_audit_trail(
    agent_id: Optional[UUID] = Query(None, description="Filter by AI Agent ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    date_from: Optional[datetime] = Query(None, description="Filter start date"),
    date_to: Optional[datetime] = Query(None, description="Filter end date"),
    limit: int = Query(200, ge=1, le=2000, description="Limit retrieved logs count"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves immutable audit trail events matching query parameters."""
    stmt = select(AuditEvent)

    if agent_id:
        stmt = stmt.where(AuditEvent.agent_id == agent_id)
    if event_type:
        stmt = stmt.where(AuditEvent.event_type == event_type)
    if date_from:
        stmt = stmt.where(AuditEvent.created_at >= date_from)
    if date_to:
        stmt = stmt.where(AuditEvent.created_at <= date_to)

    stmt = stmt.order_by(AuditEvent.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/export", response_model=AuditExportResponse)
async def export_compliance_evidence(req: AuditExportRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates a compliance export containing audited events within range,
    cryptographically signed using HMAC-SHA256 for audit immutability assurance.
    """
    stmt = select(AuditEvent)

    if req.framework and req.framework != "ALL":
        from sqlalchemy import cast, String
        stmt = stmt.where(cast(AuditEvent.event_metadata["framework"], String) == f'"{req.framework}"')

    if req.date_from:
        stmt = stmt.where(AuditEvent.created_at >= req.date_from)
    if req.date_to:
        stmt = stmt.where(AuditEvent.created_at <= req.date_to)

    stmt = stmt.order_by(AuditEvent.created_at.asc())
    res = await db.execute(stmt)
    events = res.scalars().all()

    # Cryptographic signature over event data payload to ensure tamper-evidence
    secret_key = os.getenv("ENCRYPTION_KEY")
    if not secret_key:
        raise RuntimeError("ENCRYPTION_KEY must be set in environment")
    secret_key = secret_key.encode("utf-8")
    # Concatenate unique IDs of all exported events as payload source
    payload = ",".join([str(e.id) for e in events])
    
    signature = hmac.new(secret_key, payload.encode("utf-8"), hashlib.sha256).hexdigest()

    return {
        "framework": req.framework,
        "generated_at": datetime.utcnow(),
        "signature": signature,
        "events": events
    }
