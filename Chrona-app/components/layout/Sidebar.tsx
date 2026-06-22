"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  GitBranch,
  Activity,
  Clock,
  Zap,
  Users,
  Wrench,
  FileCheck,
  Plug,
} from "lucide-react"

/* ─── types ─── */
type NavItem = { label: string; href: string; icon: LucideIcon; badge?: string }
type NavSection = { title: string; items: NavItem[] }

/* ─── nav config ─── */
const sections: NavSection[] = [
  {
    title: "INTELLIGENCE",
    items: [
      { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
      { label: "Lineage Graph", href: "/lineage", icon: GitBranch },
      { label: "Drift Detection", href: "/drift", icon: Activity },
      { label: "Time Machine", href: "/time-machine", icon: Clock, badge: "NEW" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Impact Simulator", href: "/impact-simulator", icon: Zap },
      { label: "Agent Exposure", href: "/agent-exposure", icon: Users },
      { label: "Remediation", href: "/remediation", icon: Wrench },
    ],
  },
  {
    title: "GOVERNANCE",
    items: [
      { label: "Evidence Vault", href: "/evidence-vault", icon: FileCheck },
      { label: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
]

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/* ═══════════════════════════════════════════════════════════ */
/*                         SIDEBAR                            */
/* ═══════════════════════════════════════════════════════════ */

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#0A0A14",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: "1px solid #1a1a2e",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* ── Logo ── */}
      <div style={{ padding: "16px 16px 12px" }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            paddingBottom: 16,
            marginBottom: 8,
            borderBottom: "1px solid #1a1a2e"
          }}
        >
          {/* 48px circle with teal ring border and glow */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "2px solid #00D4FF",
              boxShadow: "0 0 12px rgba(0, 212, 255, 0.4), inset 0 0 8px rgba(0, 212, 255, 0.4)",
              background: "#080812",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                color: "#00D4FF",
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              C
            </span>
          </div>

          <div>
            <span
              style={{
                display: "block",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.15em",
                lineHeight: 1.2,
              }}
            >
              CHRONA
            </span>
            <span
              style={{
                display: "block",
                color: "#00D4FF",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.15em",
                marginTop: 2,
              }}
            >
              CONTROL CENTER
            </span>
          </div>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          paddingTop: 4,
        }}
      >
        {sections.map((section) => (
          <div key={section.title}>
            {/* Section label */}
            <p
              style={{
                color: "#4a4a6a",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "16px 16px 6px 16px",
                margin: 0,
              }}
            >
              {section.title}
            </p>

            {/* Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {section.items.map((item) => {
                const active = isActiveRoute(pathname, item.href)
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={Icon}
                    active={active}
                    badge={item.badge}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom Status ── */}
      <BottomStatus />
    </aside>
  )
}

/* ─────────────────────────────────── Nav Link ─── */

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  badge?: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 34,
        padding: "0 12px",
        margin: "1px 8px",
        borderRadius: 6,
        textDecoration: "none",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "#fff" : "#6b6b8a",
        background: active ? "#00D4FF12" : "transparent",
        boxShadow: active ? "inset 3px 0 0 #00D4FF" : "none",
        transition: "background 0.15s, color 0.15s",
        position: "relative",
      }}
      onMouseOver={(e) => {
        if (!active) {
          e.currentTarget.style.background = "#ffffff08"
          e.currentTarget.style.color = "#fff"
        }
      }}
      onMouseOut={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.color = "#6b6b8a"
        }
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          color: active ? "#00D4FF" : "#4a4a6a",
          transition: "color 0.15s",
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#00D4FF",
            background: "#00D4FF18",
            padding: "2px 6px",
            borderRadius: 4,
            letterSpacing: "0.05em",
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}

/* ─────────────────────────────────── Bottom Status ─── */

function BottomStatus() {
  return (
    <div
      style={{
        margin: "8px 12px 12px",
        background: "#0D0D1A",
        border: "1px solid #1a1a2e",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 2,
        }}
      >
        <span
          style={{
            position: "relative",
            width: 7,
            height: 7,
            display: "inline-flex",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "#22C55E",
              animation: "sidebarPulse 2s ease-in-out infinite",
              opacity: 0.6,
            }}
          />
          <span
            style={{
              position: "relative",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#22C55E",
              boxShadow: "0 0 6px rgba(34,197,94,0.5)",
            }}
          />
        </span>
        <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
          All systems nominal
        </span>
      </div>
      <p style={{ color: "#4a4a6a", fontSize: 10, margin: 0 }}>
        uptime 99.998% · p50 12ms
      </p>

      <style>{`
        @keyframes sidebarPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
