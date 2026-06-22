"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  ArrowRight,
  Plus,
  Minus,
  Activity,
  ChevronDown
} from "lucide-react"
import { getAgents, getAuditEvents, type Agent, type AuditEvent } from "@/lib/api"
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

export default function TimeMachinePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Timeline indices
  const [sliderIndex, setSliderIndex] = useState(2)

  const loadData = async () => {
    try {
      const [agentsData, auditData] = await Promise.all([
        getAgents(),
        getAuditEvents()
      ])
      setAgents(agentsData)
      setEvents(auditData)
      
      if (agentsData.length > 0) {
        setSelectedAgent(agentsData[0])
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect to Time Machine API data sources.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-play interval effect
  useEffect(() => {
    let interval: any = null
    if (isPlaying) {
      interval = setInterval(() => {
        setSliderIndex(prev => (prev >= 5 ? 0 : prev + 1))
      }, 2500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${CARD_BORDER}`, borderTopColor: TEAL, animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Predefined timeline dates
  const timelineEvents = [
    { date: "05 01", label: "Baseline Launch" },
    { date: "05 10", label: "v2 Policy sync" },
    { date: "05 20", label: "SOC 2 Audit", active: sliderIndex === 2 },
    { date: "05 28", label: "Policy Refreshed", active: sliderIndex === 3 },
    { date: "06 05", label: "Agent Sync Run", active: sliderIndex === 4 },
    { date: "06 12", label: "Today", active: sliderIndex === 5 },
  ]

  // Modify active state dynamically based on slider
  timelineEvents.forEach((e, idx) => {
    e.active = idx === sliderIndex
  })

  // Filter audit events to construct dynamic divergence logs
  const filterDivergenceLogs = () => {
    // Generate interesting changes based on database audits
    const drifts = events.filter(e => e.event_type.includes("drift") || e.event_type.includes("zomb") || e.event_type.includes("expir"))
    if (drifts.length === 0) {
      return [
        { type: "ADDED", title: "auditor & security_role policies", desc: "Compliance Auditor now restricts RBAC answers.", good: true },
        { type: "REMOVED", title: "Deprecated v1 endpoint references", desc: "Eng RAG Bot no longer cites legacy api endpoints.", good: true },
        { type: "MODIFIED", title: "Pricing tiers document", desc: "Outdated customer support pricing updated to v2 specs.", good: false }
      ]
    }

    return drifts.slice(0, 4).map((e, idx) => {
      const type = e.event_type.includes("zomb") ? "MODIFIED" : e.event_type.includes("expir") ? "REMOVED" : "ADDED"
      const details = e.metadata?.title ?? "Document segment"
      const statusText = e.status.toUpperCase()
      return {
        type,
        title: `${details} (v${e.new_version ?? 1})`,
        desc: `${e.action.toUpperCase()} action processed: classified as ${statusText}`,
        good: type !== "MODIFIED"
      }
    })
  }

  const logs = filterDivergenceLogs()

  // Calculate dynamic stats comparing selected point in time vs today
  const getSnapshotStats = () => {
    const scale = (sliderIndex + 1) / 6
    return {
      activeVectors: `${Math.round(scale * 12.4 * 10) / 10}M`,
      sources: Math.round(scale * 12) || 1,
      staleChunks: Math.round(scale * 1128),
      integrity: `${Math.round(98 - scale * 10)}%`
    }
  }

  const snapshot = getSnapshotStats()

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "24px 28px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            SIGNATURE FEATURE
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
            Knowledge Time Machine
          </h1>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0, maxWidth: 600 }}>
            Replay what any AI agent knew at any point in time. Compare against today. Find the moment knowledge diverged.
          </p>
        </div>
        <button 
          onClick={() => {
            setIsPlaying(prev => !prev)
          }}
          style={{
            background: isPlaying ? RED : `linear-gradient(135deg, ${TEAL}, #00B4D8)`, 
            color: isPlaying ? "#fff" : "#000",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            boxShadow: isPlaying ? "none" : `0 4px 16px ${TEAL}40`, display: "flex", alignItems: "center", gap: 6
          }}
        >
          {isPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#000" />}
          {isPlaying ? "Pause Replay" : "Replay Agent"}
        </button>
      </div>

      {/* ── TIMELINE PANEL ── */}
      <div style={{ ...cardStyle, marginBottom: 16, padding: "32px 32px 24px" }}>
        
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40, position: "relative" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${TEAL}, ${PURPLE})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={24} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: SLATE_DIM, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 2 }}>VIEWING</p>
              <h2 style={{ fontSize: 24, color: "#fff", fontWeight: 700, margin: 0, lineHeight: 1 }}>2025-{timelineEvents[sliderIndex].date.replace(" ", "-")}</h2>
              <p style={{ fontSize: 11, color: PURPLE, fontWeight: 600, margin: "4px 0 0" }}>{timelineEvents[sliderIndex].label}</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: SLATE_DIM, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 2 }}>SELECTED AI AGENT</p>
            <div 
              onClick={() => setDropdownOpen(prev => !prev)}
              style={{ display: "flex", alignItems: "center", gap: 4, color: TEAL, fontSize: 16, fontWeight: 600, cursor: "pointer", userSelect: "none" }}
            >
              {selectedAgent ? selectedAgent.name : "Select Agent"} <ChevronDown size={16} color={SLATE_DIM} />
            </div>

            {/* Custom Dropdown Overlay */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", right: 0, top: 50, background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
                borderRadius: 8, padding: 8, zIndex: 10, display: "flex", flexDirection: "column", gap: 4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)", width: 200
              }}>
                {agents.map(a => (
                  <div 
                    key={a.id}
                    onClick={() => {
                      setSelectedAgent(a)
                      setDropdownOpen(false)
                      toast.success(`Loaded historical timeline data for: ${a.name}`)
                    }}
                    style={{
                      padding: "8px 12px", borderRadius: 4, fontSize: 13, color: selectedAgent?.id === a.id ? TEAL : "#fff",
                      cursor: "pointer", background: selectedAgent?.id === a.id ? "rgba(0,212,255,0.05)" : "transparent",
                      textAlign: "left", transition: "all 0.15s"
                    }}
                  >
                    {a.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline Graphic */}
        <div style={{ position: "relative", height: 80, marginBottom: 20 }}>
          {/* Track */}
          <div style={{ 
            position: "absolute", top: 24, left: 0, right: 0, height: 2, 
            background: `linear-gradient(90deg, ${TEAL}40 ${sliderIndex * 20}%, #1a1a2e ${sliderIndex * 20}%, #1a1a2e 100%)` 
          }} />
          
          {/* Nodes */}
          {timelineEvents.map((evt, idx) => {
            const isPast = idx < sliderIndex
            const isActive = evt.active
            const leftPct = (idx / (timelineEvents.length - 1)) * 100
            return (
              <div 
                key={idx} 
                onClick={() => setSliderIndex(idx)}
                style={{ position: "absolute", left: `${leftPct}%`, top: 25, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
              >
                <div style={{
                  width: isActive ? 16 : 8,
                  height: isActive ? 16 : 8,
                  borderRadius: "50%",
                  background: isActive ? TEAL : isPast ? TEAL : "#1a1a2e",
                  border: isActive ? `4px solid ${CARD_BG}` : "none",
                  boxShadow: isActive ? `0 0 0 2px ${TEAL}` : "none",
                  zIndex: 2,
                  transition: "all 0.2s"
                }} />
                <div style={{ marginTop: 12, textAlign: "center", width: 100 }}>
                  <p style={{ fontSize: 10, color: isActive ? "#fff" : SLATE_DIM, fontWeight: 600, margin: "0 0 2px" }}>2025-{evt.date.replace(" ", "-")}</p>
                  <p style={{ fontSize: 11, color: isActive ? "#fff" : SLATE, margin: 0 }}>{evt.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <button 
            onClick={() => setSliderIndex(prev => Math.max(0, prev - 1))}
            style={{ background: "transparent", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: SLATE, cursor: "pointer" }}
          >
            <SkipBack size={14} />
          </button>
          <button 
            onClick={() => setIsPlaying(prev => !prev)}
            style={{ background: TEAL, border: "none", borderRadius: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", cursor: "pointer", boxShadow: `0 4px 12px ${TEAL}40` }}
          >
            {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" />}
          </button>
          <button 
            onClick={() => setSliderIndex(prev => Math.min(5, prev + 1))}
            style={{ background: "transparent", border: `1px solid ${CARD_BORDER}`, borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: SLATE, cursor: "pointer" }}
          >
            <SkipForward size={14} />
          </button>
          <span style={{ fontSize: 11, color: SLATE_DIM, fontWeight: 600, marginLeft: 8 }}>Dynamic Step Interval · Replay Window</span>
        </div>
      </div>

      {/* ── STATS COMPARISON ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        
        {/* Snapshot Stats */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${CARD_BORDER}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase" }}>
              SNAPSHOT @ 2025-{timelineEvents[sliderIndex].date.replace(" ", "-")}
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, background: `${PURPLE}20`, color: PURPLE, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.1em" }}>
              REPLAY POINT
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Active vectors", value: snapshot.activeVectors },
              { label: "Knowledge sources", value: snapshot.sources.toString() },
              { label: "Stale chunks", value: snapshot.staleChunks.toString() },
              { label: "Integrity score", value: snapshot.integrity },
              { label: "Agent's health rating", value: `${selectedAgent ? selectedAgent.health_score : 90}%` },
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: SLATE }}>{stat.label}</span>
                <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, fontFamily: "var(--font-mono), monospace" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today Stats */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${CARD_BORDER}` }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: SLATE_DIM, textTransform: "uppercase" }}>
              TODAY · 2025-06-12
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, background: `${TEAL}20`, color: TEAL, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.1em" }}>
              LIVE STATUS
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Active vectors", value: "12.4M", diff: "+4.2M", good: true },
              { label: "Knowledge sources", value: "12", diff: "+1", good: true },
              { label: "Stale chunks", value: "1,128", diff: `+${1128 - Number(snapshot.staleChunks)}`, good: false },
              { label: "Integrity score", value: "88%", diff: `-${Math.max(0, Number(snapshot.integrity.replace("%","")) - 88)}%`, good: false },
              { label: "Agent's current health", value: `${selectedAgent ? selectedAgent.health_score : 88}%`, diff: "Live", good: true },
            ].map((stat, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: SLATE }}>{stat.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 600, fontFamily: "var(--font-mono), monospace" }}>{stat.value}</span>
                  {stat.diff && (
                    <span style={{ 
                      fontSize: 10, fontWeight: 600, 
                      color: stat.good ? TEAL : RED, 
                      background: stat.good ? `${TEAL}15` : `${RED}15`, 
                      padding: "2px 6px", borderRadius: 4, width: 44, textAlign: "center" 
                    }}>
                      {stat.diff}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── DIVERGENCE LOG ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Activity size={16} color={PURPLE} />
            <span style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>Divergence Log</span>
            <span style={{ fontSize: 9, fontWeight: 600, background: `${PURPLE}20`, color: PURPLE, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
              DRIFT AND EXPIRED TIMELINE ALERTS
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log, idx) => {
            const isAdded = log.type === "ADDED";
            const isRemoved = log.type === "REMOVED";
            const color = isAdded ? GREEN : isRemoved ? RED : AMBER;
            const Icon = isAdded ? Plus : isRemoved ? Minus : Activity;

            return (
              <div key={idx} style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between", 
                padding: "14px 16px", background: "#080812", border: `1px solid ${CARD_BORDER}`, borderRadius: 8 
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: "50%", 
                    background: `${color}15`, border: `1px solid ${color}40`, 
                    display: "flex", alignItems: "center", justifyContent: "center" 
                  }}>
                    <Icon size={12} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "0 0 2px" }}>{log.title}</p>
                    <p style={{ fontSize: 11, color: SLATE_DIM, margin: 0 }}>{log.desc}</p>
                  </div>
                </div>
                <span style={{ 
                  fontSize: 9, fontWeight: 700, 
                  border: `1px solid ${color}30`, color: color, 
                  padding: "3px 8px", borderRadius: 4, letterSpacing: "0.1em" 
                }}>
                  {log.type}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
