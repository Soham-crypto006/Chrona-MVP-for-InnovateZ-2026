import asyncio
import json
import os
import random
import uuid
from datetime import datetime, timedelta

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv(".env")

# ---------------------------------------------------------------------------
# Event type distributions per department
# Each department has a base profile that controls the ratio of event types.
# Higher risk departments produce more violations and blocks.
# ---------------------------------------------------------------------------
DEPARTMENTS = [
    #  (name,        framework,    risk,  chunk_retrieved, zombie_blocked, policy_violation, chunk_invalidated)
    ("Engineering",  "SOC2",       0.30,  0.65,            0.15,           0.12,             0.08),
    ("Legal",        "EU_AI_ACT",  0.80,  0.30,            0.35,           0.25,             0.10),
    ("Sales",        "SOC2",       0.40,  0.55,            0.20,           0.15,             0.10),
    ("HR",           "HIPAA",      0.20,  0.70,            0.10,           0.12,             0.08),
    ("Finance",      "SOC2",       0.60,  0.40,            0.25,           0.20,             0.15),
    ("Support",      "SOC2",       0.50,  0.50,            0.22,           0.18,             0.10),
    ("Marketing",    "SOC2",       0.15,  0.72,            0.10,           0.10,             0.08),
]

# Status and action templates for each event type
EVENT_TEMPLATES = {
    "chunk_retrieved": {
        "status": "compliant",
        "action_tpl": "Active chunk retrieved for {dept}",
    },
    "zombie_blocked": {
        "status": "blocked",
        "action_tpl": "Stale chunk blocked for {dept}",
    },
    "policy_violation": {
        "status": "violation",
        "action_tpl": "Policy violation detected in {dept}",
    },
    "chunk_invalidated": {
        "status": "invalidated",
        "action_tpl": "Chunk invalidated by {dept} policy",
    },
}

BATCH_SIZE = 500  # insert + commit every N rows


def pick_event_type(weights: tuple[float, float, float, float]) -> str:
    """Weighted random choice across the four event types."""
    return random.choices(
        ["chunk_retrieved", "zombie_blocked", "policy_violation", "chunk_invalidated"],
        weights=weights,
        k=1,
    )[0]


async def seed():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError("DATABASE_URL not found in .env")

    engine = create_async_engine(database_url)

    # ------------------------------------------------------------------
    # Use engine.connect() so we can manually commit in batches
    # ------------------------------------------------------------------
    async with engine.connect() as conn:

        # ── Fetch existing agent IDs ──────────────────────────────────
        agents_result = await conn.execute(text("SELECT id FROM agents"))
        agent_rows = agents_result.fetchall()

        if not agent_rows:
            print("⚠️  No agents found — creating defaults …")

            default_agents = [
                ("Engineering Copilot", "gpt-4o"),
                ("Legal Assistant",     "claude-3.7"),
                ("Sales GPT",          "gpt-4o"),
                ("HR Assistant",       "claude-3.7"),
                ("Finance Copilot",    "gpt-4o"),
                ("Support GPT",       "gpt-4o"),
                ("Marketing AI",      "claude-3.7"),
            ]

            agent_insert = text("""
                INSERT INTO agents (id, name, model, status, health_score, stale_count, created_at)
                VALUES (:id, :name, :model, 'active', 100, 0, :created_at)
            """)

            for name, model in default_agents:
                await conn.execute(
                    agent_insert,
                    {
                        "id": uuid.uuid4(),
                        "name": name,
                        "model": model,
                        "created_at": datetime.now(),
                    },
                )

            await conn.commit()

            agents_result = await conn.execute(text("SELECT id FROM agents"))
            agent_rows = agents_result.fetchall()

        agent_ids = [row[0] for row in agent_rows]
        print(f"✅ Found {len(agent_ids)} agents")

        # ── Fetch existing chunk IDs ──────────────────────────────────
        chunks_result = await conn.execute(
            text("SELECT id, document_id FROM chunks LIMIT 50")
        )
        chunk_rows = chunks_result.fetchall()

        if not chunk_rows:
            print("❌ No chunks found — cannot seed audit events.")
            await engine.dispose()
            return

        chunk_ids = [row[0] for row in chunk_rows]
        document_ids = [row[1] for row in chunk_rows]
        print(f"✅ Found {len(chunk_ids)} chunks")

        # ── Prepare the INSERT statement ──────────────────────────────
        insert_stmt = text("""
            INSERT INTO audit_events (
                id,
                event_type,
                chunk_id,
                document_id,
                agent_id,
                status,
                action,
                metadata,
                created_at
            )
            VALUES (
                :id,
                :event_type,
                :chunk_id,
                :document_id,
                :agent_id,
                :status,
                :action,
                CAST(:metadata AS JSON),
                :created_at
            )
        """)

        # ── Generate 12 weeks of historical audit data ────────────────
        now = datetime.now()
        events_added = 0
        batch: list[dict] = []

        print(f"\n📊 Generating 12 weeks of audit data …")

        for week in range(12):
            week_start = now - timedelta(weeks=(12 - week))

            for dept_name, framework, risk, w_ret, w_zom, w_pol, w_inv in DEPARTMENTS:

                # More events per week for higher-risk departments
                base_events = random.randint(20, 60)
                num_events = int(base_events * (1 + risk * 0.5))

                for _ in range(num_events):

                    event_type = pick_event_type((w_ret, w_zom, w_pol, w_inv))
                    template = EVENT_TEMPLATES[event_type]

                    # Pick a random chunk; grab its matching document_id
                    chunk_idx = random.randrange(len(chunk_ids))

                    event_time = week_start + timedelta(
                        days=random.randint(0, 6),
                        hours=random.randint(0, 23),
                        minutes=random.randint(0, 59),
                        seconds=random.randint(0, 59),
                    )

                    batch.append(
                        {
                            "id": uuid.uuid4(),
                            "event_type": event_type,
                            "chunk_id": chunk_ids[chunk_idx],
                            "document_id": document_ids[chunk_idx],
                            "agent_id": random.choice(agent_ids),
                            "status": template["status"],
                            "action": template["action_tpl"].format(dept=dept_name),
                            "metadata": json.dumps(
                                {
                                    "department": dept_name,
                                    "framework": framework,
                                    "risk_level": risk,
                                    "week": week + 1,
                                }
                            ),
                            "created_at": event_time,
                        }
                    )

                    # ── Flush batch every BATCH_SIZE rows ─────────────
                    if len(batch) >= BATCH_SIZE:
                        await conn.execute(insert_stmt, batch)
                        await conn.commit()
                        events_added += len(batch)
                        print(f"   ✓ {events_added:,} records inserted …")
                        batch.clear()

        # ── Flush remaining rows ──────────────────────────────────────
        if batch:
            await conn.execute(insert_stmt, batch)
            await conn.commit()
            events_added += len(batch)
            batch.clear()

        # ── Final summary ─────────────────────────────────────────────
        print(f"\n✅ Seeded {events_added:,} new audit events")

        total_result = await conn.execute(
            text("SELECT COUNT(*) FROM audit_events")
        )
        print(f"✅ Total audit events in database: {total_result.scalar():,}")

        # Print per-type breakdown
        breakdown_result = await conn.execute(
            text("""
                SELECT event_type, COUNT(*) AS cnt
                FROM audit_events
                GROUP BY event_type
                ORDER BY cnt DESC
            """)
        )
        print("\n📈 Event type breakdown:")
        for row in breakdown_result.fetchall():
            print(f"   {row[0]:25s} → {row[1]:,}")

    await engine.dispose()
    print("\n🎉 Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed())