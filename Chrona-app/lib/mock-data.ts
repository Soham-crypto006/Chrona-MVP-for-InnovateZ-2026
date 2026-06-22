// lib/mock-data.ts
// All mock data for CHRONA frontend.

export const mockStats = {
  knowledgeHealthScore: 88,
  activeSources: 2341,
  connectedSources: 2102,
  syncingSources: 239,
  stalledSources: 5,
  disconnectedSources: 239,
  newSources: 239,
  totalChunks: 12400000,
  staleChunks: 1128,
  zombieChunks: 7,
  activeChunks: 11270000,
  stalePct: 15.6,
  oldestStaleDays: 128,
}

export const mockSources = [
  { id: "src_001", name: "Confluence - Engineering", type: "confluence", status: "connected", chunks: 1200000, embeddings: 1200000, lastSync: "2m ago", health: 98 },
  { id: "src_002", name: "SharePoint - Corporate", type: "sharepoint", status: "connected", chunks: 3400000, embeddings: 3400000, lastSync: "5m ago", health: 96 },
  { id: "src_003", name: "Notion - Product Docs", type: "notion", status: "connected", chunks: 1100000, embeddings: 1100000, lastSync: "12m ago", health: 93 },
  { id: "src_004", name: "Slack - Team Channels", type: "slack", status: "connected", chunks: 987000, embeddings: 987000, lastSync: "15m ago", health: 91 },
  { id: "src_005", name: "GitHub - Repositories", type: "github", status: "connected", chunks: 1600000, embeddings: 1600000, lastSync: "18m ago", health: 90 },
  { id: "src_006", name: "Google Drive - Shared", type: "gdrive", status: "disconnected", chunks: 0, embeddings: 0, lastSync: "2h ago", health: 0 },
  { id: "src_007", name: "Salesforce - Knowledge", type: "salesforce", status: "connected", chunks: 842000, embeddings: 842000, lastSync: "22m ago", health: 89 },
]

export const mockChunks = [
  { id: "chk_001", documentTitle: "Q2 Compliance Policy v3", source: "Confluence", status: "active", validFrom: "2025-01-15", validTo: "2025-12-31", version: "3.0", retrievalCount: 847 },
  { id: "chk_002", documentTitle: "Pricing Policy 2024", source: "SharePoint", status: "zombie", validFrom: "2024-01-01", validTo: "2024-12-31", version: "1.0", retrievalCount: 234 },
  { id: "chk_003", documentTitle: "HR Onboarding SOP v2", source: "Notion", status: "expired", validFrom: "2024-06-01", validTo: "2025-01-01", version: "2.0", retrievalCount: 102 },
  { id: "chk_004", documentTitle: "Engineering Runbook v5", source: "Confluence", status: "active", validFrom: "2025-03-01", validTo: "2026-03-01", version: "5.0", retrievalCount: 1203 },
  { id: "chk_005", documentTitle: "Legal Terms v1", source: "SharePoint", status: "zombie", validFrom: "2023-01-01", validTo: "2023-12-31", version: "1.0", retrievalCount: 56 },
  { id: "chk_006", documentTitle: "Product Roadmap Q3", source: "Notion", status: "active", validFrom: "2025-04-01", validTo: "2025-09-30", version: "2.1", retrievalCount: 432 },
  { id: "chk_007", documentTitle: "Security Policy v4", source: "Confluence", status: "active", validFrom: "2025-02-01", validTo: "2026-02-01", version: "4.0", retrievalCount: 678 },
]

export const mockAuditTrail = [
  { id: "EVT-9f3a7b2c", time: "18:24:31", action: "Vector re-embedded", model: "text-embedding-3-large", source: "Confluence — Product Roa...", status: "compliant" },
  { id: "EVT-8a7b2c1d", time: "18:22:18", action: "Drift threshold breached", model: "gpt-4o-2025-08", source: "Notion — Engineering Wiki", status: "info" },
  { id: "EVT-7b6c1d8a", time: "18:18:45", action: "Agent blocked from stale chunk", model: "claude-3.7-sonnet", source: "SharePoint — HR Policies", status: "blocked" },
  { id: "EVT-6c5d8e9f", time: "18:15:09", action: "Source connector synced", model: "text-embedding-3-large", source: "GitHub — Architecture D...", status: "info" },
  { id: "EVT-5d4e9f0a", time: "18:11:33", action: "Knowledge snapshot captured", model: "snapshot-v2.1", source: "Google Drive — Legal", status: "compliant" },
]

