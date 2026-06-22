"use client"

import { useState, useEffect } from "react"
import { getAgents, getChunks, type Agent, type Chunk } from "@/lib/api"
import { toast } from "sonner"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import { Bot, RefreshCw } from "lucide-react"

/* ─── design tokens ─── */
const BG = "#080812"
const CARD_BG = "#0D0D1F"
const CARD_BORDER = "#1a1a2e"
const TEAL = "#00D4FF"
const PURPLE = "#7C3AED"
const GREEN = "#22C55E"
const AMBER = "#F59E0B"
const RED = "#EF4444"
const SLATE = "#94A3B8"
const SLATE_DIM = "#64748B"

const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 14,
  padding: 24,
}

// Mock Fallbacks in case DB doesn't have agents or has offline issues
const MOCK_AGENTS = [
  { id: "a1", name: "Support GPT", model: "gpt-4o", health_score: 96, stale_count: 12, source_ids: Array(4).fill(""), status: "active" },
  { id: "a2", name: "Sales Copilot", model: "claude-3.7", health_score: 89, stale_count: 28, source_ids: Array(3).fill(""), status: "active" },
  { id: "a3", name: "Compliance Auditor", model: "claude-3.7", health_score: 72, stale_count: 84, source_ids: Array(5).fill(""), status: "active" },
  { id: "a4", name: "Eng RAG Bot", model: "gpt-4o", health_score: 54, stale_count: 156, source_ids: Array(8).fill(""), status: "active" },
  { id: "a5", name: "Onboarding Buddy", model: "gemini-2.0", health_score: 91, stale_count: 4, source_ids: Array(2).fill(""), status: "active" },
  { id: "a6", name: "Legal Assistant", model: "claude-3.7", health_score: 68, stale_count: 58, source_ids: Array(6).fill(""), status: "active" },
]

