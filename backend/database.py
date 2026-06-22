import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from cryptography.fernet import Fernet
from dotenv import load_dotenv
from qdrant_client import AsyncQdrantClient
import redis.asyncio as aioredis

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is missing or empty. Startup aborted.")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()

try:
    cipher = Fernet(ENCRYPTION_KEY.encode())
except Exception:
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    cipher = Fernet(ENCRYPTION_KEY.encode())

def encrypt_key(key: str) -> str:
    if not key:
        return ""
    return cipher.encrypt(key.encode()).decode()

def decrypt_key(encrypted_key: str) -> str:
    if not encrypted_key:
        return ""
    return cipher.decrypt(encrypted_key.encode()).decode()

ssl_args = {"ssl": "require"} if ("supabase.co" in DATABASE_URL or "ssl=require" in DATABASE_URL) else {}

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args=ssl_args
)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)

qdrant_client = AsyncQdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY if QDRANT_API_KEY else None
)
