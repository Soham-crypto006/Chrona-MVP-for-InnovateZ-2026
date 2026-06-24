# Chrona — AI Knowledge Compliance Platform

Chrona monitors the knowledge bases powering AI agents, detecting when documents become stale, drift semantically, or create compliance risk — before they cause incorrect AI outputs.

## What It Does

When an AI agent retrieves a stale or outdated document chunk, it may give wrong answers to users. Chrona tracks every document, chunk, vector embedding, and agent retrieval in real time, scores compliance risk across departments and regulatory frameworks (EU AI Act, HIPAA, SOC 2, ISO 27001), and gives compliance teams a dashboard to detect, investigate, and remediate knowledge drift before it becomes a liability.

## Live Deployment Link

Live Deployment (Frontend): https://chrona-mvp-for-innovate-z-git-33bc4b-soham-crypto006s-projects.vercel.app/dashboard

Live Backend API: https://chrona-mvp-for-innovatez-2026.onrender.com

## Core Features

- **Dashboard** — real-time compliance health score, active/stale/zombie chunk counts, drift timeline, agent monitor
- **Impact Simulator** — risk scoring per department per week using `stale_chunks/total_chunks × severity_weight × regulatory_multiplier`, capped at 1.0
- **Knowledge Lineage Graph** — visual Document → Chunk → Vector → Agent dependency map from real database relationships
- **Evidence Vault** — HMAC-SHA256 signed compliance export bundles, framework-filtered (SOC 2, HIPAA, EU AI Act, ISO 27001)
- **Chunk Explorer** — browse, filter, and invalidate knowledge chunks with Redis-backed blocklist cache
- **Audit Trail** — cryptographically signed audit log of every agent retrieval, invalidation, and remediation event
- **Remediation** — automated anomaly detection and one-click resolution for zombie/stale chunks
- **Natural Language Command Bar** — type queries like "show compliance risk for legal department" and the dashboard navigates and filters accordingly (powered by Anthropic claude-haiku-4-5)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Recharts, Framer Motion |
| Backend | FastAPI (Python), SQLAlchemy async, Alembic |
| Database | Supabase (PostgreSQL) |
| Vector Store | Qdrant Cloud |
| Cache | Redis (Upstash in production, local Homebrew in development) |
| LLM | Anthropic claude-haiku-4-5 (command bar query parsing) |
| Auth | Clerk (configured, not required for demo) |
| Embeddings | Mock mode (OpenAI integration exists in `services/embedder.py`, key intentionally unset — see Limitations) |

## Project Structure

```
Onecallsaul/
├── Chrona-app/          # Next.js frontend
│   ├── app/(dashboard)/ # All dashboard pages
│   ├── components/      # Shared UI components
│   ├── lib/
│   │   ├── api.ts       # All backend API calls, typed
│   │   └── mock-data.ts # Fallback data (used only when backend unreachable)
│   └── package.json
└── backend/             # FastAPI backend
    ├── main.py          # App entry point, CORS, router registration
    ├── database.py      # Supabase/Postgres + Qdrant + Redis connections
    ├── models.py        # SQLAlchemy ORM models
    ├── schemas.py       # Pydantic request/response schemas
    ├── routers/         # API route handlers
    │   ├── agents.py
    │   ├── audit.py
    │   ├── chunks.py
    │   ├── policies.py
    │   ├── remediation.py
    │   ├── simulation.py
    │   └── sources.py
    ├── services/        # Business logic
    │   ├── embedder.py      # Embedding service (mock mode without OpenAI key)
    │   ├── diff_engine.py   # Semantic drift detection (Jaccard fallback)
    │   ├── chunker.py
    │   ├── notion_connector.py
    │   └── retrieval_guard.py
    ├── seed_data.py     # Database seeding script
    └── requirements.txt
```

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Redis (via Homebrew: `brew install redis && brew services start redis`)
- Docker Desktop (only needed if running Qdrant locally — production uses Qdrant Cloud)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/chrona.git
cd chrona
```

### 2. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres?ssl=require
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=https://YOUR_CLUSTER.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
ENCRYPTION_KEY=your_fernet_key  # generate with: python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
GROQ_API_KEY=your_groq_api_key  # optional
NOTION_API_KEY=your_notion_api_key  # optional
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Seed the database
```bash
python seed_data.py
```

### 4. Frontend setup
```bash
cd ../Chrona-app
npm install
```

Create `Chrona-app/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Open `http://localhost:3000`

