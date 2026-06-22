import os
import logging
import random
from typing import List, Dict, Any
from uuid import UUID
from openai import AsyncOpenAI
from qdrant_client.models import Distance, VectorParams, PointStruct
from database import qdrant_client

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
COLLECTION_NAME = "chrona_chunks"
VECTOR_DIMENSION = 1536  # Default for text-embedding-3-small

# Configure OpenAI client
if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("sk-..."):
    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
else:
    openai_client = None
    logger.info("OpenAI API key not set or placeholder. Embeddings will run in MOCK mode.")

async def init_qdrant_collection():
    """Ensure the Qdrant collection exists."""
    try:
        collections = await qdrant_client.get_collections()
        exists = any(c.name == COLLECTION_NAME for c in collections.collections)
        if not exists:
            await qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=VECTOR_DIMENSION, distance=Distance.COSINE),
            )
            logger.info(f"Created Qdrant collection: {COLLECTION_NAME}")
    except Exception as e:
        logger.warning(f"Could not initialize Qdrant collection: {e}. If Qdrant is offline, vector operations will be bypassed/mocked.")

async def embed_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates embeddings for chunks using OpenAI text-embedding-3-small in batches of 100,
    stores them in Qdrant, and returns list of dicts: {"chunk_id": UUID, "embedding_id": str}
    """
    if not chunks:
        return []

    # Make sure collection exists
    await init_qdrant_collection()

    results = []
    
    # Process in batches of 100
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]
        
        # 1. Generate Embeddings
        embeddings = []
        if openai_client:
            try:
                response = await openai_client.embeddings.create(
                    input=texts,
                    model="text-embedding-3-small"
                )
                embeddings = [item.embedding for item in response.data]
            except Exception as e:
                logger.error(f"OpenAI Embeddings API call failed: {e}. Falling back to mock embeddings.")
                embeddings = [[random.uniform(-0.1, 0.1) for _ in range(VECTOR_DIMENSION)] for _ in batch]
        else:
            # Mock mode
            embeddings = [[random.uniform(-0.1, 0.1) for _ in range(VECTOR_DIMENSION)] for _ in batch]

        # 2. Store in Qdrant
        points = []
        for idx, item in enumerate(batch):
            chunk_id = item["id"]
            point_id = str(chunk_id)
            vector = embeddings[idx]
            payload = {
                "chunk_id": str(chunk_id),
                "document_id": str(item["document_id"]),
                "source_id": str(item["source_id"]),
                "content": item["content"]
            }
            points.append(
                PointStruct(id=point_id, vector=vector, payload=payload)
            )
            results.append({
                "chunk_id": chunk_id,
                "embedding_id": point_id
            })

        try:
            await qdrant_client.upsert(
                collection_name=COLLECTION_NAME,
                wait=True,
                points=points
            )
        except Exception as e:
            logger.warning(f"Failed to upsert points to Qdrant: {e}. Proceeding in mock/fallback mode.")

    return results
