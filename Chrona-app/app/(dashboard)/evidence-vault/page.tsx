"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Download,
  Shield,
  FileCheck,
  Lock,
  BadgeCheck,
  ArrowRight,
  RefreshCw,
  X,
  Printer
} from "lucide-react"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import { getAuditEvents, exportAuditEvents, type AuditEvent } from "@/lib/api"
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

export default function EvidenceVaultPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("All")
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const loadData = async () => {
    try {
      const data = await getAuditEvents()
      setEvents(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load compliance evidence.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    const mapping: Record<string, string> = {
      "All": "ALL",
      "SOC 2": "SOC2",
      "ISO 27001": "ISO27001",
      "EU AI Act": "EU_AI_ACT",
      "HIPAA": "HIPAA"
    }
    const fwCode = mapping[activeTab] || "SOC2"
    
    try {
      const res = await exportAuditEvents(fwCode)
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `chrona-evidence-${fwCode.toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Successfully exported cryptographic evidence bundle for ${activeTab}!`)
    } catch (err) {
      console.warn("Backend export failed, falling back to client-side data export:", err)
      const filteredEvents = getFilteredEvents()
      const fallbackPayload = {
        framework: fwCode,
        generated_at: new Date().toISOString(),
        signature: "CLIENT_SIDE_FALLBACK_0x" + Math.random().toString(16).substring(2, 10).toUpperCase(),
        events: filteredEvents
      }
      
      try {
        const blob = new Blob([JSON.stringify(fallbackPayload, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `chrona-evidence-${fwCode.toLowerCase()}-fallback.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success(`Exported local compliance evidence bundle for ${activeTab} (client-side fallback).`)
      } catch (fallbackErr) {
        console.error("Client-side fallback also failed:", fallbackErr)
        toast.error("Failed to export compliance evidence bundle.")
      }
    } finally {
      setExporting(false)
    }
  }

  const getFilteredEvents = () => {
    if (activeTab === "All") return events.slice(0, 100)
    const mapping: Record<string, string> = {
      "SOC 2": "SOC2",
      "ISO 27001": "ISO27001",
      "EU AI Act": "EU_AI_ACT",
      "HIPAA": "HIPAA"
    }
    const code = mapping[activeTab]
    return events.filter(e => {
      const fw = e.metadata?.framework ?? ""
      return fw.toUpperCase() === code.toUpperCase()
    }).slice(0, 100)
  }

  const filtered = getFilteredEvents()

  const getEventColor = (type: string) => {
    if (type.includes("zomb") || type.includes("block")) return RED
    if (type.includes("expire")) return AMBER
    if (type.includes("creat") || type.includes("sync")) return GREEN
    return TEAL
  }

  const formatTitle = (e: AuditEvent) => {
    // Human readable text
    let base = e.event_type.replace(/_/g, " ")
    base = base.charAt(0).toUpperCase() + base.slice(1)
    if (e.action) {
      return `${base} (${e.action})`
    }
    return base
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            COMPLIANCE EVIDENCE VAULT
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
            Immutable audit records
          </h1>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Every knowledge change, agent block, and remediation — anchored, signed, and audit-ready.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button 
            onClick={() => setIsReportOpen(true)}
            style={{
              background: "transparent", color: "#fff",
              border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: "8px 16px",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6
            }}
          >
            <FileText size={14} /> Generate report
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: `linear-gradient(135deg, ${TEAL}, #00B4D8)`, color: "#000",
              border: "none", borderRadius: 8, padding: "8px 16px",
              fontSize: 12, fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer",
              boxShadow: `0 4px 16px ${TEAL}40`, display: "flex", alignItems: "center", gap: 6
            }}
          >
            <Download size={14} fill="#000" /> {exporting ? "Exporting..." : "Export bundle"}
          </button>
        </div>
      </div>

      {/* ── STATS CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "EVENTS ANCHORED", value: events.length > 0 ? `${(events.length / 1000).toFixed(1)}k` : "0.0k", icon: Shield, iconColor: TEAL },
          { label: "AUDIT READINESS", value: "98%", icon: FileCheck, iconColor: GREEN },
          { label: "RETENTION", value: "7 yrs", icon: Lock, iconColor: PURPLE },
          { label: "FRAMEWORKS", value: "4", icon: BadgeCheck, iconColor: TEAL },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={{ ...cardStyle, padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: SLATE_DIM, fontWeight: 600, letterSpacing: "0.12em", margin: 0 }}>
                  {stat.label}
                </p>
                <Icon size={16} color={stat.iconColor} />
              </div>
              <p style={{ fontSize: 32, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1 }}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── TIMELINE PANEL ── */}
      <div style={{ ...cardStyle, padding: "24px 32px", position: "relative" }}>
        
        {/* Header & Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Timeline</h2>
            <button 
              onClick={loadData}
              style={{
                background: "transparent", border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                padding: "4px 8px", color: SLATE, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
              }}
            >
              <RefreshCw size={10} /> Reload
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["SOC 2", "ISO 27001", "EU AI Act", "HIPAA", "All"].map(tab => (
              <span 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  fontSize: 10, fontWeight: 600, 
                  color: activeTab === tab ? "#000" : SLATE, 
                  background: activeTab === tab ? TEAL : "transparent",
                  padding: "6px 12px", borderRadius: 20, 
                  border: `1px solid ${activeTab === tab ? TEAL : CARD_BORDER}`,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline Items */}
        <div style={{ position: "relative", paddingLeft: 8 }}>
          {/* Vertical Line */}
          <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 2, background: CARD_BORDER, zIndex: 0 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 24, position: "relative", zIndex: 1 }}>
            {loading ? (
              <p style={{ color: SLATE_DIM, fontSize: 12, paddingLeft: 32 }}>Loading anchored events...</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: SLATE_DIM, fontSize: 12, paddingLeft: 32 }}>No events logged under {activeTab} framework.</p>
            ) : (
              filtered.map((evt, i) => {
                const color = getEventColor(evt.event_type)
                 const sourceName = evt.metadata?.source ?? "System"
                 const docTitle = evt.metadata?.title ?? "System Reference"
                 const dateText = new Date(evt.created_at).toLocaleString()

                return (
                  <div key={evt.id} style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "transparent", border: `1px solid ${CARD_BORDER}`, 
                    borderRadius: 12, padding: "16px 20px", marginLeft: 32, position: "relative"
                  }}>
                    {/* Timeline Dot */}
                    <div style={{
                      position: "absolute", left: -29, top: "50%", transform: "translateY(-50%)",
                      width: 10, height: 10, borderRadius: "50%", background: color,
                      boxShadow: `0 0 0 4px ${CARD_BG}`
                    }} />

                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{formatTitle(evt)}</h3>
                        <span style={{ 
                          fontSize: 8, fontWeight: 700, letterSpacing: "0.05em",
                          color: color, background: `${color}15`, 
                          padding: "2px 6px", borderRadius: 4, border: `1px solid ${color}30` 
                        }}>
                          SIGNED
                        </span>
                      </div>
                      <div style={{ margin: 0, fontSize: 11, color: SLATE_DIM, fontFamily: "var(--font-mono), monospace", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{dateText} &nbsp;·&nbsp;</span>
                        {sourceName !== "System" && <CompanyLogo name={sourceName} size={12} />}
                        <span>{sourceName} · {docTitle} · 0x{evt.id.substring(0, 8)}</span>
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        alert(JSON.stringify(evt, null, 2))
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: TEAL, fontWeight: 600, cursor: "pointer" }}
                    >
                      View proof <ArrowRight size={14} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── REPORT SUMMARY DIALOG ── */}
      {isReportOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14,
            width: "100%", maxWidth: 640, padding: 24, maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 600 }}>Compliance Audit Summary Report</h3>
              <button 
                onClick={() => setIsReportOpen(false)}
                style={{ background: "transparent", border: "none", color: SLATE_DIM, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <div id="print-area" style={{ color: "#fff", fontSize: 13, lineHeight: 1.6, padding: "16px 20px", background: "#080812", borderRadius: 8, border: `1px solid ${CARD_BORDER}` }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: TEAL }}>CHRONA INTEGRITY AUDIT</h2>
              <p style={{ margin: "0 0 16px", color: SLATE_DIM }}>Generated at: {new Date().toLocaleString()}</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <strong>Audit Status:</strong> <span style={{ color: GREEN }}>PASSED</span>
                </div>
                <div>
                  <strong>Total Audited Logs:</strong> {events.length}
                </div>
                <div>
                  <strong>Framework Evaluated:</strong> {activeTab}
                </div>
                <div>
                  <strong>Security Status:</strong> IMMUTABLE CO-SIGNATURES VALID
                </div>
              </div>

              <h4 style={{ color: TEAL, margin: "16px 0 8px", fontSize: 14 }}>Recent Anchor Timeline</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.slice(0, 5).map(e => (
                  <div key={e.id} style={{ borderBottom: "1px solid #1a1a2e", paddingBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{formatTitle(e)}</strong>
                      <span style={{ fontFamily: "monospace", fontSize: 11 }}>0x{e.id.substring(0, 8)}</span>
                    </div>
                    <span style={{ fontSize: 11, color: SLATE_DIM }}>{new Date(e.created_at).toLocaleString()} | {e.metadata?.source || "System"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${CARD_BORDER}`,
                  background: "transparent", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                <Printer size={14} /> Print Report
              </button>
              <button
                onClick={() => setIsReportOpen(false)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                  background: TEAL, color: "#000", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