## Key Dependencies

### Backend
| Package | Purpose |
|---------|---------|
| fastapi | API framework |
| sqlalchemy | Async ORM |
| asyncpg | Async PostgreSQL driver |
| supabase | Supabase client |
| qdrant-client | Vector store client |
| redis | Cache/blocklist |
| anthropic | LLM for command bar parsing |
| cryptography | Fernet encryption for stored credentials |
| python-dotenv | Environment variable loading |

### Frontend
| Package | Purpose |
|---------|---------|
| next | React framework |
| recharts | Dashboard charts |
| framer-motion | Animations |
| sonner | Toast notifications |
| lucide-react | Icons |
| tailwind-merge | CSS utility merging |

## Environment Variables Reference

### Backend 
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `REDIS_URL` | Redis connection URL |
| `QDRANT_URL` | Qdrant cluster URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `ANTHROPIC_API_KEY` | Anthropic API key (for command bar) |
| `ENCRYPTION_KEY` | Fernet key for encrypting stored source credentials |
| `OPENAI_API_KEY` | OpenAI key for real embeddings (runs in mock mode without it) |
| `GROQ_API_KEY` | Groq API key (alternative LLM) |
| `NOTION_API_KEY` | Notion connector |
| `FRONTEND_URL` | Deployed frontend URL for CORS (set in production) |

### Frontend
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

## Sample / Mock Data

The app ships with `backend/seed_data.py` which populates the database with:
- 3 documents (Engineering Handbook, Production Deployment Guide, Customer Support Protocol)
- 3 chunks with real content, linked to Qdrant vectors
- 7 AI agents (Engineering Copilot, Legal Assistant, Sales GPT, HR Assistant, Finance Copilot, Support GPT, Marketing AI)
- Audit events, source connections, simulation results

Mock data fallbacks exist in `Chrona-app/lib/mock-data.ts` and are used **only** when the backend is unreachable — visible to users via an amber "Sample data — live connection unavailable" badge on affected sections.

## Known Limitations

| Feature | Status | Notes |
|---------|--------|-------|
| Embeddings | Mock mode | `services/embedder.py` exists but `OPENAI_API_KEY` intentionally unset — cost decision. Jaccard similarity fallback used for drift detection. |
| Sparkline trend charts | Snapshot only | Active Sources and Stale Chunks sparklines show current snapshot, not historical trend — no historical tracking table exists yet. Labeled "Snapshot only" in UI. |
| Simulation week-by-week data | Current state repeated | `/api/simulation/heatmap` computes risk from current chunk state applied across all weeks — no per-week historical chunk data. |
| Google Sign-In | Not implemented | Clerk dependency present but auth flow not completed. |
| OpenAI embeddings | Disabled | Real semantic similarity requires `OPENAI_API_KEY`. Currently uses Jaccard string overlap as fallback. |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Compliance health metrics |
| GET | `/api/dashboard/drift` | Drift score history by week |
| GET | `/api/dashboard/sparklines/sources` | Active sources sparkline |
| GET | `/api/dashboard/sparklines/chunks` | Stale chunks sparkline |
| GET | `/api/agents/health` | Agent health scores |
| POST | `/api/agents/{id}/remediate` | Trigger agent remediation |
| GET | `/api/sources` | List connected sources |
| POST | `/api/sources/connect` | Connect a new source |
| GET | `/api/chunks` | List knowledge chunks |
| POST | `/api/chunks/{id}/invalidate` | Invalidate a chunk |
| GET | `/api/audit` | Audit trail events |
| POST | `/api/audit/export` | Export signed compliance bundle |
| GET | `/api/simulation/heatmap` | Risk heatmap by department |
| GET | `/api/lineage/graph` | Knowledge lineage graph data |
| GET | `/api/remediation/workflows` | Active remediation workflows |
| POST | `/api/remediation/{id}/execute` | Execute remediation action |
| POST | `/api/query/parse` | Parse natural language query (Anthropic) |
| GET | `/api/demo/reset` | Reset database to seeded demo state |
| GET | `/api/demo/reset` | Reset database to seeded demo state |
