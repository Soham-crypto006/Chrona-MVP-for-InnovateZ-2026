"use client"

import { useState, useEffect } from "react"
import { 
  getDepartments, 
  getAgents, 
  createOrUpdateDepartment, 
  deleteDepartment, 
  type Department, 
  type Agent 
} from "@/lib/api"
import { toast } from "sonner"
import { 
  Bot, 
  ShieldAlert, 
  Trash2, 
  Plus, 
  Sliders, 
  Database,
  Check
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
  position: "relative",
  overflow: "hidden"
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
  transition: "border-color 0.2s",
}

const SUPPORTED_FRAMEWORKS = ["SOC2", "HIPAA", "EU_AI_ACT", "ISO27001"]

export default function SettingsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [name, setName] = useState("")
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [deptsData, agentsData] = await Promise.all([
        getDepartments(),
        getAgents()
      ])
      setDepartments(deptsData)
      setAgents(agentsData)
    } catch (err) {
      console.error(err)
      toast.error("Failed to connect to backend configuration API.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Department name is required.")
      return
    }

    setSubmitting(true)
    try {
      await createOrUpdateDepartment(name, selectedAgents, selectedFrameworks)
      toast.success(`Successfully configured department "${name}"`)
      setName("")
      setSelectedAgents([])
      setSelectedFrameworks([])
      loadData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to save department configuration.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, deptName: string) => {
    if (!confirm(`Are you sure you want to delete department "${deptName}"?`)) return
    try {
      await deleteDepartment(id)
      toast.success(`Deleted department "${deptName}"`)
      loadData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to delete department configuration.")
    }
  }

  const toggleAgent = (id: string) => {
    setSelectedAgents(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleFramework = (fw: string) => {
    setSelectedFrameworks(prev => 
      prev.includes(fw) ? prev.filter(x => x !== fw) : [...prev, fw]
    )
  }

  if (loading) {
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
            WORKSPACE CONFIGURATION
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
            Workspace Settings
          </h1>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Configure your enterprise departments, assigned regulatory boundaries, and live AI Agent access dependencies.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        
        {/* Left: Department List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...cardStyle, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Configured Departments</h2>
            <p style={{ fontSize: 11, color: SLATE_DIM, marginBottom: 20 }}>Current operational units driving downstream simulation heatmaps.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {departments.length === 0 ? (
                <p style={{ color: SLATE_DIM, fontSize: 12, textAlign: "center", padding: 20 }}>No departments configured.</p>
              ) : (
                departments.map(dept => (
                  <div 
                    key={dept.id} 
                    style={{ 
                      padding: 16, 
                      borderRadius: 10, 
                      background: "#080812", 
                      border: `1px solid ${CARD_BORDER}`, 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      transition: "border-color 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${TEAL}50`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BORDER}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {dept.name}
                      </h3>
                      
                      {/* Meta Tags */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {/* Frameworks */}
                        {dept.regulatory_frameworks.map(fw => (
                          <span 
                            key={fw} 
                            style={{ 
                              fontSize: 9, 
                              fontWeight: 700, 
                              color: AMBER, 
                              background: `${AMBER}15`, 
                              padding: "2px 6px", 
                              borderRadius: 4,
                              border: `1px solid ${AMBER}30`
                            }}
                          >
                            {fw}
                          </span>
                        ))}

                        {/* Agents count */}
                        <span 
                          style={{ 
                            fontSize: 9, 
                            fontWeight: 700, 
                            color: PURPLE, 
                            background: `${PURPLE}15`, 
                            padding: "2px 6px", 
                            borderRadius: 4,
                            border: `1px solid ${PURPLE}30`,
                            display: "flex",
                            alignItems: "center",
                            gap: 3
                          }}
                        >
                          <Bot size={10} />
                          {dept.agent_ids.length} Agents
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDelete(dept.id, dept.name)}
                      style={{ 
                        background: "transparent", 
                        border: "none", 
                        cursor: "pointer", 
                        color: SLATE_DIM,
                        transition: "color 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = RED}
                      onMouseLeave={e => e.currentTarget.style.color = SLATE_DIM}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Setup Configuration Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form onSubmit={handleAddDepartment} style={cardStyle}>
            <span style={labelStyle}>DEPARTMENT CONFIGURATOR</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: "6px 0 16px" }}>
              Configure Unit Mapping
            </h2>

            {/* Department Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>DEPARTMENT NAME</label>
              <input 
                type="text" 
                placeholder="e.g. Compliance Team"
                value={name}
                onChange={e => setName(e.target.value)}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = TEAL}
                onBlur={e => e.currentTarget.style.borderColor = CARD_BORDER}
              />
            </div>

            {/* Regulatory Frameworks */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>REGULATORY FRAMEWORKS</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SUPPORTED_FRAMEWORKS.map(fw => {
                  const selected = selectedFrameworks.includes(fw)
                  return (
                    <button
                      key={fw}
                      type="button"
                      onClick={() => toggleFramework(fw)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: `1px solid ${selected ? TEAL : CARD_BORDER}`,
                        background: selected ? `${TEAL}10` : "transparent",
                        color: selected ? TEAL : SLATE,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      {selected && <Check size={10} />}
                      {fw}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Assigned AI Agents */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...labelStyle, display: "block", marginBottom: 8 }}>ASSIGN AI AGENTS</label>
              <div style={{ 
                maxHeight: 180, 
                overflowY: "auto", 
                border: `1px solid ${CARD_BORDER}`, 
                borderRadius: 8, 
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}>
                {agents.map(agent => {
                  const selected = selectedAgents.includes(agent.id)
                  return (
                    <div 
                      key={agent.id}
                      onClick={() => toggleAgent(agent.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: selected ? "rgba(0, 212, 255, 0.05)" : "transparent",
                        transition: "background 0.15s"
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}} // toggled on container div click
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>{agent.name}</span>
                      <span style={{ fontSize: 10, color: SLATE_DIM, fontFamily: "monospace" }}>({agent.model})</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${TEAL}, #00B4D8)`,
                color: "#000",
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                fontSize: 12,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : `0 4px 16px ${TEAL}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s"
              }}
            >
              <Plus size={14} />
              {submitting ? "Saving Config..." : "Save Configuration"}
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}
