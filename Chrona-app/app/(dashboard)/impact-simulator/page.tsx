"use client"

import { useState, useEffect } from "react"
import { getSimulationData, type SimulationResponse } from "@/lib/api"
import { toast } from "sonner"
import {
  DollarSign,
  Scale,
  Users,
  Zap,
} from "lucide-react"

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

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: SLATE_DIM,
}

const cols = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"]

const MOCK_SIMULATION_RESPONSE: SimulationResponse = {
  heatmap: [
    {
      department: "Engineering",
      framework: "SOC2",
      weeks: [
        { week: 1, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 2, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 3, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 4, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 5, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 6, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 7, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 8, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 9, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 10, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 11, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 12, risk_score: 0.2, total_chunks: 100, stale_chunks: 20, color: "#166534" },
      ],
      avg_risk: 0.77
    },
    {
      department: "Sales",
      framework: "SOC2",
      weeks: [
        { week: 1, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 2, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 3, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 4, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 5, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 6, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 7, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 8, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 9, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
        { week: 10, risk_score: 0.2, total_chunks: 100, stale_chunks: 20, color: "#166534" },
        { week: 11, risk_score: 0.2, total_chunks: 100, stale_chunks: 20, color: "#166534" },
        { week: 12, risk_score: 0.2, total_chunks: 100, stale_chunks: 20, color: "#166534" },
      ],
      avg_risk: 0.69
    },
    {
      department: "Support",
      framework: "SOC2",
      weeks: [
        { week: 1, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 2, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 3, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 4, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 5, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 6, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 7, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
        { week: 8, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 9, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 10, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 11, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 12, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
      ],
      avg_risk: 0.46
    },
    {
      department: "Legal",
      framework: "EU_AI_ACT",
      weeks: [
        { week: 1, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 2, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 3, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 4, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 5, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
        { week: 6, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 7, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 8, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 9, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 10, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 11, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 12, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
      ],
      avg_risk: 0.38
    },
    {
      department: "HR",
      framework: "HIPAA",
      weeks: [
        { week: 1, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 2, risk_score: 0.9, total_chunks: 100, stale_chunks: 90, color: "#f43f5e" },
        { week: 3, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 4, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 5, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 6, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 7, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 8, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 9, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 10, risk_score: 0.6, total_chunks: 100, stale_chunks: 60, color: "#16a34a" },
        { week: 11, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
        { week: 12, risk_score: 0.6, total_chunks: 100, stale_chunks: 60, color: "#16a34a" },
      ],
      avg_risk: 0.45
    },
    {
      department: "Finance",
      framework: "SOC2",
      weeks: [
        { week: 1, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 2, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 3, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 4, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 5, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 6, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 7, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 8, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 9, risk_score: 0.6, total_chunks: 100, stale_chunks: 60, color: "#16a34a" },
        { week: 10, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
        { week: 11, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
        { week: 12, risk_score: 0.5, total_chunks: 100, stale_chunks: 50, color: "#65a30d" },
      ],
      avg_risk: 0.36
    },
    {
      department: "Marketing",
      framework: "SOC2",
      weeks: [
        { week: 1, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 2, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 3, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 4, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 5, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 6, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 7, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 8, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 9, risk_score: 0.1, total_chunks: 100, stale_chunks: 10, color: "#064e3b" },
        { week: 10, risk_score: 0.6, total_chunks: 100, stale_chunks: 60, color: "#16a34a" },
        { week: 11, risk_score: 0.8, total_chunks: 100, stale_chunks: 80, color: "#ea580c" },
        { week: 12, risk_score: 1.0, total_chunks: 100, stale_chunks: 100, color: "#ff4500" },
      ],
      avg_risk: 0.40
    }
  ],
  summary: {
    revenue_at_risk: 2400000.0,
    customers_affected: 12847,
    regulatory_tier: "Tier 2",
    confidence: 94,
    total_events_analyzed: 15400,
    stale_events: 1200,
    overall_stale_ratio: 0.078
  },
  regulatory_exposure: {
    "EU AI Act": 78,
    "SOC 2 Type II": 42,
    "ISO 27001": 18,
    "HIPAA": 8
  },
  top_workflows: [
    { name: "Customer onboarding", rate: "4.2K/day" },
    { name: "Compliance Q&A", rate: "1.8K/day" },
    { name: "Sales objection handling", rate: "892/day" }
  ]
}

export default function ImpactSimulatorPage() {
  const [data, setData] = useState<SimulationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [usingMockData, setUsingMockData] = useState(false)

  const fetchSimulation = async (isManual = false) => {
    if (isManual) {
      setSimulating(true)
    } else {
      setLoading(true)
    }
    try {
      const res = await getSimulationData()
      setData(res)
      setUsingMockData(false)
      if (isManual) {
        toast.success("Simulation computed successfully!")
      }
    } catch (err) {
      console.error(err)
      setData(MOCK_SIMULATION_RESPONSE)
      setUsingMockData(true)
    } finally {
      setLoading(false)
      setSimulating(false)
    }
  }

  useEffect(() => {
    fetchSimulation()
  }, [])

  if (loading || !data) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${CARD_BORDER}`, borderTopColor: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const { summary, heatmap, regulatory_exposure, top_workflows } = data

  const formatRevenue = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
    return `$${val}`
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            IMPACT SIMULATOR
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              Predict downstream business risk
            </h1>
            {usingMockData && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Model how a stale chunk propagates through agents, customers, and regulatory surfaces.
          </p>
        </div>
        <button 
          onClick={() => fetchSimulation(true)}
          disabled={simulating}
          style={{
            background: simulating 
              ? "#1e1e38" 
              : `linear-gradient(135deg, ${TEAL}, #00B4D8)`, 
            color: simulating ? SLATE_DIM : "#000",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: simulating ? "not-allowed" : "pointer",
            boxShadow: simulating ? "none" : `0 4px 16px ${TEAL}40`, 
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.2s"
          }}
        >
          <Zap size={14} fill={simulating ? "none" : "#000"} style={{ animation: simulating ? "pulse 1.5s infinite" : "none" }} /> 
          {simulating ? "Simulating..." : "Run Simulation"}
        </button>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        
        {/* Card 1 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={labelStyle}>REVENUE AT RISK</span>
            <DollarSign size={14} color={RED} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>
            {formatRevenue(summary.revenue_at_risk)}
          </p>
          <p style={{ fontSize: 11, color: SLATE_DIM, margin: 0 }}>If unresolved 30d</p>
        </div>

        {/* Card 2 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={labelStyle}>REGULATORY EXPOSURE</span>
            <Scale size={14} color={AMBER} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>{summary.regulatory_tier}</p>
          <p style={{ fontSize: 11, color: SLATE_DIM, margin: 0 }}>Based on compliance rules</p>
        </div>

        {/* Card 3 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={labelStyle}>CUSTOMERS AFFECTED</span>
            <Users size={14} color={PURPLE} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>
            {summary.customers_affected.toLocaleString()}
          </p>
          <p style={{ fontSize: 11, color: SLATE_DIM, margin: 0 }}>active session impact</p>
        </div>

        {/* Card 4 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={labelStyle}>CONFIDENCE</span>
            <Zap size={14} color={TEAL} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 2px" }}>{summary.confidence}%</p>
          <p style={{ fontSize: 11, color: SLATE_DIM, margin: 0 }}>monte carlo · 10k runs</p>
        </div>

      </div>

      {/* ── BOTTOM CONTENT GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 16 }}>

        {/* Left: Risk Heat Map */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Risk Heat Map</h2>
              <p style={{ fontSize: 11, color: SLATE_DIM, margin: 0 }}>Business unit × time window. Darker = greater projected risk.</p>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#166534" }} />
                <span style={{ fontSize: 10, color: SLATE_DIM }}>low</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: AMBER }} />
                <span style={{ fontSize: 10, color: SLATE_DIM }}>med</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: RED }} />
                <span style={{ fontSize: 10, color: SLATE_DIM }}>high</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {heatmap.map((dept) => (
              <div key={dept.department} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 80, fontSize: 11, color: SLATE_DIM }}>{dept.department}</div>
                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                  {dept.weeks.map((wData, index) => (
                    <div 
                      key={index} 
                      title={`${dept.department} W${wData.week}: Risk Score ${wData.risk_score.toFixed(2)}, Stale Chunks ${wData.stale_chunks}/${wData.total_chunks}`}
                      style={{ 
                        flex: 1, 
                        aspectRatio: "1/1", 
                        background: wData.color, 
                        borderRadius: 6,
                        cursor: "pointer",
                        position: "relative",
                        boxShadow: wData.risk_score > 0.6 ? `0 0 10px ${wData.color}cc` : "none",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.15)"
                        e.currentTarget.style.zIndex = "10"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)"
                        e.currentTarget.style.zIndex = "auto"
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <div style={{ width: 80 }} />
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                {cols.map((col) => (
                  <div key={col} style={{ flex: 1, textAlign: "center", fontSize: 9, color: SLATE_DIM }}>
                    {col}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Regulatory Exposure */}
          <div style={cardStyle}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase", display: "block", marginBottom: 16 }}>
              REGULATORY EXPOSURE
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(regulatory_exposure).map(([label, value]) => {
                const color = value > 60 ? RED : value > 30 ? AMBER : GREEN;
                return (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{value}%</span>
                    </div>
                    <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top Affected Workflows */}
          <div style={{ ...cardStyle, flex: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase", display: "block", marginBottom: 16 }}>
              TOP AFFECTED WORKFLOWS
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {top_workflows.map((item, i) => (
                <div key={i} style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingBottom: 16, borderBottom: i !== top_workflows.length - 1 ? `1px solid ${CARD_BORDER}` : "none"
                }}>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: SLATE_DIM, fontFamily: "var(--font-mono), monospace" }}>{item.rate}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
