export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DashboardStats {
  knowledgeHealthScore: number;
  activeSources: number;
  connectedSources: number;
  syncingSources: number;
  stalledSources: number;
  disconnectedSources: number;
  newSources: number;
  totalChunks: number;
  staleChunks: number;
  zombieChunks: number;
  activeChunks: number;
  stalePct: number;
  oldestStaleDays: number;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  chunk_id?: string;
  document_id?: string;
  agent_id?: string;
  old_version?: number;
  new_version?: number;
  status: string;
  action: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  type: string;
  status: string;
  chunks: number;
  embeddings: number;
  lastSync: string;
  health: number;
}

export interface Chunk {
  id: string;
  documentTitle: string;
  source: string;
  status: string;
  validFrom: string;
  validTo: string;
  version: string;
  retrievalCount: number;
  content?: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  const data = await res.json();
  const total = data.total_chunks ?? 0;
  const stale = data.stale_chunks ?? 0;
  const zombie = data.zombie_chunks ?? 0;
  return {
    knowledgeHealthScore: data.health_score ?? 100.0,
    activeSources: data.active_sources ?? 0,
    connectedSources: data.connected_sources ?? 0,
    syncingSources: data.syncing_sources ?? 0,
    stalledSources: data.stalled_sources ?? 0,
    disconnectedSources: data.disconnected_sources ?? 0,
    newSources: data.new_sources ?? 0,
    totalChunks: total,
    staleChunks: stale,
    zombieChunks: zombie,
    activeChunks: total - zombie - stale,
    stalePct: data.stale_pct ?? (total ? Math.round((stale / total) * 100) : 0),
    oldestStaleDays: data.oldest_stale_days ?? 0
  };
}

export async function getAuditEvents(): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/api/audit`);
  if (!res.ok) throw new Error("Failed to fetch audit events");
  return res.json();
}

export async function exportAuditEvents(framework: string, dateFrom?: string, dateTo?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/audit/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ framework, date_from: dateFrom, date_to: dateTo }),
  });
  if (!res.ok) throw new Error("Failed to export audit events");
  return res.json();
}


export async function getSources(): Promise<Source[]> {
  const res = await fetch(`${API_BASE}/api/sources`);
  if (!res.ok) throw new Error("Failed to fetch sources");
  return res.json();
}

export async function connectSource(name: string, type: string, api_key: string, workspace_id: string): Promise<Source> {
  const res = await fetch(`${API_BASE}/api/sources/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type, api_key, workspace_id }),
  });
  if (!res.ok) throw new Error("Failed to connect source");
  return res.json();
}

export async function getChunks(): Promise<Chunk[]> {
  const res = await fetch(`${API_BASE}/api/chunks`);
  if (!res.ok) throw new Error("Failed to fetch chunks");
  const data = await res.json();
  const items = (data && typeof data === "object" && Array.isArray(data.items)) ? data.items : (Array.isArray(data) ? data : []);
  return items.map((c: any) => ({
    id: c.id,
    documentTitle: c.document_title ?? c.documentTitle ?? "Untitled Document",
    source: c.source_name ?? c.source ?? "System",
    status: c.status,
    validFrom: c.valid_from ? new Date(c.valid_from).toLocaleDateString() : (c.validFrom ?? ""),
    validTo: c.valid_to ? new Date(c.valid_to).toLocaleDateString() : (c.validTo ?? ""),
    version: String(c.version ?? 1),
    retrievalCount: Number(c.retrieval_count ?? c.retrievalCount ?? 0),
    content: c.content
  }));
}

