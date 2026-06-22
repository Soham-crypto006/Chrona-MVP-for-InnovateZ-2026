import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    status = Column(String, default="disconnected")  # connected, syncing, error
    api_key_encrypted = Column(String, nullable=True)
    workspace_id = Column(String, nullable=True)
    last_sync = Column(DateTime, nullable=True)
    health_score = Column(Float, default=100.0)
    owner_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    documents = relationship("Document", back_populates="source", cascade="all, delete-orphan")
    chunks = relationship("Chunk", back_populates="source", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=False)
    external_id = Column(String, nullable=False)
    title = Column(String, nullable=True)
    url = Column(String, nullable=True)
    content_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    source = relationship("Source", back_populates="documents")
    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="document")


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id"), nullable=False)
    content = Column(Text, nullable=False)
    embedding_id = Column(String, nullable=True)  # Qdrant point ID
    version = Column(Integer, default=1)
    status = Column(String, default="active")  # active, zombie, expired, invalidated
    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_to = Column(DateTime, nullable=True)
    chunk_index = Column(Integer, nullable=False)
    token_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="chunks")
    source = relationship("Source", back_populates="chunks")
    audit_events = relationship("AuditEvent", back_populates="chunk")

    @property
    def document_title(self) -> Optional[str]:
        return self.document.title if self.document else None

    @property
    def source_name(self) -> Optional[str]:
        return self.source.name if self.source else None

    @property
    def retrieval_count(self) -> int:
        return sum(1 for e in self.audit_events if e.event_type == "chunk_retrieved")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    scope = Column(String, nullable=False)
    ttl_days = Column(Integer, nullable=False)
    document_type = Column(String, nullable=True)
    risk_level = Column(String, nullable=True)
    owner_email = Column(String, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    model = Column(String, nullable=False)
    status = Column(String, default="active")
    source_ids = Column(JSON, default=list)  # List of source UUID strings
    health_score = Column(Float, default=100.0)
    stale_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    audit_events = relationship("AuditEvent", back_populates="agent")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, nullable=False)
    chunk_id = Column(UUID(as_uuid=True), ForeignKey("chunks.id"), nullable=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    old_version = Column(Integer, nullable=True)
    new_version = Column(Integer, nullable=True)
    status = Column(String, nullable=False)
    action = Column(String, nullable=False)
    event_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunk = relationship("Chunk", back_populates="audit_events")
    document = relationship("Document", back_populates="audit_events")
    agent = relationship("Agent", back_populates="audit_events")


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    org_id = Column(String, nullable=True)
    agent_ids = Column(JSON, default=list)  # Array of agent UUID strings
    regulatory_frameworks = Column(JSON, default=list)  # e.g. ["SOC2", "HIPAA", "EU_AI_ACT"]
    created_at = Column(DateTime, default=datetime.utcnow)

    simulation_results = relationship("SimulationResult", back_populates="department", cascade="all, delete-orphan")


class SimulationResult(Base):
    __tablename__ = "simulation_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    total_chunks_retrieved = Column(Integer, default=0)
    stale_chunks_retrieved = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)  # 0.0 to 1.0
    revenue_at_risk = Column(Float, default=0.0)
    customers_affected = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="simulation_results")
