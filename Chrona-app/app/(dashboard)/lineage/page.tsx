"use client"

import { useState, useEffect } from "react"
import {
  Maximize,
  Crosshair,
  Download,
  X,
  FileText,
  Database,
  Cpu,
  Fingerprint,
} from "lucide-react"
import { getLineageGraph } from "@/lib/api"
import { toast } from "sonner"

/* ─── design tokens ─── */
const BG = "#05050A"
const CARD_BG = "#0A0A15"
const CARD_BORDER = "#14142B"
const TEAL = "#00D4FF"      // Doc
const PURPLE = "#9D4EDD"    // Chunk
const MAGENTA = "#FF007F"   // Vector (Pink/Magenta)
const GREEN = "#00E676"     // Agent
const RED = "#FF3366"       // Selected / Stale path
const AMBER = "#F59E0B"
const SLATE_DIM = "#64748B"

const typeColors: Record<string, string> = {
  doc: TEAL,
  chunk: PURPLE,
  vector: MAGENTA,
  agent: GREEN,
}

const typeLabelMap: Record<string, string> = {
  doc: "Document",
  chunk: "Chunk",
  vector: "Vector",
  agent: "Agent",
}

/* ─────────────────────────────────────────────────── */
/*                    PAGE COMPONENT                  */
/* ─────────────────────────────────────────────────── */

