"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function Sidebar() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dash";

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
        { id: "emp", label: "Employee Records", ico: "👥" },
        { id: "payroll", label: "Payroll Processing", ico: "💵" },
        { id: "mpf", label: "MPF Calculator", ico: "🔐" },
        { id: "ir56b", label: "IR56B Generator", ico: "📄" },
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

      {groups.map((grp) => (
        <div key={grp.name}>
          <div className="sb-grp">{grp.name}</div>
          {grp.items.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                href={`/dashboard?tab=${item.id}`}
                className={`sb-item ${isActive ? "active" : ""}`}
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
    </aside>
  );
}
