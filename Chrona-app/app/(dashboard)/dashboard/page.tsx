"use client"

import { useState, useEffect } from "react"
import { getDashboardStats, getAuditEvents, getAgents, getDashboardDrift, getActiveSourcesSparkline, getStaleChunksSparkline, type DashboardStats, type AuditEvent } from "@/lib/api"
import { toast } from "sonner"
import {
  mockAuditTrail,
  mockDriftData,
  mockStats,
  mockActiveSourcesSparkline,
  mockStaleChunksSparkline,
  mockAgentHealth,
} from "@/lib/mock-data"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import {
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ChevronDown,
  Shield,
} from "lucide-react"

/* ─── design tokens ─── */
const BG = "#080812"
const CARD_BG = "#0D0D1F"
const CARD_BORDER = "#1a1a2e"
const TEAL = "#00D4FF"
const PURPLE = "#7C3AED"
const BLUE = "#3B82F6"
const GREEN = "#22C55E"
const AMBER = "#F59E0B"
const RED = "#EF4444"
const SLATE = "#94A3B8"
const SLATE_DIM = "#64748B"

const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 14,
  padding: 20,
  position: "relative",
  overflow: "hidden",
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: SLATE_DIM,
}

/* ─── Health Ring ─── */
function HealthRing({ score }: { score: number }) {
  const r = 58
  const stroke = 7
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={TEAL} />
          <stop offset="100%" stopColor={PURPLE} />
        </linearGradient>
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={70} cy={70} r={r} fill="none" stroke="#1a1a2e" strokeWidth={stroke} />
      <circle
        cx={70} cy={70} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 70 70)" filter="url(#ringGlow)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x={70} y={65} textAnchor="middle" fill="#fff" fontSize="26" fontWeight="700">
        {score}
        <tspan fontSize="16" fill={SLATE}>%</tspan>
      </text>
      <text x={70} y={84} textAnchor="middle" fill={SLATE_DIM} fontSize="11" fontWeight="500">
        Healthy
      </text>
    </svg>
  )
}

/* ─── Blocked Hex Icon ─── */
function BlockedHexIcon() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48">
      <defs>
        <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={PURPLE} />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="url(#hexGrad)" />
      <line x1="17" y1="17" x2="31" y2="31" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="31" y1="17" x2="17" y2="31" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    compliant: { bg: "rgba(34,197,94,0.12)", text: GREEN },
    info: { bg: "rgba(59,130,246,0.12)", text: BLUE },
    blocked: { bg: "rgba(239,68,68,0.12)", text: RED },
    expired: { bg: "rgba(245,158,11,0.12)", text: AMBER },
  }
  const c = colors[status] ?? colors.info
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 9999,
      fontSize: 10, fontWeight: 600, background: c.bg, color: c.text,
    }}>
      {status}
    </span>
  )
}

/* ─── Drift Tooltip ─── */
function DriftTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: "#111127", border: `1px solid ${CARD_BORDER}`,
      borderRadius: 8, padding: "10px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <p style={{ color: SLATE, fontSize: 10, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, fontSize: 11, marginBottom: 2 }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
