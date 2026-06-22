import logging
from typing import List, Dict, Any
from datetime import datetime
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import redis_client, AsyncSessionLocal
from models import Chunk

logger = logging.getLogger(__name__)

async def filter_chunks(chunk_ids: List[str], db: AsyncSession = None) -> Dict[str, Any]:
    """
    Checks chunk retrieval permissions by verifying:
    1. Redis blocklist (key: blocklist:<chunk_id>)
    2. Database status == 'active'
    3. Expiration date (valid_to < now)
    
    Returns:
    {
      "valid": [valid_chunk_ids],
      "blocked": [blocked_chunk_ids],
      "reasons": {chunk_id: reason_string}
    }
    """
    if not chunk_ids:
        return {"valid": [], "blocked": [], "reasons": {}}

    valid_ids = []
    blocked_ids = []
    reasons = {}

    # Normalize list to strings
    chunk_str_ids = [str(cid) for cid in chunk_ids]

    # 1. Check Redis blocklist using pipeline
    redis_blocked = {}
    try:
        async with redis_client.pipeline() as pipe:
            for cid in chunk_str_ids:
                pipe.get(f"blocklist:{cid}")
            pipe_results = await pipe.execute()
            
            for cid, res in zip(chunk_str_ids, pipe_results):
                if res is not None:
                    redis_blocked[cid] = res
    except Exception as e:
        logger.warning(f"Error reading blocklist from Redis: {e}. Fallback to database checks only.")

    # 2. Check Database status and expiry
    # If session is not provided (e.g. called from a background task or utility), create one
    local_session = False
    if db is None:
        db = AsyncSessionLocal()
        local_session = True

    try:
        # Convert string IDs back to UUIDs for DB query
        uuid_ids = []
        for cid in chunk_str_ids:
            try:
                uuid_ids.append(UUID(cid))
            except ValueError:
                blocked_ids.append(cid)
                reasons[cid] = "Invalid UUID format"

        if uuid_ids:
            stmt = select(Chunk).where(Chunk.id.in_(uuid_ids))
            res = await db.execute(stmt)
            db_chunks = res.scalars().all()
            db_chunks_map = {str(c.id): c for c in db_chunks}
        else:
            db_chunks_map = {}

        now = datetime.utcnow()

        for cid in chunk_str_ids:
            if cid in reasons:  # Already marked invalid UUID
                continue

            # Check Redis blocklist first
            if cid in redis_blocked:
                blocked_ids.append(cid)
                reasons[cid] = f"Blocked by cache: {redis_blocked[cid]}"
                continue

            chunk = db_chunks_map.get(cid)
            if not chunk:
                blocked_ids.append(cid)
                reasons[cid] = "Not found in database"
                continue

            # Check Status
            if chunk.status != "active":
                blocked_ids.append(cid)
                reasons[cid] = f"Status is '{chunk.status}' (must be 'active')"
                continue

            # Check Expiration
            if chunk.valid_to and chunk.valid_to < now:
                blocked_ids.append(cid)
                reasons[cid] = f"Expired at {chunk.valid_to.isoformat()}"
                continue

            # All checks pass
            valid_ids.append(cid)

    finally:
        if local_session:
            await db.close()

    return {
        "valid": valid_ids,
        "blocked": blocked_ids,
        "reasons": reasons
    }