export default function LineageGraphPage() {
  const [nodesList, setNodesList] = useState<any[]>([])
  const [edgesList, setEdgesList] = useState<any[]>([])
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [graphHeight, setGraphHeight] = useState(600)
  const [usingMockData, setUsingMockData] = useState(false)
  
  // Inspection Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Construct dynamic graph from backend API
  const loadGraph = async () => {
    try {
      const res = await getLineageGraph()
      if (!res.nodes || res.nodes.length === 0) {
        // Fallback to static mock nodes if db is empty
        setNodesList(staticNodes)
        setEdgesList(staticEdges)
        setSelectedNode(staticNodes.find((n) => n.id === "a3") || null)
        setGraphHeight(600)
        setUsingMockData(true)
        return
      }

      setNodesList(res.nodes)
      setEdgesList(res.edges)
      setGraphHeight(res.height)
      setUsingMockData(false)

      const firstAgent = res.nodes.find(n => n.type === "agent")
      setSelectedNode(firstAgent || res.nodes[0])
    } catch (err) {
      console.error(err)
      setNodesList(staticNodes)
      setEdgesList(staticEdges)
      setSelectedNode(staticNodes.find((n) => n.id === "a3") || null)
      setGraphHeight(600)
      setUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadGraph()
  }, [])

  // Calculate upstream and downstream active paths
  const getActiveLineage = (nodeId: string) => {
    const activeNodes = new Set<string>([nodeId])
    const activeEdges = new Set<string>()

    // Upstream traversal
    let queue = [nodeId]
    while (queue.length > 0) {
      const current = queue.shift()!
      edgesList.forEach(edge => {
        if (edge.to === current) {
          if (!activeNodes.has(edge.from)) {
            activeNodes.add(edge.from)
            queue.push(edge.from)
          }
          activeEdges.add(`${edge.from}->${edge.to}`)
        }
      })
    }

    // Downstream traversal
    queue = [nodeId]
    while (queue.length > 0) {
      const current = queue.shift()!
      edgesList.forEach(edge => {
        if (edge.from === current) {
          if (!activeNodes.has(edge.to)) {
            activeNodes.add(edge.to)
            queue.push(edge.to)
          }
          activeEdges.add(`${edge.from}->${edge.to}`)
        }
      })
    }

    return { activeNodes, activeEdges }
  }

  const getNode = (id: string) => nodesList.find(n => n.id === id)

  const { activeNodes, activeEdges } = selectedNode 
    ? getActiveLineage(selectedNode.id) 
    : { activeNodes: new Set<string>(), activeEdges: new Set<string>() }

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, color: TEAL, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            KNOWLEDGE LINEAGE GRAPH
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
              Trace knowledge from source to inference
            </h1>
            {usingMockData && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(245,158,11,0.1)", color: AMBER, border: `1px solid ${AMBER}30`, fontWeight: 600 }}>
                Sample data — live connection unavailable
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: SLATE_DIM, margin: 0, maxWidth: 500 }}>
            Inspect every Document → Chunk → Vector → Agent path. Click any node to highlight active traversal.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 5, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: "6px 12px", color: SLATE_DIM, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = TEAL} onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BORDER}>
            <Maximize size={13} /> Fit
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: "6px 12px", color: SLATE_DIM, fontSize: 12, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = TEAL} onMouseLeave={e => e.currentTarget.style.borderColor = CARD_BORDER}>
            <Crosshair size={13} /> Focus
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 5, background: TEAL, border: "none", borderRadius: 8, padding: "6px 14px", color: "#000", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: `0 4px 12px ${TEAL}30` }}>
            <Download size={13} /> Export Graph
          </button>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

        {/* Graph Canvas */}
        <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, padding: 20, position: "relative", minHeight: 560 }}>

          {/* Legend and stats bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            {Object.entries(typeLabelMap).map(([type, label]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColors[type], boxShadow: `0 0 10px ${typeColors[type]}`, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "#8a8f98", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
              <span style={{ width: 20, height: 0, borderTop: `2px dashed ${RED}`, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: RED, fontWeight: 600 }}>Stale / Active path</span>
            </div>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: TEAL, border: `1px solid ${TEAL}30`, background: `${TEAL}0C`, padding: "4px 12px", borderRadius: 12, fontWeight: 600, letterSpacing: "0.05em" }}>
              3,237 nodes · 8,492 edges
            </span>
          </div>

          {/* SVG Graph */}
          <svg width="100%" height={graphHeight} viewBox={`0 0 1050 ${graphHeight}`} style={{ overflow: "visible", background: "#05050C", borderRadius: 10, border: "1px solid #101025" }}>
            <defs>
              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeOpacity="0.03" strokeWidth="1"/>
              </pattern>
              
              {/* LED Glow Filters */}
              <filter id="glow-doc" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-chunk" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-vector" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-agent" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-active" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <rect width="100%" height="100%" fill="url(#gridPattern)" rx="10" />
            
            {/* Edges / Paths */}
            {edgesList.map((edge, i) => {
              const from = getNode(edge.from) || nodesList.find(n => n.id === edge.from)
              const to = getNode(edge.to) || nodesList.find(n => n.id === edge.to)
              if (!from || !to) return null
              
              const isActive = activeEdges.has(`${edge.from}->${edge.to}`)
              const offset = Math.abs(to.x - from.x) / 1.8
              const pathD = `M ${from.x} ${from.y} C ${from.x + offset} ${from.y}, ${to.x - offset} ${to.y}, ${to.x} ${to.y}`
              const pathId = `edge-${edge.from}-${edge.to}`
              
              return (
                <g key={i}>
                  <path
                    id={pathId}
                    d={pathD}
                    fill="none"
                    stroke={isActive ? RED : "#1C1C2E"}
                    strokeWidth={isActive ? 2 : 1.2}
                    strokeDasharray={isActive ? "5 4" : undefined}
                    opacity={isActive ? 1.0 : 0.25}
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s" }}
                  />
                  {isActive && (
                    <circle r="4.5" fill={RED} filter="url(#glow-active)">
                      <animateMotion dur="3.5s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="3.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              )
            })}

            {/* Nodes */}
            {nodesList.map((node) => {
              const color = typeColors[node.type]
              const isSelected = selectedNode?.id === node.id
              const isActive = activeNodes.has(node.id)
              const r = node.type === "agent" ? 9 : node.type === "vector" ? 7 : 8
              const filterId = `glow-${node.type}`
              
              return (
                <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: "pointer" }}>
                  
                  {/* Outer selection ring animation */}
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={r + 10} fill="none" stroke={color} strokeWidth={1.5} opacity={0.6} filter="url(#glow-active)">
                      <animate attributeName="r" values={`${r + 6};${r + 14};${r + 6}`} dur="2.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.4s" repeatCount="indefinite" />
                    </circle>
                  )}
                  
                  {/* Outer glow aura */}
                  <circle 
                    cx={node.x} cy={node.y} 
                    r={r + 8} 
                    fill={color} 
                    opacity={isActive ? 0.35 : 0.08} 
                    filter={`url(#${filterId})`}
                    style={{ transition: "opacity 0.3s" }}
                  />
                  
                  {/* Outer ring */}
                  <circle 
                    cx={node.x} cy={node.y} 
                    r={r} 
                    fill="#05050C" 
                    stroke={color} 
                    strokeWidth={isActive ? 2.5 : 1.5} 
                    opacity={isActive ? 1.0 : 0.4} 
                    style={{ transition: "stroke-width 0.3s, opacity 0.3s" }}
                  />
                  
                  {/* Inner LED solid dot */}
                  <circle 
                    cx={node.x} cy={node.y} 
                    r={r * 0.45} 
                    fill={color} 
                    opacity={isActive ? 1.0 : 0.4}
                    filter={`url(#${filterId})`}
                    style={{ transition: "opacity 0.3s" }}
                  />
                  
                  {/* Label with spacious rounded tag and readable font */}
                  <foreignObject x={node.x - 90} y={node.y + r + 8} width="180" height="30" style={{ overflow: "visible" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                      <div style={{
                        background: isSelected ? "#0A0A1E" : "#05050C",
                        border: `1px solid ${isSelected ? color : isActive ? `${color}40` : "#1F202E"}`,
                        boxShadow: isActive ? `0 0 10px ${color}20` : "none",
                        color: isSelected ? "#fff" : isActive ? "#c0c4cc" : "#5a5f6a",
                        fontSize: "10px",
                        fontWeight: isSelected ? 600 : 500,
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        whiteSpace: "nowrap",
                        transition: "all 0.3s"
                      }}>
                        {node.label}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Right Panel - Node Inspector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Node Inspector */}
          <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: SLATE_DIM, textTransform: "uppercase" }}>
                NODE INSPECTOR
              </span>
              <span style={{ fontSize: 9, color: TEAL, border: `1px solid ${TEAL}30`, background: `${TEAL}0B`, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>LIVE</span>
            </div>

            {selectedNode ? (
              <>
                {/* Node header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `${typeColors[selectedNode.type]}15`,
                    border: `2px solid ${typeColors[selectedNode.type]}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: typeColors[selectedNode.type], boxShadow: `0 0 8px ${typeColors[selectedNode.type]}` }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{selectedNode.label}</p>
                    <p style={{ fontSize: 9, color: SLATE_DIM, margin: 0, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {typeLabelMap[selectedNode.type]} · {selectedNode.id.substring(0, 8)}
                    </p>
                  </div>
                </div>

                {/* Health bar */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: SLATE_DIM, fontWeight: 500 }}>Knowledge Integrity</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>94%</span>
                  </div>
                  <div style={{ height: 5, background: "#101025", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: "94%", height: "100%", background: `linear-gradient(90deg, ${TEAL}, ${PURPLE})`, borderRadius: 3 }} />
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  {[
                    { label: "Status", value: selectedNode.raw?.status?.toUpperCase() ?? "ACTIVE", color: selectedNode.raw?.status === "zombie" ? RED : GREEN },
                    { label: "Ref Type", value: selectedNode.type === "agent" ? "LLM Dependency" : "Vector Chunk" },
                    { label: "Version", value: selectedNode.raw?.version ? `v${selectedNode.raw.version}` : "v1" },
                    { label: "Retrievals", value: selectedNode.raw?.retrievalCount ?? "42" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p style={{ fontSize: 10, color: SLATE_DIM, margin: "0 0 2px" }}>{stat.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: stat.color || "#fff", margin: 0 }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* CTA - Trigger inspection modal */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 8,
                    border: "none", background: TEAL,
                    color: "#000", fontWeight: 700, fontSize: 12, cursor: "pointer",
                    boxShadow: `0 4px 16px ${TEAL}30`, transition: "all 0.2s"
                  }} 
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px ${TEAL}50`} 
                  onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 16px ${TEAL}30`}
                >
                  Inspect Node Metrics
                </button>
              </>
            ) : (
              <p style={{ fontSize: 12, color: SLATE_DIM, textAlign: "center", padding: "20px 0" }}>
                Select a node to inspect lineage metrics.
              </p>
            )}
          </div>

          {/* Path Analytics */}
          <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, padding: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: SLATE_DIM, textTransform: "uppercase", display: "block", marginBottom: 14 }}>
              PATH ANALYTICS
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Average Depth", value: "4.2 Hops", color: "#fff" },
                { label: "Stale / Drifted Paths", value: "3 Active", color: RED },
                { label: "Orphan Vectors", value: "0 Detected", color: GREEN },
                { label: "Cross-source links", value: "18 Links", color: "#fff" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: SLATE_DIM, fontWeight: 500 }}>{item.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── INSPECTION MODAL (GLASSMORPHIC OVERLAY) ── */}
      {isModalOpen && selectedNode && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(3, 3, 7, 0.8)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)"
        }}>
          <div style={{
            background: CARD_BG, border: `1px solid ${typeColors[selectedNode.type]}40`, borderRadius: 16,
            width: "100%", maxWidth: 640, padding: 28, position: "relative",
            boxShadow: `0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px ${typeColors[selectedNode.type]}15`
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{
                position: "absolute", right: 20, top: 20, background: "transparent", border: "none",
                cursor: "pointer", color: SLATE_DIM, transition: "color 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = SLATE_DIM}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `${typeColors[selectedNode.type]}15`,
                border: `2px solid ${typeColors[selectedNode.type]}`,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {selectedNode.type === "doc" ? <FileText color={TEAL} size={20} /> :
                 selectedNode.type === "chunk" ? <Database color={PURPLE} size={20} /> :
                 selectedNode.type === "vector" ? <Fingerprint color={MAGENTA} size={20} /> :
                 <Cpu color={GREEN} size={20} />}
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 700 }}>
                  {selectedNode.label}
                </h3>
                <p style={{ margin: 0, color: typeColors[selectedNode.type], fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {typeLabelMap[selectedNode.type]} NODE METRICS & DATABASE STATE
                </p>
              </div>
            </div>

            {/* Content Preview (Specialized for text nodes) */}
            {(selectedNode.type === "chunk" || selectedNode.type === "doc") && (
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: SLATE_DIM, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                  Raw Content / Segmented Text
                </span>
                <div style={{
                  background: "#05050C", border: `1px solid ${CARD_BORDER}`, borderRadius: 8,
                  padding: 16, maxHeight: 160, overflowY: "auto",
                  color: "#e2e8f0", fontSize: 12, lineHeight: 1.6, fontFamily: "var(--font-mono), monospace"
                }}>
                  {selectedNode.raw?.content ?? "No text content loaded for this document reference node."}
                </div>
              </div>
            )}

            {/* Info Grid */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: SLATE_DIM, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Node Properties
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#05050C", padding: 16, borderRadius: 8, border: `1px solid ${CARD_BORDER}` }}>
                {Object.entries(selectedNode.raw ?? {}).filter(([k]) => k !== "content" && typeof selectedNode.raw[k] !== "object").map(([key, val]) => (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${CARD_BORDER}`, paddingBottom: 6 }}>
                    <span style={{ fontSize: 11, color: SLATE_DIM, fontFamily: "monospace" }}>{key}</span>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, fontFamily: "monospace" }}>{String(val)}</span>
                  </div>
                ))}
                {(!selectedNode.raw || Object.keys(selectedNode.raw).length === 0) && (
                  <p style={{ color: SLATE_DIM, fontSize: 11, margin: 0 }}>No standard properties recorded.</p>
                )}
              </div>
            </div>

            {/* JSON Payload Explorer */}
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, color: SLATE_DIM, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                SQL / Vector DB Payload (Raw JSON)
              </span>
              <div style={{
                background: "#030307", border: "1px solid #141425", borderRadius: 8,
                padding: "12px 16px", maxHeight: 180, overflowY: "auto",
                fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "#39E696"
              }}>
                <pre style={{ margin: 0 }}>{JSON.stringify(selectedNode.raw, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── Static/Fallback mock data (used when database is empty) ─── */
const staticNodes = [
  { id: "n1", label: "Engineering Wiki", type: "doc", x: 150, y: 150, raw: { title: "Engineering Wiki", type: "Document Reference", status: "active" } },
  { id: "n2", label: "Authentication OAuth Section", type: "chunk", x: 400, y: 80, raw: { id: "n2", title: "auth-flow.md#oauth", version: 1, retrievalCount: 14, status: "active", content: "All login operations must require multi-factor authentication (MFA)." } },
  { id: "n3", label: "Deployment Rollback Policy", type: "chunk", x: 400, y: 200, raw: { id: "n3", title: "deploy.md#rollback", version: 2, retrievalCount: 8, status: "active", content: "Deployment rollbacks can be initiated automatically by the CI pipeline." } },
  
  { id: "n4", label: "API Reference", type: "doc", x: 150, y: 320, raw: { title: "API Reference", type: "Document Reference", status: "active" } },
  { id: "n5", label: "API Tokens Expiration", type: "chunk", x: 400, y: 320, raw: { id: "n5", title: "api-v2.md#tokens", version: 1, retrievalCount: 22, status: "active", content: "Bearer tokens must have a strict expiration TTL limit of 24 hours." } },
  
  { id: "n6", label: "Security Policy", type: "doc", x: 150, y: 440, raw: { title: "Security Policy", type: "Document Reference", status: "active" } },
  { id: "n7", label: "Role Based Access Control", type: "chunk", x: 400, y: 440, raw: { id: "n7", title: "policy.md#rbac", version: 3, retrievalCount: 45, status: "zombie", content: "Access control lists are checked against the RBAC permissions table." } },
  { id: "n8", label: "Incident Reporting Protocol", type: "chunk", x: 400, y: 520, raw: { id: "n8", title: "incidents.md", version: 1, retrievalCount: 3, status: "active", content: "Security incidents must be logged and reported to the CSO within 2 hours." } },

  { id: "v1", label: "Vector #1", type: "vector", x: 650, y: 80, raw: { dimensions: 1536, distance_metric: "cosine", embedding_id: "qdrant-point-12" } },
  { id: "v2", label: "Vector #2", type: "vector", x: 650, y: 200, raw: { dimensions: 1536, distance_metric: "cosine", embedding_id: "qdrant-point-15" } },
  { id: "v3", label: "Vector #3", type: "vector", x: 650, y: 320, raw: { dimensions: 1536, distance_metric: "cosine", embedding_id: "qdrant-point-34" } },
  { id: "v4", label: "Vector #4", type: "vector", x: 650, y: 520, raw: { dimensions: 1536, distance_metric: "cosine", embedding_id: "qdrant-point-89" } },

  { id: "a1", label: "Customer Support Assistant", type: "agent", x: 900, y: 140, raw: { name: "Customer Support Assistant", model: "gpt-4o", health_score: 96, stale_count: 12 } },
  { id: "a2", label: "Engineering RAG Assistant", type: "agent", x: 900, y: 320, raw: { name: "Engineering RAG Assistant", model: "gpt-4o", health_score: 54, stale_count: 156 } },
  { id: "a3", label: "Compliance Audit Agent", type: "agent", x: 900, y: 520, raw: { name: "Compliance Audit Agent", model: "claude-3.7", health_score: 72, stale_count: 84 } },
]

const staticEdges = [
  { from: "n1", to: "n2" }, { from: "n1", to: "n3" },
  { from: "n4", to: "n5" },
  { from: "n6", to: "n7" }, { from: "n6", to: "n8" },
  
  { from: "n2", to: "v1" },
  { from: "n3", to: "v2" },
  { from: "n5", to: "v3" },
  { from: "n7", to: "v3" },
  { from: "n8", to: "v4" },

  { from: "v1", to: "a1" },
  { from: "v2", to: "a1" },
  { from: "v2", to: "a2" },
  { from: "v3", to: "a2" },
  { from: "v4", to: "a3" },
]
