import logging
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Agent
from schemas import AgentCreateRequest, AgentCreateResponse, AgentResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("", response_model=List[AgentResponse])
async def get_agents(db: AsyncSession = Depends(get_db)):
    """Returns all registered AI agents with health metrics."""
    stmt = select(Agent).order_by(Agent.created_at.desc())
    res = await db.execute(stmt)
    agents = res.scalars().all()
    
    # Map stored JSON source_ids back to UUID lists for schema compliance
    response_data = []
    for agent in agents:
        src_uuids = []
        if agent.source_ids:
            for s_id in agent.source_ids:
                try:
                    src_uuids.append(UUID(s_id))
                except (ValueError, TypeError):
                    pass
        
        response_data.append({
            "id": agent.id,
            "name": agent.name,
            "model": agent.model,
            "status": agent.status,
            "source_ids": src_uuids,
            "health_score": agent.health_score,
            "stale_count": agent.stale_count,
            "created_at": agent.created_at
        })
        
    return response_data

@router.post("", response_model=AgentCreateResponse)
async def create_agent(req: AgentCreateRequest, db: AsyncSession = Depends(get_db)):
    """Registers a new AI agent with dependency configurations."""
    # Convert list of UUIDs to list of strings for JSON field storage
    src_str_ids = [str(sid) for sid in req.source_ids]

    new_agent = Agent(
        name=req.name,
        model=req.model,
        source_ids=src_str_ids,
        health_score=100.0,
        stale_count=0,
        status="active"
    )
    db.add(new_agent)
    await db.commit()
    await db.refresh(new_agent)

    return {
        "agent_id": new_agent.id
    }
