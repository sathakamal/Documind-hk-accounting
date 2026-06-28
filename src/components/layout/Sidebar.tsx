"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = searchParams.get("tab") || "dash";

  // Check if we're on a standalone route (not /dashboard)
  const isDocuments = pathname === "/documents";
  const isUpload = pathname === "/upload";
  const isEmployees = pathname === "/employees";
  const isPayroll = pathname === "/payroll";
  const isPayrollHistory = pathname === "/payroll-history";

  const groups = [
    {
      name: "Overview",
      items: [
        { id: "dash", label: "Dashboard", ico: "📊" },
        { id: "framework", label: "Framework Selector", ico: "📏", badge: "NEW" },
      ],
    },
    {
      name: "Core Accounting",
      items: [
        { id: "coa", label: "Chart of Accounts", ico: "📋" },
        { id: "journal", label: "Journal Entries", ico: "📝" },
        { id: "ledger", label: "General Ledger", ico: "📒" },
        { id: "bank", label: "Bank Reconciliation", ico: "🏦" },
      ],
    },
    {
      name: "Receivables & Payables",
      items: [
        { id: "ar", label: "Accounts Receivable", ico: "💰" },
        { id: "ar-aging", label: "AR Aging Report", ico: "⏳" },
        { id: "ap", label: "Accounts Payable", ico: "💳" },
        { id: "ap-aging", label: "AP Aging Report", ico: "🕐" },
      ],
    },
    {
      name: "Fixed Assets",
      items: [
        { id: "assets", label: "Asset Register", ico: "🏗" },
        { id: "depr", label: "Depreciation Schedule", ico: "📉" },
      ],
    },
    {
      name: "Payroll & MPF",
      items: [
        { id: "emp", label: "Employee Records", ico: "👥", href: "/employees" },
        { id: "payroll", label: "Payroll Processing", ico: "💵", href: "/payroll" },
        { id: "payroll-history", label: "Payroll History", ico: "📜", href: "/payroll-history" },
      ],
    },
    {
      name: "Tax Compliance",
      items: [
        { id: "tax-recon", label: "Tax Computation", ico: "🧾" },
        { id: "profits-tax", label: "Profits Tax Calc", ico: "📐" },
        { id: "stamp-duty", label: "Stamp Duty Calc", ico: "🔖" },
      ],
    },
    {
      name: "Financial Reports",
      items: [
        { id: "tb", label: "Trial Balance", ico: "⚖" },
        { id: "pl", label: "Profit & Loss", ico: "📈" },
        { id: "bs", label: "Balance Sheet", ico: "🗂" },
        { id: "cf", label: "Cash Flow Statement", ico: "💧" },
        { id: "eq", label: "Changes in Equity", ico: "🔄" },
        { id: "notes", label: "Notes to Accounts", ico: "📑", badge: "NEW" },
      ],
    },
    {
      name: "Compliance & Admin",
      items: [
        { id: "compliance", label: "Compliance Center", ico: "✅", badge: "NEW" },
        { id: "audit", label: "Audit Trail", ico: "🔍" },
        { id: "deadlines", label: "HK Deadlines", ico: "📅" },
        { id: "settings", label: "Settings", ico: "⚙" },
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
            const isStandalone = 'href' in item;
            const isActive = isStandalone
              ? pathname === item.href
              : !isDocuments && !isUpload && currentTab === item.id;
            const href = isStandalone ? item.href : `/dashboard?tab=${item.id}`;
            
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