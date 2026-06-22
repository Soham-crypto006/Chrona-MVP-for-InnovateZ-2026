from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy import text
from database import get_db
from datetime import datetime, timezone, timedelta
from uuid import UUID, uuid4
from typing import List, Optional
from models import Department, Agent
from schemas import DepartmentResponse, DepartmentSetupItem

router = APIRouter(prefix="/simulation", tags=["Simulation"])

FRAMEWORK_SEVERITIES = {
    "EU_AI_ACT": 3.0,
    "HIPAA": 2.5,
    "SOC2": 1.5,
    "ISO27001": 1.2,
}

REGULATORY_MULTIPLIERS = {
    "EU_AI_ACT": 1.8,
    "HIPAA": 1.6,
    "SOC2": 1.3,
    "ISO27001": 1.2,
}

async def seed_departments_if_empty(db: AsyncSession):
    res = await db.execute(select(Department))
    existing = res.scalars().all()
    if not existing:
        agent_res = await db.execute(select(Agent))
        agents = agent_res.scalars().all()
        
        def find_agent_ids(keyword: str):
            return [str(a.id) for a in agents if keyword.lower() in a.name.lower()]
        
        defaults = [
            ("Engineering", ["SOC2"], find_agent_ids("engineering") or find_agent_ids("eng")),
            ("Legal", ["EU_AI_ACT"], find_agent_ids("legal")),
            ("Sales", ["SOC2"], find_agent_ids("sales")),
            ("HR", ["HIPAA"], find_agent_ids("hr")),
            ("Finance", ["SOC2"], find_agent_ids("finance")),
            ("Support", ["SOC2"], find_agent_ids("support")),
            ("Marketing", ["SOC2"], find_agent_ids("marketing")),
        ]
        
        for name, frameworks, a_ids in defaults:
            dept = Department(
                name=name,
                regulatory_frameworks=frameworks,
                agent_ids=a_ids
            )
            db.add(dept)
        await db.commit()

@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(db: AsyncSession = Depends(get_db)):
    """Lists all configured enterprise departments."""
    await seed_departments_if_empty(db)
    res = await db.execute(select(Department).order_by(Department.created_at.asc()))
    return res.scalars().all()

@router.post("/departments", response_model=DepartmentResponse)
async def create_or_update_department(req: DepartmentSetupItem, db: AsyncSession = Depends(get_db)):
    """Creates or updates a department's workspace configuration."""
    stmt = select(Department).where(Department.name == req.name)
    res = await db.execute(stmt)
    dept = res.scalars().first()

    if dept:
        dept.agent_ids = req.agent_ids
        dept.regulatory_frameworks = req.regulatory_frameworks
    else:
        dept = Department(
            name=req.name,
            agent_ids=req.agent_ids,
            regulatory_frameworks=req.regulatory_frameworks
        )
        db.add(dept)

    await db.commit()
    await db.refresh(dept)
    return dept

@router.delete("/departments/{id}")
async def delete_department(id: UUID, db: AsyncSession = Depends(get_db)):
    """Deletes a department by ID."""
    stmt = delete(Department).where(Department.id == id)
    res = await db.execute(stmt)
    await db.commit()
    return {"success": True}

