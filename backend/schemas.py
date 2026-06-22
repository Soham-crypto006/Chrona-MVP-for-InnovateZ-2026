from pydantic import BaseModel, Field, AliasChoices
from uuid import UUID
from datetime import datetime
from typing import List, Optional, Dict, Any

# --- Source Schemas ---
class SourceConnectRequest(BaseModel):
    type: str
    api_key: str
    workspace_id: str
    name: str

class SourceConnectResponse(BaseModel):
    source_id: UUID
    status: str
    estimated_chunks: int

class SourceResponse(BaseModel):
    id: UUID
    name: str
    type: str
    status: str
    workspace_id: Optional[str] = None
    last_sync: Optional[datetime] = None
    health_score: float
    owner_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SourceSyncResponse(BaseModel):
    new_chunks: int
    zombified_chunks: int
    unchanged: int

# --- Chunk Schemas ---
class ChunkResponse(BaseModel):
    id: UUID
    document_id: UUID
    source_id: UUID
    content: str
    embedding_id: Optional[str] = None
    version: int
    status: str
    valid_from: datetime
    valid_to: Optional[datetime] = None
    chunk_index: int
    token_count: int
    created_at: datetime
    document_title: Optional[str] = None
    source_name: Optional[str] = None
    retrieval_count: int = 0

    class Config:
        from_attributes = True

class PaginatedChunksResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ChunkResponse]

class ChunkInvalidateResponse(BaseModel):
    success: bool
    audit_event_id: UUID

# --- Policy Schemas ---
class PolicyCreateRequest(BaseModel):
    name: str
    scope: str
    ttl_days: int
    document_type: Optional[str] = None
    risk_level: Optional[str] = None
    owner_email: str

class PolicyResponse(BaseModel):
    id: UUID
    name: str
    scope: str
    ttl_days: int
    document_type: Optional[str] = None
    risk_level: Optional[str] = None
    owner_email: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PolicyCreateResponse(BaseModel):
    policy_id: UUID
    affected_chunks: int

# --- Agent Schemas ---
class AgentCreateRequest(BaseModel):
    name: str
    model: str
    source_ids: List[UUID]

class AgentResponse(BaseModel):
    id: UUID
    name: str
    model: str
    status: str
    source_ids: List[UUID]
    health_score: float
    stale_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class AgentCreateResponse(BaseModel):
    agent_id: UUID

# --- Audit Schemas ---
class AuditEventResponse(BaseModel):
    id: UUID
    event_type: str
    chunk_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    agent_id: Optional[UUID] = None
    old_version: Optional[int] = None
    new_version: Optional[int] = None
    status: str
    action: str
    event_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        validation_alias=AliasChoices("event_metadata", "metadata"),
        serialization_alias="metadata"
    )
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class AuditExportRequest(BaseModel):
    framework: str
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

class AuditExportResponse(BaseModel):
    framework: str
    generated_at: datetime
    signature: str
    events: List[AuditEventResponse]

# --- Dashboard Schemas ---
class DashboardStatsResponse(BaseModel):
    health_score: float
    active_sources: int
    stale_chunks: int
    zombie_chunks: int
    total_chunks: int
    connected_sources: int
    syncing_sources: int
    stalled_sources: int
    disconnected_sources: int
    new_sources: int
    stale_pct: int
    oldest_stale_days: int



# --- Simulation Schemas ---
class DepartmentSetupItem(BaseModel):
    name: str
    agent_ids: List[str]
    regulatory_frameworks: List[str]

class SimulationSetupRequest(BaseModel):
    departments: List[DepartmentSetupItem]

class SimulationSetupResponse(BaseModel):
    departments_created: int
    simulation_ready: bool

class SimulationRunRequest(BaseModel):
    weeks: int = 12
    department_ids: Optional[List[UUID]] = None  # None = run for all departments

class WeekData(BaseModel):
    week: int
    risk_score: float
    stale_chunks: int
    total_chunks: int
    revenue_at_risk: float
    customers_affected: int
    color: str  # hex color based on risk_score

class DepartmentHeatmapData(BaseModel):
    department: str
    department_id: UUID
    regulatory_frameworks: List[str]
    weeks: List[WeekData]

class RegulatoryExposure(BaseModel):
    framework: str
    exposure_score: int

class SimulationRunResponse(BaseModel):
    heatmap: List[DepartmentHeatmapData]
    total_revenue_at_risk: float
    regulatory_exposure: Dict[str, int]
    customers_affected: int
    confidence: int

class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    org_id: Optional[str] = None
    agent_ids: List[str]
    regulatory_frameworks: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SimulationResultResponse(BaseModel):
    id: UUID
    department_id: UUID
    week_number: int
    total_chunks_retrieved: int
    stale_chunks_retrieved: int
    risk_score: float
    revenue_at_risk: float
    customers_affected: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Remediation Schemas ---
class RemediationWorkflowResponse(BaseModel):
    id: str
    type: str  # reembed, block, resync
    status: str  # open, resolved
    title: str
    description: str
    source_name: Optional[str] = None
    affected_count: int
    est_time: str

