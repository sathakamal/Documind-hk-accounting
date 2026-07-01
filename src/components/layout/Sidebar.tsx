"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentTab = searchParams.get("tab") || "dash";
  const isDocuments = pathname === "/documents";
  const isUpload = pathname === "/upload";

  const groups = [
    {
      name: "Overview",
      items: [
        { id: "dash", label: "Dashboard", ico: "📊", href: "/dashboard" },
        { id: "framework", label: "Framework Selector", ico: "📏", href: "/dashboard?tab=framework", badge: "NEW" },
      ],
    },
    {
      name: "Core Accounting",
      items: [
        { id: "coa", label: "Chart of Accounts", ico: "📋", href: "/accounts" },
        { id: "journal", label: "Journal Entries", ico: "📝", href: "/dashboard?tab=journal" },
        { id: "ledger", label: "General Ledger", ico: "📒", href: "/ledger" },
        { id: "bank", label: "Bank Reconciliation", ico: "🏦", href: "/reconciliation" },
      ],
    },
    {
      name: "Receivables & Payables",
      items: [
        { id: "ar", label: "Accounts Receivable", ico: "💰", href: "/dashboard?tab=ar" },
        { id: "ar-aging", label: "AR Aging Report", ico: "⏳", href: "/ar-aging" },
        { id: "ap", label: "Accounts Payable", ico: "💳", href: "/dashboard?tab=ap" },
        { id: "ap-aging", label: "AP Aging Report", ico: "🕐", href: "/ap-aging" },
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
        { id: "mpf", label: "MPF Calculator", ico: "🔐", href: "/mpf" },
        { id: "ir56b", label: "IR56B Generator", ico: "📄", href: "/ir56b" },
        { id: "payroll-history", label: "Payroll History", ico: "📜", href: "/payroll-history" },
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
        { id: "notes", label: "Notes to Accounts", ico: "📑", href: "/reports", badge: "NEW" },
      ],
    },
    {
      name: "Compliance & Admin",
      items: [
        { id: "compliance", label: "Compliance Center", ico: "✅", href: "/compliance", badge: "NEW" },
        { id: "audit", label: "Audit Trail", ico: "🔍", href: "/audit" },
        { id: "deadlines", label: "HK Deadlines", ico: "📅", href: "/deadlines" },
        { id: "settings", label: "Settings", ico: "⚙", href: "/settings" },
      ],
    },
  ];

  const isActiveItem = (item: { id: string; href: string }) => {
    if (item.href.startsWith("/dashboard?tab=")) {
      return pathname === "/dashboard" && currentTab === item.id;
    }

    if (item.href === "/dashboard") {
      return pathname === "/dashboard" && currentTab === "dash";
    }

    if (item.href === "/reports") {
      return pathname === "/reports";
    }

    return pathname === item.href;
  };

  return (
    <aside className="sb" id="sb" style={{ flexShrink: 0 }}>
      <div className="sb-logo">
        <h1 style={{ fontSize: "1rem", fontWeight: "bold" }}>🏛 HK Accounting Pro</h1>
        <small>HKFRS · IRD · Cap.622 Compliant</small>
      </div>

      {groups.map((grp) => (
        <div key={grp.name}>
          <div className="sb-grp">{grp.name}</div>
          {grp.items.map((item) => {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`sb-item ${isActiveItem(item) ? "active" : ""}`}
                style={{ textDecoration: "none" }}
              >
                <span className="ico">{item.ico}</span>
                {item.label}
                {item.badge && <span className="sb-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}

      <div>
        <div className="sb-grp">Document Hub</div>
        <Link
          href="/documents"
          className={`sb-item ${isDocuments ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          <span className="ico">📥</span>
          Document Inbox
          <span className="sb-badge" style={{ background: "var(--blue)" }}>HubDoc</span>
        </Link>
        <Link
          href="/upload"
          className={`sb-item ${isUpload ? "active" : ""}`}
          style={{ textDecoration: "none" }}
        >
          <span className="ico">⬆</span>
          Upload Documents
        </Link>
      </div>
    </aside>
  );
}
