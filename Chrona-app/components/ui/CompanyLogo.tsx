/* ─────────────────────────────────────────────────────
 *  CompanyLogo — renders recognisable brand marks
 *  Uses official CDN images, inline SVGs, or styled
 *  text logos.  No emoji, no generic circles.
 * ───────────────────────────────────────────────────── */

export function CompanyLogo({ name, size = 16 }: { name?: string; size?: number }) {
  const safeName = name || "System"
  const n = safeName.toLowerCase()

  /* ── brand detection (substring match) ── */
  let brand = ""
  if (n.includes("notion")) brand = "notion"
  else if (n.includes("confluence") || n.includes("atlassian")) brand = "confluence"
  else if (n.includes("sharepoint") || (n.includes("microsoft") && !n.includes("teams"))) brand = "sharepoint"
  else if (n.includes("github")) brand = "github"
  else if (n.includes("slack")) brand = "slack"
  else if (n.includes("google doc") || n.includes("gdrive") || n.includes("google drive")) brand = "gdrive"
  else if (n.includes("pinecone")) brand = "pinecone"
  else if (n.includes("weaviate")) brand = "weaviate"
  else if (n.includes("qdrant")) brand = "qdrant"
  else if (n.includes("openai")) brand = "openai"
  else if (n.includes("anthropic")) brand = "anthropic"
  else if (n.includes("google")) brand = "google"
  else if (n.includes("cohere")) brand = "cohere"
  else if (n.includes("salesforce")) brand = "salesforce"
  else if (n.includes("servicenow")) brand = "servicenow"
  else if (n.includes("datadog")) brand = "datadog"
  else if (n.includes("snowflake")) brand = "snowflake"
  else if (n.includes("jira")) brand = "jira"
  else if (n.includes("chroma")) brand = "chroma"
  else if (n.includes("s3") || n.includes("amazon")) brand = "s3"
  else if (n.includes("teams")) brand = "teams"

  switch (brand) {
    /* ───── Official CDN images ───── */

    case "notion":
      return (
        <img
          src="https://www.notion.so/images/logo-ios.png"
          alt="Notion" width={size} height={size}
          style={{ borderRadius: Math.max(2, size * 0.15), objectFit: "contain" }}
        />
      )

    case "confluence":
      return (
        <img
          src="https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png"
          alt="Confluence" width={size} height={size}
          style={{ objectFit: "contain" }}
        />
      )

    case "jira":
      return (
        <img
          src="https://wac-cdn.atlassian.com/assets/img/favicons/atlassian/favicon.png"
          alt="Jira" width={size} height={size}
          style={{ objectFit: "contain" }}
        />
      )

    case "github":
      return (
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="GitHub" width={size} height={size}
          style={{ filter: "invert(1)", objectFit: "contain", borderRadius: "50%" }}
        />
      )

    case "slack":
      return (
        <img
          src="https://a.slack-edge.com/80588/marketing/img/icons/icon_slack_hash_colored.png"
          alt="Slack" width={size} height={size}
          style={{ objectFit: "contain" }}
        />
      )

    /* ───── Inline SVG logos ───── */

    case "sharepoint":
      // Microsoft 4-square grid
      return (
        <svg width={size} height={size} viewBox="0 0 22 22">
          <rect x="1" y="1" width="9" height="9" fill="#F25022" rx="1" />
          <rect x="12" y="1" width="9" height="9" fill="#7FBA00" rx="1" />
          <rect x="1" y="12" width="9" height="9" fill="#00A4EF" rx="1" />
          <rect x="12" y="12" width="9" height="9" fill="#FFB900" rx="1" />
        </svg>
      )

    case "gdrive":
    case "google":
      // Google G — 4-colour quadrant circle
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill="#4285F4" />
          <path d="M22 12 A10 10 0 0 1 12 22 L12 12 Z" fill="#0F9D58" />
          <path d="M12 22 A10 10 0 0 1 2 12 L12 12 Z" fill="#F4B400" />
          <path d="M2 12 A10 10 0 0 1 12 2 L12 12 Z" fill="#DB4437" />
        </svg>
      )

    case "openai":
      // Official OpenAI hexagonal-knot logomark
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff">
          <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.99 5.99 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zM3.6 18.3a4.47 4.47 0 0 1-.54-3.01l.14.08 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06l-4.84 2.8A4.5 4.5 0 0 1 3.6 18.3zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97V11.6a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.87zm16.6 3.86l-5.84-3.39 2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.67a.79.79 0 0 0-.4-.67zm2.01-3.02l-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.08a4.5 4.5 0 0 1 7.38-3.46l-.14.08-4.78 2.76a.8.8 0 0 0-.39.68l-.01 6.72zm1.1-2.37l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z" />
        </svg>
      )

    case "salesforce":
      // Salesforce cloud in brand blue
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path
            d="M6.5 17h11a4 4 0 0 0 .24-7.93A4.5 4.5 0 0 0 14.5 5a4.48 4.48 0 0 0-2.4.69A5.5 5.5 0 0 0 6.5 8 4.5 4.5 0 0 0 2 12.5c0 2.49 2.01 4.5 4.5 4.5z"
            fill="#00A1E0"
          />
        </svg>
      )

    case "snowflake":
      // Asterisk / snowflake shape in Snowflake blue
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <line x1="12" y1="2" x2="12" y2="22" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round" />
          <line x1="3.3" y1="7" x2="20.7" y2="17" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round" />
          <line x1="3.3" y1="17" x2="20.7" y2="7" stroke="#29B5E8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="12" r="2.5" fill="#29B5E8" />
        </svg>
      )

    /* ───── Styled text logos ───── */

    case "pinecone":
      return (
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "#0D0D1F", border: "1px solid #1a1a2e", borderRadius: 6,
          padding: size > 18 ? "2px 6px" : "1px 3px",
          height: size, minWidth: size, boxSizing: "border-box",
        }}>
          <span style={{ fontWeight: 700, fontSize: Math.max(7, size * 0.42), lineHeight: 1, whiteSpace: "nowrap" }}>
            <span style={{ color: "#fff" }}>pine</span>
            <span style={{ color: "#00D4FF" }}>cone</span>
          </span>
        </div>
      )

    case "weaviate":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#0D0D1F", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(8, size * 0.55), color: "#4CAF50", lineHeight: 1,
        }}>
          W
        </div>
      )

    case "qdrant":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#0D0D1F", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(8, size * 0.55), color: "#E53935", lineHeight: 1,
        }}>
          Q
        </div>
      )

    case "anthropic":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(8, size * 0.55), color: "#FF6B35", lineHeight: 1,
        }}>
          A
        </div>
      )

    case "cohere":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(8, size * 0.55), color: "#FF6F61", lineHeight: 1,
        }}>
          C
        </div>
      )

    case "chroma":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "linear-gradient(135deg, #FF6B6B, #FFE66D, #4ECDC4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(8, size * 0.55), color: "#fff", lineHeight: 1,
        }}>
          C
        </div>
      )

    case "servicenow":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#0D0D1F", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(6, size * 0.38), color: "#81B5A1", lineHeight: 1,
        }}>
          SN
        </div>
      )

    case "datadog":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#0D0D1F", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(6, size * 0.38), color: "#632CA6", lineHeight: 1,
        }}>
          DD
        </div>
      )

    case "s3":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#0D0D1F", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(6, size * 0.4), color: "#FF9900", lineHeight: 1,
        }}>
          S3
        </div>
      )

    case "teams":
      return (
        <div style={{
          width: size, height: size, borderRadius: 6,
          background: "#464EB8", display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: Math.max(7, size * 0.45), color: "#fff", lineHeight: 1,
        }}>
          T
        </div>
      )

    /* ───── Fallback ───── */
    default:
      return (
        <div style={{
          width: size, height: size, borderRadius: 4,
          background: "#1a1a2e", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: Math.max(8, size * 0.5),
          color: "#fff", fontWeight: "bold",
        }}>
          {safeName.charAt(0).toUpperCase()}
        </div>
      )
  }
}
