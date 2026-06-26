"use client";

import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, LogOut, Printer, Database, Play } from "lucide-react";
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

export function Topbar() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dash";
  const title = tabNames[tab] || "Dashboard";

  return (
    <div className="tb" style={{ width: "100%", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <h2 id="pg-title" style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)" }}>
          {title}
        </h2>
      </div>
      <div className="tb-r" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: ".72rem", color: "var(--muted)", fontWeight: 600 }}>
          {session?.user?.name || "Admin"}
        </span>
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
              {session?.user?.email}
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