export const mockDriftData = [
  { date: "C1", semantic: 0.12, syntactic: 0.05, volume: 0.15, quality: 0.08 },
  { date: "C2", semantic: 0.18, syntactic: -0.02, volume: 0.22, quality: 0.12 },
  { date: "C3", semantic: 0.08, syntactic: 0.1, volume: 0.05, quality: 0.15 },
  { date: "C4", semantic: 0.35, syntactic: 0.15, volume: 0.18, quality: 0.22 },
  { date: "C5", semantic: 0.22, syntactic: 0.08, volume: 0.28, quality: 0.18 },
  { date: "C6", semantic: 0.15, syntactic: -0.05, volume: 0.12, quality: 0.25 },
  { date: "C7", semantic: 0.42, syntactic: 0.18, volume: 0.35, quality: 0.15 },
  { date: "C8", semantic: 0.28, syntactic: 0.12, volume: 0.22, quality: 0.28 },
  { date: "C9", semantic: 0.18, syntactic: -0.08, volume: 0.15, quality: 0.32 },
  { date: "D10", semantic: 0.32, syntactic: 0.22, volume: 0.28, quality: 0.2 },
  { date: "D11", semantic: 0.25, syntactic: 0.05, volume: 0.18, quality: 0.25 },
  { date: "D12", semantic: 0.38, syntactic: 0.15, volume: 0.32, quality: 0.18 },
  { date: "D13", semantic: 0.22, syntactic: -0.02, volume: 0.25, quality: 0.3 },
  { date: "D14", semantic: 0.15, syntactic: 0.08, volume: 0.12, quality: 0.22 },
  { date: "D15", semantic: 0.42, syntactic: 0.18, volume: 0.38, quality: 0.15 },
  { date: "D16", semantic: 0.28, syntactic: 0.12, volume: 0.22, quality: 0.28 },
  { date: "D17", semantic: 0.35, syntactic: -0.05, volume: 0.18, quality: 0.32 },
  { date: "D18", semantic: 0.18, syntactic: 0.15, volume: 0.28, quality: 0.25 },
  { date: "D19", semantic: 0.25, syntactic: 0.08, volume: 0.15, quality: 0.35 },
  { date: "D20", semantic: 0.38, syntactic: 0.22, volume: 0.32, quality: 0.2 },
  { date: "D21", semantic: 0.22, syntactic: -0.02, volume: 0.25, quality: 0.28 },
  { date: "D22", semantic: 0.32, syntactic: 0.12, volume: 0.18, quality: 0.32 },
  { date: "D23", semantic: 0.15, syntactic: 0.05, volume: 0.28, quality: 0.22 },
  { date: "D24", semantic: 0.42, syntactic: 0.18, volume: 0.35, quality: 0.18 },
  { date: "D25", semantic: 0.28, syntactic: -0.08, volume: 0.22, quality: 0.3 },
  { date: "D26", semantic: 0.18, syntactic: 0.15, volume: 0.15, quality: 0.25 },
  { date: "D27", semantic: 0.35, syntactic: 0.08, volume: 0.32, quality: 0.2 },
  { date: "D28", semantic: 0.22, syntactic: 0.12, volume: 0.25, quality: 0.35 },
  { date: "D29", semantic: 0.32, syntactic: -0.02, volume: 0.18, quality: 0.28 },
  { date: "D30", semantic: 0.45, syntactic: 0.22, volume: 0.38, quality: 0.22 },
]

export const mockGovernancePolicies = [
  { id: "pol_001", name: "Compliance Document TTL", description: "All compliance documents expire after 90 days", scope: "Compliance", ttlDays: 90, owner: "Sarah Chen", status: "active" },
  { id: "pol_002", name: "Pricing Policy Lock", description: "Pricing documents require manual approval before activation", scope: "Finance", ttlDays: 30, owner: "James Park", status: "active" },
  { id: "pol_003", name: "HR Document Lifecycle", description: "HR SOPs reviewed quarterly", scope: "HR", ttlDays: 120, owner: "Priya Sharma", status: "draft" },
  { id: "pol_004", name: "Engineering Runbook Freshness", description: "Engineering docs reviewed every 6 months", scope: "Engineering", ttlDays: 180, owner: "Alex Kim", status: "active" },
]

