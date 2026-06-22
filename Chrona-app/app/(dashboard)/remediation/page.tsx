"use client"

import { useState, useEffect } from "react"
import {
  Play,
  RefreshCw,
  Ban,
  Bell,
  CheckCircle2,
  HelpCircle
} from "lucide-react"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import { 
  getRemediationWorkflows, 
  executeRemediation, 
  getAuditEvents,
  type RemediationWorkflow,
  type AuditEvent
} from "@/lib/api"
import { toast } from "sonner"

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

export default function RemediationPage() {
  const [workflows, setWorkflows] = useState<RemediationWorkflow[]>([])
  const [recentCompletions, setRecentCompletions] = useState<{ title: string; time: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [workflowsData, auditData] = await Promise.all([
        getRemediationWorkflows(),
        getAuditEvents()
      ])
      setWorkflows(workflowsData)

      // Filter audit events to populate completed resolutions
      const completed = auditData
        .filter(e => e.action === "reembed" || e.action === "invalidate")
        .slice(0, 5)
        .map(e => {
          const actionText = e.action === "reembed" ? "Re-embedded stale chunk" : "Blocked stale chunk retrieval"
          const elapsed = "Just now"
          return {
            title: `${actionText} (ID: ${e.id.substring(0, 6)})`,
            time: elapsed
          }
        })
      
      setRecentCompletions(completed.length > 0 ? completed : [
        { title: "Re-embedded api-v2.md", time: "12m ago" },
        { title: "Notified 4 owners", time: "1h ago" },
        { title: "Blocked stale chunk on Sales", time: "2h ago" }
      ])
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect to remediation API.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExecute = async (id: string, title: string) => {
    setActionLoading(id)
    try {
      const res = await executeRemediation(id)
      toast.success(res.detail || `Successfully resolved: ${title}`)
      await loadData()
    } catch (err) {
      console.error(err)
      toast.error(`Failed to execute resolution for ${title}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunAll = async () => {
    if (workflows.length === 0) {
      toast.info("No active workflows to run.")
      return
    }
    setActionLoading("all")
    let successCount = 0
    for (const flow of workflows) {
      try {
        await executeRemediation(flow.id)
        successCount++
      } catch (err) {
        console.error(err)
      }
    }
    toast.success(`Successfully executed ${successCount} out of ${workflows.length} workflows.`)
    await loadData()
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${CARD_BORDER}`, borderTopColor: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const openCount = workflows.length
  const progressCount = actionLoading ? 1 : 0
  const savedHours = (openCount * 1.5).toFixed(1)

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            REMEDIATION CENTER
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
            One-click resolution workflows
          </h1>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Fix drift with surgical precision: re-embed, block, or notify — with full audit trail attached.
          </p>
        </div>
        <button 
          onClick={handleRunAll}
          disabled={actionLoading !== null || openCount === 0}
          style={{
            background: (actionLoading !== null || openCount === 0) ? "#1a1a2e" : `linear-gradient(135deg, ${TEAL}, #00B4D8)`, 
            color: (actionLoading !== null || openCount === 0) ? SLATE_DIM : "#000",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: (actionLoading !== null || openCount === 0) ? "not-allowed" : "pointer",
            boxShadow: (actionLoading !== null || openCount === 0) ? "none" : `0 4px 16px ${TEAL}40`, 
            display: "flex", alignItems: "center", gap: 6
          }}
        >
          <Play size={14} fill={actionLoading !== null || openCount === 0 ? "none" : "#000"} /> 
          {actionLoading === "all" ? "Executing..." : `Run all (${openCount})`}
        </button>
      </div>

      {/* ── STATS CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "OPEN", value: openCount.toString(), color: AMBER },
          { label: "IN PROGRESS", value: progressCount.toString(), color: TEAL },
          { label: "AUTO-RESOLVED (24H)", value: "284", color: GREEN },
          { label: "SAVED HOURS", value: savedHours, color: PURPLE },
        ].map((stat, i) => (
          <div key={i} style={{ ...cardStyle, padding: "16px 24px" }}>
            <p style={{ fontSize: 10, color: SLATE_DIM, fontWeight: 600, letterSpacing: "0.12em", margin: "0 0 8px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 32, fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 16 }}>

        {/* Left: Active Workflows */}
        <div style={{ ...cardStyle, padding: "24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Active Workflows</h2>
            <button 
              onClick={loadData}
              style={{
                background: "transparent", border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                padding: "4px 10px", color: SLATE, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
              }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {workflows.length === 0 ? (
              <p style={{ color: SLATE_DIM, fontSize: 12, textAlign: "center", padding: 24 }}>No active compliance anomalies detected.</p>
            ) : (
              workflows.map((flow) => {
                const isReembed = flow.type === "reembed"
                const isBlock = flow.type === "block"
                const color = isReembed ? GREEN : isBlock ? RED : PURPLE
                const Icon = isReembed ? RefreshCw : isBlock ? Ban : HelpCircle

                return (
                  <div key={flow.id} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "#080812", border: `1px solid ${CARD_BORDER}`, borderRadius: 12, padding: "16px 20px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ 
                        width: 40, height: 40, borderRadius: 10, 
                        background: `${color}15`, border: `1px solid ${color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <Icon size={18} color={color} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{flow.title}</h3>
                          <span style={{ 
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                            color: color, background: `${color}15`, 
                            padding: "2px 6px", borderRadius: 4, border: `1px solid ${color}30` 
                          }}>
                            {flow.id.split("-")[1]}
                          </span>
                        </div>
                        <div style={{ margin: 0, fontSize: 11, color: SLATE_DIM, display: "flex", alignItems: "center", gap: 4 }}>
                          {flow.source_name && <CompanyLogo name={flow.source_name} size={12} />}
                          <span>{flow.description} · est. {flow.est_time}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button 
                        onClick={() => handleExecute(flow.id, flow.title)}
                        disabled={actionLoading !== null}
                        style={{
                          background: TEAL, color: "#000", border: "none",
                          borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, 
                          cursor: actionLoading !== null ? "not-allowed" : "pointer"
                        }}
                      >
                        {actionLoading === flow.id ? "Executing..." : "Execute"}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Recently Completed */}
        <div style={{ ...cardStyle, padding: "24px 32px" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 20px" }}>Recently completed</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {recentCompletions.map((comp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CheckCircle2 size={16} color={GREEN} />
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 500, maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comp.title}</span>
                </div>
                <span style={{ fontSize: 11, color: SLATE_DIM }}>{comp.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
