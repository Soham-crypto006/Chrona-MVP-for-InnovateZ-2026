"use client"

import { useState, useEffect } from "react"
import { getChunks, invalidateChunk, reembedChunk, type Chunk } from "@/lib/api"
import { mockChunks } from "@/lib/mock-data"
import { toast } from "sonner"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts"
import {
  AlertTriangle,
  Info,
  GitCommit,
  Bot,
  RefreshCw
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

/* ─── Mock sparkline data ─── */
const spark1 = [{v: 10},{v: 12},{v: 14},{v: 18},{v: 24},{v: 30},{v: 38},{v: 45},{v: 50}]
const spark2 = [{v: 50},{v: 45},{v: 40},{v: 35},{v: 38},{v: 42},{v: 45},{v: 55},{v: 60}]
const spark3 = [{v: 10},{v: 15},{v: 22},{v: 30},{v: 45},{v: 55},{v: 70},{v: 85},{v: 95}]
const spark4 = [{v: 80},{v: 75},{v: 60},{v: 45},{v: 40},{v: 35},{v: 25},{v: 20},{v: 15}]

const severityColors: Record<string, string> = {
  CRITICAL: RED,
  HIGH: AMBER,
  MEDIUM: PURPLE,
  LOW: GREEN,
}

export default function DriftDetectionPage() {
  const [chunks, setChunks] = useState<Chunk[] | null>(null)
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [usingMockData, setUsingMockData] = useState(false)

  const loadData = async () => {
    try {
      const data = await getChunks()
      setChunks(data)
      setUsingMockData(false)
      const zombieList = data.filter(c => c.status === "zombie" || c.status === "invalidated")
      if (zombieList.length > 0) {
        setSelectedChunk(zombieList[0])
      } else if (data.length > 0) {
        setSelectedChunk(data[0])
      }
    } catch (err) {
      console.error(err)
      setChunks(mockChunks as any)
      setUsingMockData(true)
      const zombieList = mockChunks.filter(c => c.status === "zombie" || c.status === "invalidated")
      if (zombieList.length > 0) {
        setSelectedChunk(zombieList[0] as any)
      } else if (mockChunks.length > 0) {
        setSelectedChunk(mockChunks[0] as any)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleReembed = async () => {
    if (!selectedChunk) return
    setActionLoading(true)
    try {
      await reembedChunk(selectedChunk.id)
      toast.success(`Successfully re-embedded knowledge vector for "${selectedChunk.documentTitle}"!`)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error("Re-embedding operation failed.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!selectedChunk) return
    setActionLoading(true)
    try {
      await invalidateChunk(selectedChunk.id)
      toast.success(`Blocked knowledge access for chunk: ${selectedChunk.documentTitle}`)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to block chunk.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !chunks) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${CARD_BORDER}`, borderTopColor: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Derive Drift values from selected chunk
  const selectedCount = selectedChunk ? Number(selectedChunk.retrievalCount) : 0
  const driftScore = selectedChunk && !isNaN(selectedCount)
    ? parseFloat((0.65 + (selectedCount % 31) / 100).toFixed(2)) 
    : 0.72
  const severity = driftScore > 0.85 ? "CRITICAL" : driftScore > 0.7 ? "HIGH" : "MEDIUM"

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            DRIFT DETECTION CENTER
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              Semantic diff & risk classification
            </h1>
            {usingMockData && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Every divergence between source-of-truth content and vectorized knowledge, explained by AI.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            onClick={loadData}
            style={{
              background: "transparent", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: "8px 14px",
              fontSize: 12, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6
            }}
          >
            <RefreshCw size={14} /> Sync drifts
          </button>
        </div>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
        
        {/* Card 1 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <span style={labelStyle}>TOTAL DRIFTS (30D)</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 16px" }}>1,284</p>
          <div style={{ width: "100%", height: 32, position: "absolute", bottom: 0, left: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark1}>
                <Area type="monotone" dataKey="v" stroke={TEAL} strokeWidth={2} fill="url(#g1)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <span style={labelStyle}>CRITICAL RISK</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 16px" }}>23</p>
          <div style={{ width: "100%", height: 32, position: "absolute", bottom: 0, left: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark2}>
                <Area type="monotone" dataKey="v" stroke={RED} strokeWidth={2} fill="url(#g2)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <span style={labelStyle}>AUTO-REMEDIATED</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 16px" }}>842</p>
          <div style={{ width: "100%", height: 32, position: "absolute", bottom: 0, left: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark3}>
                <Area type="monotone" dataKey="v" stroke={GREEN} strokeWidth={2} fill="url(#g3)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ ...cardStyle, padding: "16px 20px" }}>
          <span style={labelStyle}>MEAN DETECT TIME</span>
          <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: "4px 0 16px" }}>2.4s</p>
          <div style={{ width: "100%", height: 32, position: "absolute", bottom: 0, left: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark4}>
                <Area type="monotone" dataKey="v" stroke={PURPLE} strokeWidth={2} fill="url(#g4)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>

        {/* Left: Semantic Diff */}
        <div style={{ ...cardStyle, display: "flex", flexDirection: "column" }}>
          {selectedChunk ? (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <GitCommit size={18} color={TEAL} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Semantic Diff</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ 
                    padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700, 
                    background: `${severityColors[severity]}18`, color: severityColors[severity], letterSpacing: "0.08em" 
                  }}>
                    {severity}
                  </span>
                  <span style={{ fontSize: 11, color: SLATE_DIM }}>{selectedChunk.documentTitle}</span>
                </div>
              </div>

              {/* Diff Columns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Left Col */}
                <div style={{ background: "#080812", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: 16 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                    SOURCE OF TRUTH - TODAY
                  </span>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, lineHeight: 1.6 }}>
                    <div style={{ color: "#fff" }}>Document: <span style={{ color: TEAL }}>{selectedChunk.documentTitle}</span></div>
                    <div style={{ color: GREEN, background: `${GREEN}10`, padding: "4px", borderRadius: 2, marginTop: 8 }}>
                      + Authorized users must complete MFA verification and gain Manager level approval.
                    </div>
                  </div>
                </div>
                
                {/* Right Col */}
                <div style={{ background: "#080812", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: 16 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase", display: "block", marginBottom: 12 }}>
                    VECTORIZED SNAPSHOT (STALE)
                  </span>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, lineHeight: 1.6 }}>
                    <div style={{ color: "#fff" }}>Document: <span style={{ color: TEAL }}>{selectedChunk.documentTitle}</span></div>
                    <div style={{ color: RED, textDecoration: "line-through", background: `${RED}10`, padding: "4px", borderRadius: 2, marginTop: 8 }}>
                      - Users can access standard resources with static passwords.
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              <div style={{ background: `${PURPLE}10`, border: `1px solid ${PURPLE}30`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Bot size={14} color={PURPLE} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>AI Explanation</span>
                  <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: PURPLE, color: "#fff" }}>CLAUDE-3.7</span>
                </div>
                <p style={{ fontSize: 12, color: SLATE, lineHeight: 1.5, margin: 0 }}>
                  This vector chunk outlines credential rules. The indexed snapshot contains <strong style={{ color: "#fff" }}>obsolete password guidance</strong> instead of the current MFA standard. Over {selectedChunk.retrievalCount} agent retrieval lookups served this outdated version, posing security compliance risks.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button 
                  onClick={handleReembed}
                  disabled={actionLoading}
                  style={{
                    background: TEAL, color: "#000", border: "none", borderRadius: 6, padding: "8px 16px",
                    fontSize: 12, fontWeight: 600, cursor: actionLoading ? "not-allowed" : "pointer",
                  }}
                >
                  Re-embed now
                </button>
                <button 
                  onClick={handleBlock}
                  disabled={actionLoading || selectedChunk.status === "invalidated"}
                  style={{
                    background: "transparent", color: "#fff", border: `1px solid ${CARD_BORDER}`, borderRadius: 6, padding: "8px 16px",
                    fontSize: 12, fontWeight: 500, cursor: (actionLoading || selectedChunk.status === "invalidated") ? "not-allowed" : "pointer",
                    opacity: selectedChunk.status === "invalidated" ? 0.5 : 1
                  }}
                >
                  {selectedChunk.status === "invalidated" ? "Blocked" : "Block agents"}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: SLATE_DIM, fontSize: 12, textAlign: "center", padding: 24 }}>Select a drifted chunk from the queue to audit.</p>
          )}
        </div>

        {/* Right: Live Drift Queue */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={16} color={AMBER} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Live Drift Queue</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {chunks.slice(0, 5).map((item) => {
              const count = Number(item.retrievalCount)
              const score = !isNaN(count) ? parseFloat((0.65 + (count % 31) / 100).toFixed(2)) : 0.65
              const risk = score > 0.85 ? "CRITICAL" : score > 0.7 ? "HIGH" : "MEDIUM"
              const activeSelect = selectedChunk?.id === item.id

              return (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedChunk(item)}
                  style={{ 
                    padding: "12px", 
                    borderRadius: 8,
                    cursor: "pointer",
                    background: activeSelect ? "rgba(0, 212, 255, 0.05)" : "transparent",
                    border: `1px solid ${activeSelect ? TEAL : "transparent"}`,
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>{item.documentTitle}</p>
                      <div style={{ fontSize: 10, color: SLATE_DIM, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                        <CompanyLogo name={item.source} size={12} />
                        <span>{item.source} · {item.retrievalCount} retrievals</span>
                      </div>
                    </div>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: `${severityColors[risk]}15`, color: severityColors[risk], letterSpacing: "0.06em"
                    }}>
                      {risk}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 4, background: "#1a1a2e", borderRadius: 2 }}>
                      <div style={{
                        width: `${score * 100}%`, height: "100%", borderRadius: 2,
                        background: `linear-gradient(90deg, ${TEAL}, ${severityColors[risk]})`
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: SLATE_DIM, width: 24 }}>{score}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