export const mockSparklineData = [
  [10, 15, 12, 18, 14, 20, 18, 22, 19, 25],
  [5, 8, 6, 9, 7, 11, 9, 13, 10, 14],
  [20, 18, 22, 19, 25, 21, 27, 23, 29, 26],
]

export const mockActiveSourcesSparkline = [
  { i: 0, v: 1800 },
  { i: 1, v: 1920 },
  { i: 2, v: 1870 },
  { i: 3, v: 2050 },
  { i: 4, v: 2010 },
  { i: 5, v: 2180 },
  { i: 6, v: 2120 },
  { i: 7, v: 2250 },
  { i: 8, v: 2200 },
  { i: 9, v: 2341 },
]

export const mockStaleChunksSparkline = [
  { i: 0, v: 980 },
  { i: 1, v: 1020 },
  { i: 2, v: 950 },
  { i: 3, v: 1100 },
  { i: 4, v: 1060 },
  { i: 5, v: 1150 },
  { i: 6, v: 1080 },
  { i: 7, v: 1200 },
  { i: 8, v: 1128 },
  { i: 9, v: 1128 },
]

export const mockAgentHealth = [
  { name: "Support GPT", health: 96, color: "#00D4FF" },
  { name: "Sales Copilot", health: 89, color: "#7C3AED" },
  { name: "Compliance Auditor", health: 72, color: "#F59E0B" },
  { name: "Eng RAG Bot", health: 50, color: "#EF4444" },
]

export const mockDriftQueue = [
  { file: "policy.md#rbac-roles", source: "Confluence", time: "3m ago", agents: 12, severity: "CRITICAL", score: 0.87 },
  { file: "api-v2.md#auth-tokens", source: "Notion", time: "12m ago", agents: 8, severity: "HIGH", score: 0.72 },
  { file: "incidents/2025-05.md", source: "GitHub", time: "1h ago", agents: 4, severity: "MEDIUM", score: 0.48 },
  { file: "pricing-q3.md", source: "SharePoint", time: "2h ago", agents: 6, severity: "HIGH", score: 0.69 },
  { file: "deploy-runbook.md", source: "Google Docs", time: "5h ago", agents: 2, severity: "LOW", score: 0.22 },
]

export const mockLineageNodes = [
  { id: "n1", label: "Engineering Wiki", type: "doc", x: 200, y: 220, health: 95 },
  { id: "n2", label: "auth-flow.mdPaul1z", type: "doc", x: 380, y: 180, health: 88 },
  { id: "n3", label: "deploy.mdRollback", type: "doc", x: 380, y: 280, health: 72 },
  { id: "n4", label: "api.v2.mdPolicies", type: "doc", x: 380, y: 350, health: 65 },
  { id: "n5", label: "API Reference", type: "chunk", x: 200, y: 350, health: 91 },
  { id: "n6", label: "vec_a8c1", type: "vector", x: 520, y: 180, health: 85 },
  { id: "n7", label: "vec_b2f4", type: "vector", x: 520, y: 260, health: 78 },
  { id: "n8", label: "vec_c943", type: "vector", x: 480, y: 360, health: 62 },
  { id: "n9", label: "policy.mdRbac", type: "doc", x: 350, y: 420, health: 81 },
  { id: "n10", label: "Support GPT", type: "agent", x: 650, y: 200, health: 96 },
  { id: "n11", label: "Eng RAG Bot", type: "agent", x: 650, y: 300, health: 50 },
  { id: "n12", label: "Security Policy", type: "doc", x: 200, y: 420, health: 90 },
  { id: "n13", label: "incidents.md", type: "doc", x: 380, y: 420, health: 81 },
  { id: "n14", label: "vec_e7d2", type: "vector", x: 600, y: 400, health: 70 },
  { id: "n15", label: "Compliance", type: "agent", x: 700, y: 400, health: 94 },
]

export const mockLineageEdges = [
  { from: "n1", to: "n2" },
  { from: "n1", to: "n3" },
  { from: "n5", to: "n4" },
  { from: "n2", to: "n6" },
  { from: "n3", to: "n7" },
  { from: "n4", to: "n8" },
  { from: "n6", to: "n10" },
  { from: "n7", to: "n11" },
  { from: "n12", to: "n9" },
  { from: "n9", to: "n13" },
  { from: "n13", to: "n14" },
  { from: "n14", to: "n15" },
  { from: "n8", to: "n11" },
]