@router.get("/heatmap")
async def get_heatmap(db: AsyncSession = Depends(get_db)):
    await seed_departments_if_empty(db)
    
    res = await db.execute(select(Department).order_by(Department.created_at.asc()))
    departments = res.scalars().all()
    
    now = datetime.utcnow()
    start_limit = now - timedelta(weeks=12)
    
    # Fetch aggregated audit events grouped by department and week_index directly from database
    result = await db.execute(text("""
        SELECT 
            ae.metadata::jsonb->>'department' as department,
            LEAST(11, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (ae.created_at - :start_limit)) / (7 * 24 * 3600))::integer)) as week_idx,
            c.id as chunk_id,
            c.status as chunk_status
        FROM audit_events ae
        JOIN chunks c ON ae.chunk_id = c.id
        WHERE ae.created_at >= :start_limit AND ae.metadata::jsonb->>'department' IS NOT NULL
    """), {"start_limit": start_limit})
    rows = result.fetchall()

    # Group by (department, week_idx) to get unique chunks
    buckets_chunks = {}
    for row in rows:
        dept, week_idx, chunk_id, chunk_status = row
        key = (dept, week_idx)
        if key not in buckets_chunks:
            buckets_chunks[key] = set()
        buckets_chunks[key].add((chunk_id, chunk_status))

    # Populate buckets dictionary with total and stale counts
    buckets = {}
    for key, unique_chunks in buckets_chunks.items():
        total = len(unique_chunks)
        stale = sum(1 for cid, cstatus in unique_chunks if cstatus in ("zombie", "expired", "invalidated"))
        buckets[key] = {"total": total, "stale": stale}

    heatmap = []
    total_stale = 0
    total_retrieved = 0

    for dept in departments:
        dept_weeks = []
        framework = "SOC2"
        severity = 1.0
        multiplier = 1.0

        if dept.regulatory_frameworks:
            max_val = -1
            for fw in dept.regulatory_frameworks:
                sev = FRAMEWORK_SEVERITIES.get(fw, 1.0)
                mult = REGULATORY_MULTIPLIERS.get(fw, 1.0)
                if sev * mult > max_val:
                    max_val = sev * mult
                    framework = fw
                    severity = sev
                    multiplier = mult

        for week in range(12):
            key = (dept.name, week)
            bucket = buckets.get(key, {"total": 0, "stale": 0})
            total = bucket["total"]
            stale = bucket["stale"]

            stale_ratio = stale / total if total > 0 else 0.0
            risk_score = min(1.0, stale_ratio * severity * multiplier)

            total_stale += stale
            total_retrieved += total

            dept_weeks.append({
                "week": week + 1,
                "risk_score": round(risk_score, 3),
                "total_chunks": total,
                "stale_chunks": stale,
                "color": (
                    "#EF4444" if risk_score > 0.6
                    else "#F59E0B" if risk_score > 0.3
                    else "#22C55E"
                )
            })

        heatmap.append({
            "department": dept.name,
            "framework": framework,
            "weeks": dept_weeks,
            "avg_risk": round(
                sum(w["risk_score"] for w in dept_weeks) / 12, 3
            )
        })

    overall_stale_ratio = (
        total_stale / total_retrieved if total_retrieved > 0 else 0.0
    )
    revenue_at_risk = round(overall_stale_ratio * 12000000, 0)
    customers_affected = round(overall_stale_ratio * 50000, 0)

    regulatory_exposure = {
        "EU AI Act": round(min(99.0, overall_stale_ratio * 180 * 100), 1),
        "SOC 2 Type II": round(min(99.0, overall_stale_ratio * 130 * 100), 1),
        "ISO 27001": round(min(99.0, overall_stale_ratio * 120 * 100), 1),
        "HIPAA": round(min(99.0, overall_stale_ratio * 110 * 100), 1),
    }

    top_workflows = [
        {
            "name": "Customer onboarding",
            "rate": f"{round(overall_stale_ratio * 4200)}/day"
        },
        {
            "name": "Compliance Q&A",
            "rate": f"{round(overall_stale_ratio * 1800)}/day"
        },
        {
            "name": "Sales objection handling",
            "rate": f"{round(overall_stale_ratio * 900)}/day"
        },
    ]

    return {
        "heatmap": heatmap,
        "summary": {
            "revenue_at_risk": revenue_at_risk,
            "customers_affected": int(customers_affected),
            "regulatory_tier": "Tier 2",
            "confidence": 94,
            "total_events_analyzed": total_retrieved,
            "stale_events": total_stale,
            "overall_stale_ratio": round(overall_stale_ratio, 3)
        },
        "regulatory_exposure": regulatory_exposure,
        "top_workflows": top_workflows
    }

