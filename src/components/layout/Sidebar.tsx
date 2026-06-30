"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = searchParams.get("tab") || "dash";

  // Check if we're on a standalone route (not /dashboard)
  const isStandalonePage = pathname !== "/dashboard" && pathname !== "/";
  const isDocuments = pathname === "/documents";
  const isUpload = pathname === "/upload";

  const groups = [
    {
      name: "Overview",
      items: [
        { id: "dash", label: "Dashboard", ico: "📊", href: "/dashboard" },
        { id: "framework", label: "Framework Selector", ico: "📏", href: "/dashboard?tab=framework", badge: "HK" },
      ],
    },
    {
      name: "Core Accounting",
      items: [
        { id: "coa", label: "Chart of Accounts", ico: "📋", href: "/accounts" },
        { id: "journal", label: "Journal Entries", ico: "📝" },
        { id: "ledger", label: "General Ledger", ico: "📒", href: "/ledger" },
        { id: "bank", label: "Bank Reconciliation", ico: "🏦", href: "/reconciliation" },
      ],
    },
    {
      name: "Receivables & Payables",
      items: [
        { id: "ar", label: "Accounts Receivable", ico: "💰", href: "/customers" },
        { id: "ap", label: "Accounts Payable", ico: "💳", href: "/vendors" },
      ],
    },
    {
      name: "Fixed Assets",
      items: [
        { id: "assets", label: "Asset Register", ico: "🏗", href: "/assets" },
        { id: "depr", label: "Depreciation Schedule", ico: "📉", href: "/depr" },
      ],
    },
    {
      name: "Payroll & MPF",
      items: [
        { id: "emp", label: "Employee Records", ico: "👥", href: "/employees" },
        { id: "payroll", label: "Payroll Processing", ico: "💵", href: "/payroll" },
        { id: "payroll-history", label: "Payroll History", ico: "📜", href: "/payroll-history" },
        { id: "mpf", label: "MPF Calculator", ico: "🏦", href: "/mpf" },
        { id: "ir56b", label: "IR56B Generator", ico: "📋", href: "/ir56b", badge: "HK" },
      ],
    },
    {
      name: "Tax Compliance",
      items: [
        { id: "tax-recon", label: "Tax Computation", ico: "🧾", href: "/tax-recon" },
        { id: "profits-tax", label: "Profits Tax Calc", ico: "📐", href: "/profits-tax" },
        { id: "stamp-duty", label: "Stamp Duty Calc", ico: "🔖", href: "/stamp-duty" },
      ],
    },
    {
      name: "Financial Reports",
      items: [
        { id: "tb", label: "Trial Balance", ico: "⚖", href: "/reports" },
        { id: "pl", label: "Profit & Loss", ico: "📈", href: "/reports" },
        { id: "bs", label: "Balance Sheet", ico: "🗂", href: "/reports" },
        { id: "cf", label: "Cash Flow Statement", ico: "💧", href: "/reports" },
        { id: "eq", label: "Changes in Equity", ico: "🔄", href: "/reports" },
        { id: "notes", label: "Notes to Accounts", ico: "📑", href: "/reports", badge: "HK" },
      ],
    },
    {
      name: "Compliance & Admin",
      items: [
        { id: "compliance", label: "Compliance Center", ico: "✅", href: "/compliance", badge: "HK" },
        { id: "audit", label: "Audit Trail", ico: "🔍", href: "/audit" },
        { id: "deadlines", label: "HK Deadlines", ico: "📅", href: "/deadlines", badge: "NEW" },
        { id: "ar-aging", label: "AR Aging Report", ico: "⏳", href: "/ar-aging" },
        { id: "ap-aging", label: "AP Aging Report", ico: "🕐", href: "/ap-aging" },
        { id: "settings", label: "Settings", ico: "⚙", href: "/settings" },
      ],
    },
  ];

  return (
    <aside className="sb" id="sb" style={{
      width: "var(--sw)",
      background: "linear-gradient(180deg, var(--navy), var(--navy2))",
      color: "#fff",
      height: "100vh",
      overflowY: "auto",
      flexShrink: 0,
    }}>
      <div className="sb-logo">
        <h1 style={{ fontSize: "1rem", fontWeight: "bold" }}>🏛 HK Accounting Pro</h1>
        <small>HKFRS · IRD · Cap.622 Compliant</small>
      </div>

      {/* ── Document Hub section (standalone routes) ── */}
      <div>
        <div className="sb-grp">Document Hub</div>
        <Link
          href="/documents"
          className={`sb-item ${isDocuments ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          <span className="ico" style={{ marginRight: "0.5rem" }}>📥</span>
          Document Inbox
          <span className="sb-badge" style={{ background: "#3b82f6" }}>HubDoc</span>
        </Link>
        <Link
          href="/upload"
          className={`sb-item ${isUpload ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          <span className="ico" style={{ marginRight: "0.5rem" }}>⬆</span>
          Upload Documents
        </Link>
      </div>

      {/* ── Tab-based sections ── */}
      {groups.map((grp) => (
        <div key={grp.name}>
          <div className="sb-grp">{grp.name}</div>
          {grp.items.map((item) => {
            const isStandalone = 'href' in item && typeof item.href === 'string';
            const isActive = isStandalone
              ? pathname === item.href
              : !isStandalonePage && currentTab === item.id;
            const href = isStandalone ? (item.href as string) : `/dashboard?tab=${item.id}`;
            
            return (
              <Link
                key={item.id}
                href={href}
                className={`sb-item ${isActive ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <span className="ico" style={{ marginRight: "0.5rem" }}>{item.ico}</span>
                {item.label}
                {'badge' in item && item.badge && <span className="sb-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}