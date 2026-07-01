"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, LogOut, Printer, Database } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tabNames: Record<string, string> = {
  dash: "Dashboard",
  framework: "Framework Selector",
  coa: "Chart of Accounts",
  journal: "Journal Entries",
  ledger: "General Ledger",
  bank: "Bank Reconciliation",
  ar: "Accounts Receivable",
  "ar-aging": "AR Aging Report",
  ap: "Accounts Payable",
  "ap-aging": "AP Aging Report",
  assets: "Asset Register",
  depr: "Depreciation Schedule",
  emp: "Employee Records",
  payroll: "Payroll Processing",
  mpf: "MPF Calculator",
  ir56b: "IR56B Generator",
  "tax-recon": "Tax Computation",
  "profits-tax": "Profits Tax Calculator",
  "stamp-duty": "Stamp Duty Calculator",
  tb: "Trial Balance",
  pl: "Profit & Loss",
  bs: "Balance Sheet",
  cf: "Cash Flow Statement",
  eq: "Changes in Equity",
  notes: "Notes to Accounts",
  compliance: "Compliance Center",
  audit: "Audit Trail",
  deadlines: "HK Deadlines",
  settings: "Settings",
};

const pathnameTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Chart of Accounts",
  "/ledger": "General Ledger",
  "/reconciliation": "Bank Reconciliation",
  "/customers": "Accounts Receivable",
  "/vendors": "Accounts Payable",
  "/assets": "Asset Register",
  "/depr": "Depreciation Schedule",
  "/employees": "Employee Records",
  "/payroll": "Payroll Processing",
  "/payroll-history": "Payroll History",
  "/mpf": "MPF Calculator",
  "/ir56b": "IR56B Generator",
  "/tax-recon": "Tax Computation",
  "/profits-tax": "Profits Tax Calculator",
  "/stamp-duty": "Stamp Duty Calculator",
  "/reports": "Financial Reports",
  "/compliance": "Compliance Center",
  "/audit": "Audit Trail",
  "/deadlines": "HK Deadlines",
  "/settings": "Settings",
  "/documents": "Document Inbox",
  "/upload": "Upload Documents",
  "/ar-aging": "AR Aging Report",
  "/ap-aging": "AP Aging Report",
};

export function Topbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dash";
  const [companyName, setCompanyName] = useState("HK Accounting Pro");
  const [frameworkLabel, setFrameworkLabel] = useState("HKFRS for Private Entities");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hkpro3_next");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed?.settings?.name) {
        setCompanyName(parsed.settings.name);
      }
      if (parsed?.settings?.fw === "full") {
        setFrameworkLabel("Full HKFRS");
      } else if (parsed?.settings?.fw === "sme") {
        setFrameworkLabel("SME-FRF & SME-FRS");
      } else {
        setFrameworkLabel("HKFRS for Private Entities");
      }
    } catch {
      // Keep default labels if local state is unavailable.
    }
  }, [pathname, tab]);

  const title = useMemo(() => {
    if (pathname === "/dashboard") {
      return tabNames[tab] || "Dashboard";
    }
    return pathnameTitles[pathname] || "Dashboard";
  }, [pathname, tab]);

  const exportBackup = () => {
    try {
      const saved = localStorage.getItem("hkpro3_next") || "{}";
      const blob = new Blob([saved], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hk_backup.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.alert("Backup export failed.");
    }
  };

  return (
    <div className="tb" style={{ width: "100%", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h2 id="pg-title">{title}</h2>
      </div>
      <div className="tb-r">
        <span style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600 }}>
          {companyName}
        </span>
        <span className="hk-badge hk-b-gold">
          {frameworkLabel}
        </span>
        <button
          className="hk-btn hk-btn-n hk-btn-s"
          onClick={exportBackup}
          title="Backup"
        >
          <Database className="w-3.5 h-3.5" />
          Backup
        </button>
        <button
          className="hk-btn hk-btn-o hk-btn-s"
          onClick={() => window.print()}
          title="Print"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-200">
              <User className="w-4 h-4 text-slate-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm font-semibold text-slate-700">
              {session?.user?.email || session?.user?.name || "Admin"}
            </div>
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
