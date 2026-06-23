import os
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from celery import Celery

from database import Base, engine, get_db, AsyncSessionLocal
from models import Source, Document, Chunk, Policy, Agent, AuditEvent
from schemas import DashboardStatsResponse

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Celery Setup ---
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
celery_app = Celery("chrona_tasks", broker=CELERY_BROKER_URL, backend=CELERY_BROKER_URL)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Scheduled Beat configuration
celery_app.conf.beat_schedule = {
    "enforce-ttl-policies-hourly": {
        "task": "main.enforce_ttl_policies",
        "schedule": 3600.0,  # 1 hour
    },
    "compute-health-scores-every-15-min": {
        "task": "main.compute_health_scores",
        "schedule": 900.0,  # 15 minutes
    },
}

# --- FastAPI Lifespan (DB Table Creation) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup tables in PostgreSQL database
    logger.info("Initializing database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}. Ensure PostgreSQL is running.")
    
    yield
    # Shutdown logic if any
    await engine.dispose()

app = FastAPI(
    title="Chrona Backend API",
    description="Compliance Governance & Real-time Drift Detection Engine",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
async def root():
    return {
        "name": "Chrona API",
        "version": "1.0.0",
        "status": "live",
        "description": "AI Knowledge Compliance Platform — Version-Aware Knowledge Governance Engine",
        "docs": "/docs",
        "endpoints": "/api/dashboard/stats"
    }


# --- CORS Middleware Configuration ---
origins = ["https://chrona-mvp-for-innovate-z-git-33bc4b-soham-crypto006s-projects.vercel.app",os.getenv("FRONTEND_URL", ""),
    "http://localhost:3000",
    "http://localhost:3002",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
from routers.sources import router as sources_router, perform_sync_logic
from routers.chunks import router as chunks_router
from routers.policies import router as policies_router
from routers.agents import router as agents_router
from routers.audit import router as audit_router
from routers.simulation import router as simulation_router
from routers.remediation import router as remediation_router

app.include_router(sources_router, prefix="/api")
app.include_router(chunks_router, prefix="/api")
app.include_router(policies_router, prefix="/api")
app.include_router(agents_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(simulation_router, prefix="/api")
app.include_router(reremediation_router := remediation_router, prefix="/api")

@app.get("/api/lineage/graph", tags=["Lineage"])
async def get_lineage_graph(db: AsyncSession = Depends(get_db)):
    """Returns nodes and edges representing the Document -> Chunk -> Vector -> Agent relationship graph."""
    try:
        chunks_stmt = select(Chunk).options(
            selectinload(Chunk.document),
            selectinload(Chunk.source),
            selectinload(Chunk.audit_events)
        )
        chunks_res = await db.execute(chunks_stmt)
        chunks = chunks_res.scalars().all()

        agents_stmt = select(Agent)
        agents_res = await db.execute(agents_stmt)
        agents = agents_res.scalars().all()

        sources_stmt = select(Source)
        sources_res = await db.execute(sources_stmt)
        sources = sources_res.scalars().all()

        if not chunks or not agents:
            return {"nodes": [], "edges": []}

        nodes = []
        edges = []

        unique_doc_titles = list(set(c.document.title for c in chunks if c.document))
        max_nodes_in_col = max(
            len(chunks),
            len(agents),
            len(unique_doc_titles)
        )
        calculated_height = max(600, max_nodes_in_col * 85 + 100)
        vertical_span = calculated_height - 160

        # 1. Documents
        doc_map = {}
        for index, doc_title in enumerate(unique_doc_titles):
            doc_id = f"doc-{index}"
            doc_map[doc_title] = doc_id
            doc_span = len(unique_doc_titles) - 1 if len(unique_doc_titles) > 1 else 1
            y = 80 + (index * (vertical_span / doc_span))
            chunks_under_doc = [c for c in chunks if c.document and c.document.title == doc_title]
            nodes.append({
                "id": doc_id,
                "label": doc_title,
                "type": "doc",
                "x": 150,
                "y": y,
                "raw": {
                    "title": doc_title,
                    "type": "Enterprise Knowledge Base Reference",
                    "chunks_count": len(chunks_under_doc)
                }
            })

        # 2. Chunks
        chunk_map = {}
        for index, chunk in enumerate(chunks):
            chunk_node_id = f"chunk-{chunk.id}"
            chunk_map[chunk.id] = chunk_node_id
            chunk_span = len(chunks) - 1 if len(chunks) > 1 else 1
            y = 80 + (index * (vertical_span / chunk_span))
            nodes.append({
                "id": chunk_node_id,
                "label": f"Chunk #{index + 1}",
                "type": "chunk",
                "x": 400,
                "y": y,
                "raw": {
                    "id": str(chunk.id),
                    "documentTitle": chunk.document.title if chunk.document else "Untitled Document",
                    "source": chunk.source.name if chunk.source else "System",
                    "status": chunk.status,
                    "validFrom": chunk.valid_from.strftime("%m/%d/%Y") if chunk.valid_from else "",
                    "validTo": chunk.valid_to.strftime("%m/%d/%Y") if chunk.valid_to else "",
                    "version": str(chunk.version),
                    "retrievalCount": chunk.retrieval_count,
                    "content": chunk.content
                }
            })

            # Connect Doc -> Chunk
            if chunk.document and chunk.document.title in doc_map:
                edges.append({"from": doc_map[chunk.document.title], "to": chunk_node_id})

        # 3. Vectors
        vector_map = {}
        for index, chunk in enumerate(chunks):
            vector_node_id = f"vector-{chunk.id}"
            vector_map[chunk.id] = vector_node_id
            vector_span = len(chunks) - 1 if len(chunks) > 1 else 1
            y = 80 + (index * (vertical_span / vector_span))
            nodes.append({
                "id": vector_node_id,
                "label": f"Vector #{index + 1}",
                "type": "vector",
                "x": 650,
                "y": y,
                "raw": {
                    "id": str(chunk.id),
                    "dimensions": 1536,
                    "distance_metric": "cosine",
                    "status": chunk.status,
                    "embedding_id": chunk.embedding_id or ""
                }
            })

            # Connect Chunk -> Vector
            chunk_node_id = chunk_map.get(chunk.id)
            if chunk_node_id:
                edges.append({"from": chunk_node_id, "to": vector_node_id})

        # 4. Agents
        for index, agent in enumerate(agents):
            agent_node_id = f"agent-{agent.id}"
            agent_span = len(agents) - 1 if len(agents) > 1 else 1
            y = 80 + (index * (vertical_span / agent_span))
            nodes.append({
                "id": agent_node_id,
                "label": agent.name,
                "type": "agent",
                "x": 900,
                "y": y,
                "raw": {
                    "id": str(agent.id),
                    "name": agent.name,
                    "model": agent.model,
                    "status": agent.status,
                    "health_score": agent.health_score,
                    "stale_count": agent.stale_count,
                    "source_ids": agent.source_ids or []
                }
            })

            # Connect Vector -> Agent if agent has dependency on chunk's source
            for chunk in chunks:
                if chunk.source_id and agent.source_ids:
                    if str(chunk.source_id) in agent.source_ids:
                        vector_node_id = vector_map.get(chunk.id)
                        if vector_node_id:
                            edges.append({"from": vector_node_id, "to": agent_node_id})

        return {
            "nodes": nodes,
            "edges": edges,
            "height": calculated_height
        }
    except Exception as e:
        logger.error(f"Error in lineage graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Dashboard stats API Endpoint ---
@app.get("/api/dashboard/stats", response_model=DashboardStatsResponse, tags=["Dashboard"])
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Returns real-time KPIs: health scores, active sources, stale, zombie, and total chunks count."""
    now = datetime.utcnow()
    stale_cutoff = now - timedelta(days=30)
    
    # Combine all stats into a single query to reduce RTT
    stats_stmt = select(
        func.avg(Source.health_score).label("avg_health"),
        select(func.count(Source.id)).where(Source.status.in_(["connected", "syncing"])).scalar_subquery().label("active_sources"),
        select(func.count(Source.id)).where(Source.status == "connected").scalar_subquery().label("connected_sources"),
        select(func.count(Source.id)).where(Source.status == "syncing").scalar_subquery().label("syncing_sources"),
        select(func.count(Source.id)).where(Source.status == "error").scalar_subquery().label("stalled_sources"),
        select(func.count(Source.id)).where(Source.status == "disconnected").scalar_subquery().label("disconnected_sources"),
        select(func.count(Source.id)).where(Source.created_at >= stale_cutoff).scalar_subquery().label("new_sources"),
        select(func.count(Chunk.id)).where(Chunk.status == "active", Chunk.created_at < stale_cutoff).scalar_subquery().label("stale_chunks"),
        select(func.count(Chunk.id)).where(Chunk.status == "zombie").scalar_subquery().label("zombie_chunks"),
        select(func.count(Chunk.id)).scalar_subquery().label("total_chunks"),
        select(func.min(Chunk.created_at)).where(Chunk.status == "active", Chunk.created_at < stale_cutoff).scalar_subquery().label("oldest_stale_created_at")
    )
    
    res = await db.execute(stats_stmt)
    row = res.first()
    
    avg_health = row.avg_health if row else None
    health_score = round(avg_health, 2) if avg_health is not None else 100.0
    active_sources = row.active_sources if row else 0
    connected_sources = row.connected_sources if row else 0
    syncing_sources = row.syncing_sources if row else 0
    stalled_sources = row.stalled_sources if row else 0
    disconnected_sources = row.disconnected_sources if row else 0
    new_sources = row.new_sources if row else 0
    stale_chunks = row.stale_chunks if row else 0
    zombie_chunks = row.zombie_chunks if row else 0
    total_chunks = row.total_chunks if row else 0
    
    stale_pct = round((stale_chunks / total_chunks) * 100) if total_chunks > 0 else 0
    
    oldest_stale_created_at = row.oldest_stale_created_at if row else None
    if oldest_stale_created_at:
        oldest_stale_days = (now - oldest_stale_created_at).days
    else:
        oldest_stale_days = 0
        
    return {
        "health_score": health_score,
        "active_sources": active_sources,
        "stale_chunks": stale_chunks,
        "zombie_chunks": zombie_chunks,
        "total_chunks": total_chunks,
        "connected_sources": connected_sources,
        "syncing_sources": syncing_sources,
        "stalled_sources": stalled_sources,
        "disconnected_sources": disconnected_sources,
        "new_sources": new_sources,
        "stale_pct": stale_pct,
        "oldest_stale_days": oldest_stale_days
    }


# --- Dashboard drift API Endpoint ---
@app.get("/api/dashboard/drift", tags=["Dashboard"])
async def get_dashboard_drift(db: AsyncSession = Depends(get_db)):
    """
    Returns weekly drift history computed from real audit_events data.
    Groups events by week and calculates drift scores and Recharts-compatible metrics.
    """
    try:
        stmt = select(AuditEvent).order_by(AuditEvent.created_at.asc())
        res = await db.execute(stmt)
        events = res.scalars().all()

        if not events:
            return []

        # Group by week start date (Monday)
        from collections import defaultdict
        weeks_data = defaultdict(list)

        for e in events:
            week_start = e.created_at.date() - timedelta(days=e.created_at.weekday())
            weeks_data[week_start].append(e)

        sorted_weeks = sorted(weeks_data.keys())
        results = []

        for index, w_start in enumerate(sorted_weeks, start=1):
            week_events = weeks_data[w_start]
            total_events = len(week_events)
            
            # Count stale/flagged events
            stale_events = 0
            for e in week_events:
                is_stale = False
                if e.status not in ("compliant", "info"):
                    is_stale = True
                if e.event_type == "chunk_version_drift":
                    is_stale = True
                if is_stale:
                    stale_events += 1

            stale_ratio = stale_events / total_events if total_events > 0 else 0.0
            drift_score = round(stale_ratio * 100, 2)

            # Compute average semantic drift from actual similarity if available
            drift_similarities = []
            for e in week_events:
                if e.event_type == "chunk_version_drift" and e.event_metadata:
                    sim = e.event_metadata.get("similarity")
                    if sim is not None:
                        try:
                            drift_similarities.append(float(sim))
                        except (ValueError, TypeError):
                            pass
            
            if drift_similarities:
                avg_similarity = sum(drift_similarities) / len(drift_similarities)
                semantic_drift_val = 1.0 - avg_similarity
            else:
                semantic_drift_val = stale_ratio * 0.8

            semantic = round(semantic_drift_val, 3)
            syntactic = round(semantic_drift_val * 0.5, 3)
            
            volume_events = sum(1 for e in week_events if e.event_type in ("chunk_zombified", "chunk_expired", "chunk_invalidated", "policy_violation"))
            volume = round(volume_events / total_events if total_events > 0 else 0.0, 3)
            
            quality = round(max(0.0, 0.5 - stale_ratio * 0.5), 3)

            results.append({
                "week": index,
                "date": f"Week {index}",
                "drift_score": drift_score,
                "semantic": semantic,
                "syntactic": syntactic,
                "volume": volume,
                "quality": quality
            })

        return results
    except Exception as e:
        logger.error(f"Error computing dashboard drift: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Dashboard sparkline sources Endpoint ---
@app.get("/api/dashboard/sparklines/sources", tags=["Dashboard"])
async def get_active_sources_sparkline(db: AsyncSession = Depends(get_db)):
    """
    Returns active sources count sparkline.
    Since there is no historical tracking table for sources status/connections over time,
    we return a flat list containing the current active sources count snapshot.
    """
    try:
        stmt = select(func.count(Source.id)).where(Source.status.in_(["connected", "syncing"]))
        res = await db.execute(stmt)
        count = res.scalar() or 0
        return [{"i": i, "v": count} for i in range(10)]
    except Exception as e:
        logger.error(f"Error computing active sources sparkline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Dashboard sparkline chunks Endpoint ---
@app.get("/api/dashboard/sparklines/chunks", tags=["Dashboard"])
async def get_stale_chunks_sparkline(db: AsyncSession = Depends(get_db)):
    """
    Returns stale chunks count sparkline.
    Since there is no historical tracking table for stale chunks over time,
    we return a flat list containing the current stale chunks count snapshot.
    """
    try:
        now = datetime.utcnow()
        stale_cutoff = now - timedelta(days=30)
        stmt = select(func.count(Chunk.id)).where(Chunk.status == "active", Chunk.created_at < stale_cutoff)
        res = await db.execute(stmt)
        count = res.scalar() or 0
        return [{"i": i, "v": count} for i in range(10)]
    except Exception as e:
        logger.error(f"Error computing stale chunks sparkline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", tags=["System"])
async def health_check():
    """Simple API status endpoint."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


# --- Celery Task Declarations ---

@celery_app.task(name="main.sync_source")
def sync_source(source_id_str: str):
    """Celery task running sync routine for a given source."""
    async def _run():
        async with AsyncSessionLocal() as db:
            return await perform_sync_logic(UUID(source_id_str), db)
    return asyncio.run(_run())


@celery_app.task(name="main.enforce_ttl_policies")
def enforce_ttl_policies():
    """Scans and expires chunks whose valid_to date is in the past."""
    async def _run():
        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            stmt = select(Chunk).where(Chunk.status == "active", Chunk.valid_to < now)
            res = await db.execute(stmt)
            expired_chunks = res.scalars().all()
            
            for chunk in expired_chunks:
                chunk.status = "expired"
                audit = AuditEvent(
                    event_type="chunk_expired",
                    chunk_id=chunk.id,
                    document_id=chunk.document_id,
                    status="expired",
                    action="expire",
                    event_metadata={"reason": "Enforced by TTL scheduler"}
                )
                db.add(audit)
                
                # Mock sending warning email to the owner
                logger.info(f"[Email Notify] Compliance Alert: Chunk {chunk.id} has expired. Notified system administrator.")
                
            await db.commit()
            return len(expired_chunks)
    return asyncio.run(_run())


@celery_app.task(name="main.compute_health_scores")
def compute_health_scores():
    """Re-calculates data integrity health metrics for sources and AI agents."""
    async def _run():
        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            
            # 1. Update Sources health scores
            srcs_res = await db.execute(select(Source))
            sources = srcs_res.scalars().all()
            for s in sources:
                total_cnt = (await db.execute(select(func.count(Chunk.id)).where(Chunk.source_id == s.id))).scalar() or 0
                active_cnt = (await db.execute(select(func.count(Chunk.id)).where(Chunk.source_id == s.id, Chunk.status == "active"))).scalar() or 0
                s.health_score = (active_cnt / total_cnt * 100.0) if total_cnt > 0 else 100.0

            # 2. Update Agents health scores
            # Stale count increments if dependency source hasn't synced in 24 hours or source health < 80
            agents_res = await db.execute(select(Agent))
            agents = agents_res.scalars().all()
            for a in agents:
                stale_cnt = 0
                total_deps = len(a.source_ids) if a.source_ids else 0
                non_stale_deps = 0
                
                if a.source_ids:
                    for s_id_str in a.source_ids:
                        try:
                            s_id = UUID(s_id_str)
                            s_res = await db.execute(select(Source).where(Source.id == s_id))
                            src = s_res.scalars().first()
                            if src:
                                is_stale = False
                                if not src.last_sync or (now - src.last_sync) > timedelta(hours=24):
                                    is_stale = True
                                if src.health_score < 80.0:
                                    is_stale = True
                                
                                if is_stale:
                                    stale_cnt += 1
                                else:
                                    non_stale_deps += 1
                        except (ValueError, TypeError):
                            stale_cnt += 1
                
                a.stale_count = stale_cnt
                a.health_score = (non_stale_deps / total_deps * 100.0) if total_deps > 0 else 100.0

            await db.commit()
    return asyncio.run(_run())
