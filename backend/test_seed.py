import asyncio
import os
import uuid
import json
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv(".env")


async def test_insert():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ DATABASE_URL not found")
        return

    engine = create_async_engine(database_url)

    try:
        async with engine.begin() as conn:

            # Get valid agent
            agent_result = await conn.execute(
                text("SELECT id FROM agents LIMIT 1")
            )
            agent_id = agent_result.scalar()

            # Get valid chunk
            chunk_result = await conn.execute(
                text("""
                    SELECT id, document_id
                    FROM chunks
                    LIMIT 1
                """)
            )

            chunk_row = chunk_result.fetchone()

            if not agent_id:
                print("❌ No agents found")
                return

            if not chunk_row:
                print("❌ No chunks found")
                return

            chunk_id = chunk_row.id
            document_id = chunk_row.document_id

            print(f"Agent ID: {agent_id}")
            print(f"Chunk ID: {chunk_id}")
            print(f"Document ID: {document_id}")

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

            # Test insert
            test_id = uuid.uuid4()

            await conn.execute(
                insert_stmt,
                {
                    "id": test_id,
                    "event_type": "test_insert",
                    "chunk_id": chunk_id,
                    "document_id": document_id,
                    "agent_id": agent_id,
                    "status": "compliant",
                    "action": "Test event insert",
                    "metadata": json.dumps(
                        {
                            "source": "seed_test",
                            "success": True
                        }
                    ),
                    "created_at": datetime.now(),  # timestamp without timezone
                },
            )

            print("✅ Insert successful")

            # Verify
            verify = await conn.execute(
                text("""
                    SELECT id, event_type
                    FROM audit_events
                    WHERE id = :id
                """),
                {"id": test_id},
            )

            row = verify.fetchone()

            if row:
                print("✅ Record verified")

            # Cleanup
            await conn.execute(
                text("""
                    DELETE FROM audit_events
                    WHERE id = :id
                """),
                {"id": test_id},
            )

            print("✅ Cleanup successful")

    except Exception as e:
        print("\n❌ ERROR:")
        print(type(e).__name__)
        print(str(e))

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_insert())