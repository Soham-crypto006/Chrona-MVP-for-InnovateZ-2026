"use client"

import { useState, useEffect } from "react"
import { 
  getPolicies, 
  createPolicy, 
  getSources, 
  type Policy, 
  type Source 
} from "@/lib/api"
import { toast } from "sonner"
import { mockGovernancePolicies } from "@/lib/mock-data"
import { 
  ShieldCheck, 
  Plus, 
  Clock, 
  AlertTriangle, 
  Mail,
  Filter,
  Layers,
  ChevronDown
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#080812",
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
}

export default function GovernancePage() {
  const [policies, setPolicies] = useState<Policy[] | null>(null)
  const [sources, setSources] = useState<Source[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [usingMockData, setUsingMockData] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [scope, setScope] = useState("global")
  const [ttlDays, setTtlDays] = useState(90)
  const [docType, setDocType] = useState("")
  const [riskLevel, setRiskLevel] = useState("MEDIUM")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [policiesData, sourcesData] = await Promise.all([
        getPolicies(),
        getSources()
      ])
      setPolicies(policiesData)
      setSources(sourcesData)
      setUsingMockData(false)
    } catch (err) {
      console.error(err)
      setPolicies(mockGovernancePolicies as any)
      setSources([])
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !ownerEmail.trim()) {
      toast.error("All fields are required.")
      return
    }

    setSubmitting(true)
    try {
      const res = await createPolicy(name, scope, ttlDays, docType || undefined, riskLevel, ownerEmail)
      toast.success(`Policy created successfully! Affected ${res.affected_chunks} database chunks.`)
      setIsModalOpen(false)
      // reset fields
      setName("")
      setScope("global")
      setTtlDays(90)
      setDocType("")
      setRiskLevel("MEDIUM")
      setOwnerEmail("")
      loadData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to create compliance policy.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !policies || !sources) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${CARD_BORDER}`, borderTopColor: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            GOVERNANCE CONTROL & BOUNDARIES
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              Compliance Policies
            </h1>
            {usingMockData && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Establish TTL limits, enforce risk classifications, and manage vector document integrity globally.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: `linear-gradient(135deg, ${TEAL}, #00B4D8)`, color: "#000",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 4px 16px ${TEAL}40`, display: "flex", alignItems: "center", gap: 6
          }}
        >
          <Plus size={14} /> Create Policy
        </button>
      </div>

      {/* ── POLICIES TABLE CARD ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <ShieldCheck size={18} color={GREEN} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Active Governance Rules</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
                {["RULE NAME", "SCOPE", "TTL", "DOC FILTER", "RISK LEVEL", "OWNER", "STATUS"].map((h) => (
                  <th key={h} style={{
                    textAlign: "left", padding: "12px 16px",
                    color: SLATE_DIM, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
                    textTransform: "uppercase", whiteSpace: "nowrap"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: SLATE_DIM, padding: 24, fontSize: 12 }}>
                    No active compliance policies. Click "Create Policy" to begin.
                  </td>
                </tr>
              ) : (
                policies.map((p) => {
                  const scopeName = p.scope === "global" ? "Global Workspace" : (sources ? sources.find(s => s.id === p.scope)?.name : null) || "Specific Source"
                  return (
                    <tr 
                      key={p.id} 
                      style={{ transition: "background 0.15s" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#12122a")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: "#fff", fontSize: 13, fontWeight: 600 }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: SLATE, fontSize: 12 }}>
                        {scopeName}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: TEAL, fontSize: 12, fontWeight: 600 }}>
                        {p.ttl_days} Days
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: SLATE_DIM, fontSize: 11, fontFamily: "monospace" }}>
                        {p.document_type || "ALL"}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}` }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                          color: p.risk_level === "CRITICAL" || p.risk_level === "HIGH" ? RED : p.risk_level === "MEDIUM" ? AMBER : GREEN,
                          background: `${p.risk_level === "CRITICAL" || p.risk_level === "HIGH" ? RED : p.risk_level === "MEDIUM" ? AMBER : GREEN}15`,
                          padding: "2px 6px", borderRadius: 4, border: `1px solid ${p.risk_level === "CRITICAL" || p.risk_level === "HIGH" ? RED : p.risk_level === "MEDIUM" ? AMBER : GREEN}30`
                        }}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: "#fff", fontSize: 12 }}>
                        {p.owner_email}
                      </td>
                      <td style={{ padding: "14px 16px", borderBottom: `1px solid ${CARD_BORDER}` }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: GREEN, background: `${GREEN}15`,
                          padding: "2px 6px", borderRadius: 4
                        }}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE POLICY FORM OVERLAY / MODAL ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14,
            width: "100%", maxWidth: 500, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ margin: "0 0 16px", color: "#fff", fontSize: 18, fontWeight: 600 }}>Create Policy</h3>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Policy Name */}
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>POLICY NAME</label>
                <input 
                  type="text" 
                  placeholder="e.g. Finance TTL Enforcer"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Scope Selection */}
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>SCOPE LIMITATION</label>
                <div style={{ position: "relative" }}>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value)}
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="global">Global Workspace (All Chunks)</option>
                    {sources.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color={SLATE_DIM} style={{ position: "absolute", right: 14, top: 14, pointerEvents: "none" }} />
                </div>
              </div>

              {/* Grid: TTL Days & Risk Level */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>TTL (DAYS)</label>
                  <input 
                    type="number" 
                    value={ttlDays}
                    onChange={e => setTtlDays(parseInt(e.target.value) || 30)}
                    style={inputStyle}
                    min={1}
                    required
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>RISK CLASSIFICATION</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={riskLevel}
                      onChange={e => setRiskLevel(e.target.value)}
                      style={{
                        ...inputStyle,
                        appearance: "none",
                        cursor: "pointer"
                      }}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                    <ChevronDown size={14} color={SLATE_DIM} style={{ position: "absolute", right: 14, top: 14, pointerEvents: "none" }} />
                  </div>
                </div>
              </div>

              {/* Document Filter keyword */}
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>DOCUMENT TYPE KEYWORD (OPTIONAL)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Pricing, Security, SOP"
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Owner Email */}
              <div>
                <label style={{ ...labelStyle, display: "block", marginBottom: 6 }}>OWNER EMAIL</label>
                <input 
                  type="email" 
                  placeholder="compliance@corporate.com"
                  value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)}
                  style={inputStyle}
                  required
                />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${CARD_BORDER}`,
                    background: "transparent", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                    background: `linear-gradient(135deg, ${TEAL}, #00B4D8)`, color: "#000",
                    fontSize: 12, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: `0 4px 16px ${TEAL}40`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}
                >
                  {submitting ? "Enforcing Rules..." : "Create & Enforce"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
