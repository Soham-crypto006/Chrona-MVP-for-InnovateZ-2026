"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  X
} from "lucide-react"
import { CompanyLogo } from "@/components/ui/CompanyLogo"
import { getSources, connectSource, type Source } from "@/lib/api"
import { toast } from "sonner"

/* ─── design tokens ─── */
const BG = "#080812"
const CARD_BG = "#0D0D1F"
const CARD_BORDER = "#1a1a2e"
const TEAL = "#00D4FF"
const GREEN = "#22C55E"
const RED = "#EF4444"
const SLATE = "#94A3B8"
const SLATE_DIM = "#64748B"

const cardStyle: React.CSSProperties = {
  background: CARD_BG,
  border: `1px solid ${CARD_BORDER}`,
  borderRadius: 14,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: 180,
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

export default function IntegrationsPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  // Connection Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedType, setSelectedType] = useState("notion")
  const [sourceName, setSourceName] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [workspaceId, setWorkspaceId] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const data = await getSources()
      setSources(data)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load live sources.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceName || !apiKey) {
      toast.error("All fields are required.")
      return
    }

    setSubmitting(true)
    try {
      await connectSource(sourceName, selectedType, apiKey, workspaceId)
      toast.success(`Successfully connected ${selectedType} integration: ${sourceName}`)
      setIsModalOpen(false)
      setSourceName("")
      setApiKey("")
      setWorkspaceId("")
      loadData()
    } catch (err) {
      console.error(err)
      toast.error("Failed to establish integration connection.")
    } finally {
      setSubmitting(false)
    }
  }

  const getSourceIntegrationStatus = (type: string) => {
    const matching = sources.find(s => s.type.toLowerCase() === type.toLowerCase())
    if (matching) {
      return {
        status: matching.status.toUpperCase(),
        desc: `${matching.name} connected`,
        stat: `${matching.chunks} chunks`
      }
    }
    return {
      status: "SETUP",
      desc: "Requires API Credentials",
      stat: "0 chunks"
    }
  }

  const handleConnectClick = (type: string) => {
    setSelectedType(type)
    setSourceName(`My ${type.charAt(0).toUpperCase() + type.slice(1)} Workspace`)
    setIsModalOpen(true)
  }

  const renderGrid = (title: string, items: any[]) => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
        {title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {items.map((item, i) => {
          const state = getSourceIntegrationStatus(item.typeKey)
          const isConnected = state.status === "CONNECTED" || state.status === "SYNCING"
          const statusColor = state.status === "CONNECTED" || state.status === "SYNCING" ? GREEN : state.status === "ERROR" ? RED : SLATE

          return (
            <div key={i} style={cardStyle}>
              {/* Top Row: Icon + Badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div style={{ 
                  width: 40, height: 40, borderRadius: 12, 
                  background: `${item.iconColor}10`, border: `1px solid ${item.iconColor}30`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <CompanyLogo name={item.name} size={20} />
                </div>
                <span style={{ 
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
                  color: statusColor, 
                  border: `1px solid ${statusColor}40`,
                  padding: "3px 8px", borderRadius: 4
                }}>
                  {state.status}
                </span>
              </div>

              {/* Middle: Title & Desc */}
              <div style={{ marginBottom: 24, flex: 1 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "#fff" }}>{item.name}</h3>
                <p style={{ margin: 0, fontSize: 12, color: SLATE_DIM }}>{state.desc}</p>
              </div>

              {/* Bottom: Stat & Action */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: SLATE_DIM }}>{state.stat}</span>
                <button 
                  onClick={() => {
                    if (isConnected) {
                      toast.info(`${item.name} integration is already active. Manage from Sources page.`)
                    } else {
                      handleConnectClick(item.typeKey)
                    }
                  }}
                  style={{ 
                    background: "transparent", border: "none", cursor: "pointer",
                    color: TEAL, fontSize: 12, fontWeight: 600, 
                    display: "flex", alignItems: "center", gap: 6, padding: 0
                  }}
                >
                  {isConnected ? "Active" : "Connect"} <ExternalLink size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const sourceItems = [
    { name: "Notion", typeKey: "notion", iconColor: "#ffffff" },
    { name: "Confluence", typeKey: "confluence", iconColor: "#0052CC" },
    { name: "Google Docs", typeKey: "gdrive", iconColor: "#0F9D58" },
    { name: "SharePoint", typeKey: "sharepoint", iconColor: "#0078D4" },
    { name: "GitHub", typeKey: "github", iconColor: "#ffffff" },
    { name: "Slack", typeKey: "slack", iconColor: "#E01E5A" },
  ]

  const vectorItems = [
    { name: "Qdrant", typeKey: "qdrant", iconColor: "#9333ea" },
    { name: "Pinecone", typeKey: "pinecone", iconColor: "#ffffff" },
    { name: "Weaviate", typeKey: "weaviate", iconColor: "#16a34a" },
    { name: "Chroma", typeKey: "chroma", iconColor: "#ffffff" },
  ]

  const modelItems = [
    { name: "OpenAI", typeKey: "openai", iconColor: "#10b981" },
    { name: "Anthropic", typeKey: "anthropic", iconColor: "#d97706" },
    { name: "Google", typeKey: "google", iconColor: "#ffffff" },
    { name: "Cohere", typeKey: "cohere", iconColor: "#8b5cf6" },
  ]

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            INTEGRATIONS HUB
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
            Wire CHRONA into your stack
          </h1>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0 }}>
            Connect sources, vector databases, and model providers in a single graph.
          </p>
        </div>
        <button 
          onClick={() => handleConnectClick("notion")}
          style={{
            background: `linear-gradient(135deg, ${TEAL}, #00B4D8)`, color: "#000",
            border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 4px 16px ${TEAL}40`, display: "flex", alignItems: "center", gap: 6
          }}
        >
          <Plus size={14} /> Add integration
        </button>
      </div>

      {/* ── SECTIONS ── */}
      {renderGrid("Knowledge sources", sourceItems)}
      {renderGrid("Vector stores", vectorItems)}
      {renderGrid("Model providers", modelItems)}

      {/* ── CONNECT DIALOG / OVERLAY ── */}
      {isModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14,
            width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 600 }}>
                Connect {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: SLATE_DIM, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConnect} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: SLATE_DIM, display: "block", marginBottom: 6 }}>INTEGRATION TYPE</label>
                <input 
                  type="text" 
                  value={selectedType.toUpperCase()} 
                  disabled 
                  style={{ ...inputStyle, background: "#1a1a2e", color: TEAL }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: SLATE_DIM, display: "block", marginBottom: 6 }}>CONNECTION NAME</label>
                <input 
                  type="text" 
                  value={sourceName} 
                  onChange={e => setSourceName(e.target.value)} 
                  style={inputStyle}
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: SLATE_DIM, display: "block", marginBottom: 6 }}>API SECRET KEY / TOKEN</label>
                <input 
                  type="password" 
                  placeholder="Enter credential key"
                  value={apiKey} 
                  onChange={e => setApiKey(e.target.value)} 
                  style={inputStyle}
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: SLATE_DIM, display: "block", marginBottom: 6 }}>WORKSPACE OR PROJECT ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. dev_workspace_1"
                  value={workspaceId} 
                  onChange={e => setWorkspaceId(e.target.value)} 
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
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
                    boxShadow: `0 4px 16px ${TEAL}40`, display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  {submitting ? "Connecting..." : "Establish Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