export default function AgentExposurePage() {
  const [agents, setAgents] = useState<Agent[] | null>(null)
  const [staleChunks, setStaleChunks] = useState<Chunk[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgentName, setSelectedAgentName] = useState("Eng RAG Bot")
  const [usingMockData, setUsingMockData] = useState(false)

  const loadData = async () => {
    try {
      const [agentsData, chunksData] = await Promise.all([
        getAgents(),
        getChunks()
      ])
      
      // Filter for stale/zombie chunks to list in analysis
      const nonCompliant = chunksData.filter(c => c.status === "zombie" || c.status === "expired" || c.status === "invalidated")
      
      setStaleChunks(nonCompliant.length > 0 ? nonCompliant : chunksData.slice(0, 5))
      setAgents(agentsData.length > 0 ? agentsData : (MOCK_AGENTS as any[]))
      setUsingMockData(false)
      
      if (agentsData.length > 0) {
        setSelectedAgentName(agentsData[0].name)
      } else if (MOCK_AGENTS.length > 0) {
        setSelectedAgentName(MOCK_AGENTS[0].name)
      }
    } catch (err) {
      console.error(err)
      setAgents(MOCK_AGENTS as any[])
      setStaleChunks([])
      setUsingMockData(true)
      if (MOCK_AGENTS.length > 0) {
        setSelectedAgentName(MOCK_AGENTS[0].name)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading || !agents || !staleChunks) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${CARD_BORDER}`, borderTopColor: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const getHealthMeta = (score: number) => {
    if (score >= 90) return { label: "HEALTHY", color: GREEN }
    if (score >= 70) return { label: "DEGRADED", color: AMBER }
    return { label: "AT RISK", color: RED }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            AGENT EXPOSURE DASHBOARD
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              Per-agent knowledge health
            </h1>
            {usingMockData && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Inspect each production agent's vectorized dependencies and stale-chunk surface area.
          </p>
        </div>
        <button 
          onClick={loadData}
          style={{
            background: "transparent", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: "8px 16px",
            fontSize: 12, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
          }}
        >
          <RefreshCw size={14} /> Refresh metrics
        </button>
      </div>

      {/* ── AGENT CARDS GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {agents.map((agent) => {
          const meta = getHealthMeta(agent.health_score)
          const radius = 30;
          const strokeWidth = 6;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (agent.health_score / 100) * circumference;
          
          return (
            <div 
              key={agent.id} 
              onClick={() => setSelectedAgentName(agent.name)}
              style={{ 
                ...cardStyle, 
                padding: "20px 24px", 
                cursor: "pointer",
                borderColor: selectedAgentName === agent.name ? TEAL : CARD_BORDER,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                if (selectedAgentName !== agent.name) e.currentTarget.style.borderColor = `${TEAL}50`
              }}
              onMouseLeave={e => {
                if (selectedAgentName !== agent.name) e.currentTarget.style.borderColor = CARD_BORDER
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, paddingLeft: 8 }}>
                    <Bot size={16} color={TEAL} />
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#fff" }}>{agent.name}</h3>
                    <p style={{ margin: 0, fontSize: 11, color: SLATE_DIM }}>{agent.model}</p>
                  </div>
                </div>
                <span style={{ 
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                  color: meta.color, background: `${meta.color}15`, 
                  padding: "3px 8px", borderRadius: 4, border: `1px solid ${meta.color}30` 
                }}>
                  {meta.label}
                </span>
              </div>

              {/* Stats & Ring */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                {/* Ring Chart */}
                <div style={{ position: "relative", width: 72, height: 72 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    {/* Background Ring */}
                    <circle cx="36" cy="36" r={radius} fill="transparent" stroke="#1a1a2e" strokeWidth={strokeWidth} />
                    {/* Progress Ring */}
                    <circle 
                      cx="36" cy="36" r={radius} 
                      fill="transparent" 
                      stroke={meta.color} 
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 36 36)"
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{agent.health_score}<span style={{ fontSize: 12 }}>%</span></span>
                  </div>
                </div>

                {/* Right Stats */}
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>
                      {agent.source_ids ? agent.source_ids.length : 0}
                    </p>
                    <p style={{ fontSize: 10, color: SLATE_DIM, margin: 0 }}>dependencies</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: meta.color, margin: "0 0 2px" }}>{agent.stale_count}</p>
                    <p style={{ fontSize: 10, color: SLATE_DIM, margin: 0 }}>stale chunks</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── STALE CHUNK ANALYSIS ── */}
      <div style={{ ...cardStyle, padding: "24px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
              Stale chunk analysis · {selectedAgentName}
            </h2>
            <span style={{ 
              fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
              color: RED, background: `${RED}15`, 
              padding: "3px 8px", borderRadius: 4, border: `1px solid ${RED}30` 
            }}>
              ACTIVE ALERTS
            </span>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["DOCUMENT TITLE", "SOURCE", "VALIDITY LIMIT", "RETRIEVED", "STATUS"].map((head, i) => (
                <th key={i} style={{ 
                  textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                  color: SLATE_DIM, textTransform: "uppercase", paddingBottom: 16
                }}>
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staleChunks.map((chunk, i) => {
              const formattedDate = chunk.validTo ? new Date(chunk.validTo).toLocaleDateString() : "Never"
              const isZombie = chunk.status === "zombie"
              const statusColor = isZombie ? RED : AMBER
              
              return (
                <tr key={chunk.id} style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                  <td style={{ padding: "14px 0", fontSize: 13, color: "#fff", fontWeight: 600, fontFamily: "var(--font-sans), sans-serif" }}>
                    {chunk.documentTitle}
                  </td>
                  <td style={{ padding: "14px 0", fontSize: 12, color: SLATE }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <CompanyLogo name={chunk.source} size={14} />
                      {chunk.source}
                    </div>
                  </td>
                  <td style={{ padding: "14px 0", fontSize: 12, color: AMBER, fontWeight: 600 }}>
                    {formattedDate}
                  </td>
                  <td style={{ padding: "14px 0", fontSize: 12, color: "#fff", fontFamily: "var(--font-mono), monospace" }}>
                    {chunk.retrievalCount || 0}
                  </td>
                  <td style={{ padding: "14px 0" }}>
                    <span style={{ 
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                      color: statusColor, border: `1px solid ${statusColor}40`,
                      padding: "3px 8px", borderRadius: 4, background: `${statusColor}10`
                    }}>
                      {chunk.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
