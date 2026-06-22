"use client"

import { Search, Bell } from "lucide-react"

export default function TopBar() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        background: "#0A0A14",
        borderBottom: "1px solid #1a1a2e",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#0f0f1a",
          border: "1px solid #1a1a2e",
          borderRadius: 8,
          padding: "6px 12px",
          width: 320,
        }}
      >
        <Search size={14} color="#6b6b8a" />
        <input
          placeholder="Search documents, chunks, agents..."
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontSize: 12,
            flex: 1,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#6b6b8a",
            background: "#1a1a2e",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Date range */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#0f0f1a",
            border: "1px solid #1a1a2e",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            color: "#fff",
            fontWeight: 500,
          }}
        >
          Last 30 days
        </div>

        {/* Live indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            borderRadius: 9999,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#22C55E",
          }}
        >
          <span>+</span> Live
        </div>

        {/* Bell */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <Bell size={18} color="#6b6b8a" />
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7C3AED, #9333EA)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          AK
        </div>
      </div>
    </header>
  )
}