/*                    MAIN PAGE                        */
/* ═══════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [auditTrail, setAuditTrail] = useState<AuditEvent[] | null>(null)
  const [agents, setAgents] = useState<any[] | null>(null)
  const [activeSourcesSparkline, setActiveSourcesSparkline] = useState<any[] | null>(null)
  const [staleChunksSparkline, setStaleChunksSparkline] = useState<any[] | null>(null)
  const [driftData, setDriftData] = useState<any[] | null>(null)
  const [usingMockData, setUsingMockData] = useState(false)
  const [usingMockActiveSourcesSparkline, setUsingMockActiveSourcesSparkline] = useState(false)
  const [usingMockStaleChunksSparkline, setUsingMockStaleChunksSparkline] = useState(false)
  const [usingMockDrift, setUsingMockDrift] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [
          apiStats,
          apiAudit,
          apiAgents,
          apiSourcesSparkline,
          apiChunksSparkline,
          apiDrift,
        ] = await Promise.all([
          getDashboardStats(),
          getAuditEvents(),
          getAgents(),
          getActiveSourcesSparkline(),
          getStaleChunksSparkline(),
          getDashboardDrift(),
        ])

        setStats(apiStats)
        setAuditTrail(apiAudit)
        setAgents(apiAgents)
        setActiveSourcesSparkline(apiSourcesSparkline)
        setStaleChunksSparkline(apiChunksSparkline)
        setDriftData(apiDrift)

        setUsingMockData(false)
        setUsingMockActiveSourcesSparkline(false)
        setUsingMockStaleChunksSparkline(false)
        setUsingMockDrift(false)
      } catch (err) {
        console.error("Dashboard data load failed:", err)
        setStats(mockStats as any)
        setAuditTrail(mockAuditTrail as any)
        setAgents(mockAgentHealth as any)
        setActiveSourcesSparkline(mockActiveSourcesSparkline)
        setStaleChunksSparkline(mockStaleChunksSparkline)
        setDriftData(mockDriftData)

        setUsingMockData(true)
        setUsingMockActiveSourcesSparkline(true)
        setUsingMockStaleChunksSparkline(true)
        setUsingMockDrift(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !stats || !auditTrail || !agents || !activeSourcesSparkline || !staleChunksSparkline || !driftData) {
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
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            EXECUTIVE COMMAND CENTER
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              Welcome back, Alex
            </h1>
            {usingMockData && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Real-time knowledge integrity across 47 agents, 12 sources, and 12.4M vectors.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: "6px 12px" }}>
            <Calendar size={13} color={SLATE_DIM} />
            <span style={{ fontSize: 12, color: "#fff" }}>May 12 – Jun 12</span>
          </div>
          <button style={{
            background: `linear-gradient(135deg, ${TEAL}, #00B4D8)`, color: "#000",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 4px 16px ${TEAL}40`,
          }}>
            Run Integrity Scan
          </button>
        </div>
      </header>

      {/* ── 4 STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>

        {/* Card 1: Integrity Score */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: TEAL }} />
            <span style={labelStyle}>Integrity Score</span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
            <HealthRing score={stats.knowledgeHealthScore} />
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <span style={{ fontSize: 10, color: SLATE, fontStyle: "italic" }}>
              Snapshot only — trend history not yet tracked
            </span>
          </div>
        </div>

        {/* Card 2: Active Sources */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} />
              <span style={labelStyle}>Active Sources</span>
            </div>
            {usingMockActiveSourcesSparkline && (
              <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample
              </span>
            )}
          </div>
          <p style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "4px 0" }}>
            {stats.activeSources.toLocaleString()}
          </p>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: SLATE, fontStyle: "italic" }}>
              Snapshot only — trend history not yet tracked
            </span>
          </div>
          <div style={{ width: "100%", height: 40, marginBottom: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSourcesSparkline}>
                <defs>
                  <linearGradient id="sparkTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={TEAL} strokeWidth={2} fill="url(#sparkTeal)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11, fontWeight: 500 }}>
            <div>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, display: "block" }}>{stats.connectedSources.toLocaleString()}</span>
              <span style={{ color: SLATE_DIM }}>Connected</span>
            </div>
            <div>
              <span style={{ color: TEAL, fontSize: 16, fontWeight: 700, display: "block" }}>{stats.syncingSources.toLocaleString()}</span>
              <span style={{ color: SLATE_DIM }}>Syncing</span>
            </div>
            <div>
              <span style={{ color: RED, fontSize: 16, fontWeight: 700, display: "block" }}>{stats.stalledSources.toLocaleString()}</span>
              <span style={{ color: SLATE_DIM }}>Stalled</span>
            </div>
          </div>
        </div>

        {/* Card 3: Stale Chunks */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER }} />
              <span style={labelStyle}>Stale Chunks</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {usingMockStaleChunksSparkline && (
                <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                  Sample
                </span>
              )}
              <AlertTriangle size={16} color={AMBER} />
            </div>
          </div>
          <p style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: "4px 0" }}>
            {stats.staleChunks.toLocaleString()}
          </p>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: SLATE, fontStyle: "italic" }}>
              Snapshot only — trend history not yet tracked
            </span>
          </div>
          <div style={{ width: "100%", height: 40, marginBottom: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staleChunksSparkline}>
                <defs>
                  <linearGradient id="barPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PURPLE} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <Bar dataKey="v" fill="url(#barPurple)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
            <div>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, display: "block" }}>{stats.stalePct}%</span>
              <span style={{ color: SLATE_DIM }}>of total</span>
            </div>
            <div>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, display: "block" }}>{stats.oldestStaleDays} days</span>
              <span style={{ color: SLATE_DIM }}>oldest</span>
            </div>
          </div>
        </div>

        {/* Card 4: Blocked Conflicts */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: PURPLE }} />
            <span style={labelStyle}>Blocked Conflicts</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" }}>
            <BlockedHexIcon />
            <div>
              <p style={{ fontSize: 36, fontWeight: 700, color: "#fff", lineHeight: 1, margin: 0 }}>
                {stats.zombieChunks}
              </p>
              <p style={{ fontSize: 11, color: SLATE_DIM, margin: "2px 0" }}>Critical conflicts</p>
              <span style={{
                display: "inline-block", padding: "2px 8px", borderRadius: 4,
                fontSize: 9, fontWeight: 700, background: `${RED}20`, color: RED,
                letterSpacing: "0.06em",
              }}>
                VERSION DRIFT
              </span>
            </div>
          </div>
          <button style={{
            width: "100%", padding: "8px 0", borderRadius: 8,
            border: "none", background: `linear-gradient(135deg, ${PURPLE}, #9333EA)`,
            color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer",
            boxShadow: `0 4px 16px ${PURPLE}40`,
          }}>
            Resolve conflicts →
          </button>
        </div>
      </div>

      {/* ── KNOWLEDGE DRIFT MONITOR ── */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: "20px 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Knowledge Drift Monitor</span>
            <span style={{
              padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
              background: `${TEAL}18`, color: TEAL, letterSpacing: "0.08em",
            }}>
              REAL TIME
            </span>
            {usingMockDrift && (
              <span style={{
                padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`,
              }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Legend */}
            {[
              { color: TEAL, label: "Semantic drift" },
              { color: BLUE, label: "Syntactic drift" },
              { color: PURPLE, label: "Volume drift" },
              { color: "#fff", label: "Quality score", dashed: true },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {l.dashed ? (
                  <span style={{ width: 14, height: 0, borderTop: "2px dashed #fff" }} />
                ) : (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                )}
                <span style={{ color: SLATE_DIM, fontSize: 11 }}>{l.label}</span>
              </div>
            ))}
            <div style={{
              display: "flex", alignItems: "center", gap: 4, background: "#0f0f1a",
              border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "4px 10px",
              fontSize: 11, color: "#fff", cursor: "pointer",
            }}>
              All Sources <ChevronDown size={12} color={SLATE_DIM} />
            </div>
          </div>
        </div>

        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={driftData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSemantic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradSyntactic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: SLATE_DIM, fontSize: 9 }} axisLine={{ stroke: CARD_BORDER }} tickLine={false} />
              <YAxis tick={{ fill: SLATE_DIM, fontSize: 9 }} axisLine={false} tickLine={false} domain={[-0.1, 0.5]} />
              <Tooltip content={<DriftTooltipContent />} />
              <Area type="monotone" dataKey="semantic" name="Semantic" stroke={TEAL} strokeWidth={2} fill="url(#gradSemantic)" dot={false} />
              <Area type="monotone" dataKey="syntactic" name="Syntactic" stroke={BLUE} strokeWidth={1.5} fill="url(#gradSyntactic)" dot={false} />
              <Area type="monotone" dataKey="volume" name="Volume" stroke={PURPLE} strokeWidth={1.5} fill="url(#gradVolume)" dot={false} />
              <Area type="monotone" dataKey="quality" name="Quality" stroke="#fff" strokeWidth={1.5} strokeDasharray="4 3" fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── BOTTOM GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>

        {/* Audit Trail */}
        <div style={{ ...cardStyle, padding: 0 }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${CARD_BORDER}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>AI Provenance / Audit Trail</span>
            <span style={{
              padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
              background: `${AMBER}18`, color: AMBER, letterSpacing: "0.08em",
            }}>
              IMMUTABLE
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: TEAL, cursor: "pointer", fontWeight: 500 }}>View all →</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["EVENT ID", "TIME", "ACTION", "MODEL", "SOURCE"].map((h) => (
                    <th key={h} style={{
                      textAlign: "left", padding: "10px 16px", borderBottom: `1px solid ${CARD_BORDER}`,
                      color: SLATE_DIM, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
                      textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditTrail.slice(0, 10).map((evt) => {
                  const sourceName = evt.metadata?.source ?? "Notion"
                  const modelName = evt.metadata?.model ?? "gpt-4o"
                  return (
                    <tr key={evt.id} style={{ transition: "background 0.15s" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#12122a")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "10px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: "#fff", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                        {evt.id.substring(0, 8)}
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: SLATE, fontSize: 11, whiteSpace: "nowrap" }}>
                        {new Date(evt.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: `1px solid ${CARD_BORDER}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            width: 5, height: 5, borderRadius: "50%",
                            background: evt.status === "blocked" ? RED : evt.status === "compliant" ? GREEN : BLUE,
                          }} />
                          <span style={{ color: "#fff", fontSize: 12 }}>{evt.action}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: SLATE, fontFamily: "monospace", fontSize: 10, whiteSpace: "nowrap" }}>
                        {modelName}
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: `1px solid ${CARD_BORDER}`, color: "#fff", fontSize: 11, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CompanyLogo name={sourceName} size={14} />
                          {sourceName}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Agent Health */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Shield size={14} color={TEAL} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>AGENT HEALTH</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agents.map((agent) => {
                const health = typeof agent.health === 'number' ? agent.health : agent.health_score;
                const color = agent.color || (health >= 90 ? TEAL : health >= 70 ? AMBER : RED);
                return (
                  <div key={agent.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{agent.name}</span>
                      <span style={{ fontSize: 12, color: color, fontWeight: 600 }}>{health}%</span>
                    </div>
                    <div style={{ height: 6, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        width: `${health}%`, height: "100%",
                        background: color, borderRadius: 3,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Audit Readiness */}
          <div style={cardStyle}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
              AUDIT READINESS
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* 94% ring */}
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg width={72} height={72} viewBox="0 0 72 72">
                  <circle cx={36} cy={36} r={30} fill="none" stroke="#1a1a2e" strokeWidth={5} />
                  <circle cx={36} cy={36} r={30} fill="none" stroke={GREEN} strokeWidth={5}
                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 30}
                    strokeDashoffset={2 * Math.PI * 30 * (1 - 0.94)}
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>94<span style={{ fontSize: 12 }}>%</span></span>
                </div>
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#fff", fontWeight: 600, margin: "0 0 4px" }}>SOC 2, ISO 27001, EU AI Act</p>
                <p style={{ fontSize: 11, color: SLATE_DIM, margin: "0 0 8px" }}>Next audit in 23 days</p>
                <span style={{ fontSize: 11, color: TEAL, cursor: "pointer", fontWeight: 500 }}>Export evidence →</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}