export async function invalidateChunk(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chunks/${id}/invalidate`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to invalidate chunk");
}

export interface SimulationWeekData {
  week: number;
  risk_score: number;
  total_chunks: number;
  stale_chunks: number;
  color: string;
}

export interface SimulationDepartmentHeatmap {
  department: string;
  framework: string;
  weeks: SimulationWeekData[];
  avg_risk: number;
}

export interface SimulationSummary {
  revenue_at_risk: number;
  customers_affected: number;
  regulatory_tier: string;
  confidence: number;
  total_events_analyzed: number;
  stale_events: number;
  overall_stale_ratio: number;
}

export interface SimulationWorkflow {
  name: string;
  rate: string;
}

export interface SimulationResponse {
  heatmap: SimulationDepartmentHeatmap[];
  summary: SimulationSummary;
  regulatory_exposure: Record<string, number>;
  top_workflows: SimulationWorkflow[];
}

export async function getSimulationData(): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/api/simulation/heatmap`);
  if (!res.ok) throw new Error("Failed to fetch simulation data");
  return res.json();
}

export interface Policy {
  id: string;
  name: string;
  scope: string;
  ttl_days: number;
  document_type?: string;
  risk_level?: string;
  owner_email: string;
  status: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  agent_ids: string[];
  regulatory_frameworks: string[];
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: string;
  source_ids: string[];
  health_score: number;
  stale_count: number;
  created_at: string;
}

export async function getPolicies(): Promise<Policy[]> {
  const res = await fetch(`${API_BASE}/api/policies`);
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

export async function createPolicy(
  name: string,
  scope: string,
  ttl_days: number,
  document_type: string | undefined,
  risk_level: string | undefined,
  owner_email: string
): Promise<{ policy_id: string; affected_chunks: number }> {
  const res = await fetch(`${API_BASE}/api/policies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, scope, ttl_days, document_type, risk_level, owner_email }),
  });
  if (!res.ok) throw new Error("Failed to create policy");
  return res.json();
}

export async function getDepartments(): Promise<Department[]> {
  const res = await fetch(`${API_BASE}/api/simulation/departments`);
  if (!res.ok) throw new Error("Failed to fetch departments");
  return res.json();
}

export async function createOrUpdateDepartment(
  name: string,
  agent_ids: string[],
  regulatory_frameworks: string[]
): Promise<Department> {
  const res = await fetch(`${API_BASE}/api/simulation/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, agent_ids, regulatory_frameworks }),
  });
  if (!res.ok) throw new Error("Failed to configure department");
  return res.json();
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/simulation/departments/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete department");
}

export async function getAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/api/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

export interface RemediationWorkflow {
  id: string;
  type: "reembed" | "block" | "resync";
  status: "open" | "resolved";
  title: string;
  description: string;
  source_name?: string;
  affected_count: number;
  est_time: string;
}

export async function getRemediationWorkflows(): Promise<RemediationWorkflow[]> {
  const res = await fetch(`${API_BASE}/api/remediation/workflows`);
  if (!res.ok) throw new Error("Failed to fetch remediation workflows");
  return res.json();
}

export async function executeRemediation(workflowId: string): Promise<{ success: boolean; detail: string; results?: any }> {
  const res = await fetch(`${API_BASE}/api/remediation/${workflowId}/execute`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to execute remediation workflow");
  return res.json();
}

export async function reembedChunk(id: string): Promise<{ success: boolean; detail: string }> {
  const res = await fetch(`${API_BASE}/api/chunks/${id}/reembed`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to reembed chunk");
  return res.json();
}

export interface LineageGraphResponse {
  nodes: any[];
  edges: any[];
  height: number;
}

export async function getLineageGraph(): Promise<LineageGraphResponse> {
  const res = await fetch(`${API_BASE}/api/lineage/graph`);
  if (!res.ok) throw new Error("Failed to fetch lineage graph");
  return res.json();
}

export async function getDashboardDrift(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/dashboard/drift`);
  if (!res.ok) throw new Error("Failed to fetch dashboard drift data");
  return res.json();
}

export async function getActiveSourcesSparkline(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/dashboard/sparklines/sources`);
  if (!res.ok) throw new Error("Failed to fetch sources sparkline");
  return res.json();
}

export async function getStaleChunksSparkline(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/dashboard/sparklines/chunks`);
  if (!res.ok) throw new Error("Failed to fetch chunks sparkline");
  return res.json();
}

