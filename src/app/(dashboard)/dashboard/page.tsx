"use client";

import React, { Suspense, useEffect, useState, Fragment } from "react";
import { useSearchParams } from "next/navigation";

// Define the schema types mirroring the HTML D object
interface AccountItem {
  c: string; // Code
  n: string; // Name
  t: string; // Type
  nr: string; // Normal: Dr/Cr
}

interface JournalLine {
  a: string; // Account Code
  ld: string; // Line Description
  dr: number;
  cr: number;
}

interface JournalEntry {
  id: number;
  dt: string;
  ref: string;
  desc: string;
  type: string;
  cur: string;
  rate: number;
  lines: JournalLine[];
  ts: string;
}

interface Invoice {
  id: number;
  num: string;
  cust: string;
  dt: string;
  due: string;
  amt: number;
  pd: number;
  st: string;
}

interface Bill {
  id: number;
  num: string;
  vend: string;
  dt: string;
  due: string;
  amt: number;
  pd: number;
  st: string;
}

interface Asset {
  id: number;
  name: string;
  cat: string;
  date: string;
  cost: number;
  life: number;
  pool: number;
  res: number;
  status: string;
}

interface Employee {
  id: number;
  name: string;
  hkid: string;
  pos: string;
  dept: string;
  start: string;
  sal: number;
  housing: number;
  mpfEx: string;
  st: string;
}

interface AuditLog {
  ts: string;
  a: string; // Action
  d: string; // Details
  t: string; // Type
  u: string; // User
}

interface Settings {
  name: string;
  brn: string;
  cr: string;
  fw: string;
  cur: string;
  addr: string;
  aud: string;
}

interface HKProState {
  settings: Settings;
  accounts: AccountItem[];
  journals: JournalEntry[];
  invoices: Invoice[];
  bills: Bill[];
  assets: Asset[];
  employees: Employee[];
  bkBal: number;
  log: AuditLog[];
}

const defCOA: AccountItem[] = [
  { c: "1000", n: "Cash on Hand", t: "Asset", nr: "Dr" },
  { c: "1010", n: "HSBC HKD Current", t: "Asset", nr: "Dr" },
  { c: "1020", n: "BOCHK USD Savings", t: "Asset", nr: "Dr" },
  { c: "1100", n: "Accounts Receivable", t: "Asset", nr: "Dr" },
  { c: "1200", n: "Prepayments", t: "Asset", nr: "Dr" },
  { c: "1300", n: "Deposits & Guarantees", t: "Asset", nr: "Dr" },
  { c: "1400", n: "Fixed Asset: Computer Equipment", t: "Asset", nr: "Dr" },
  { c: "1410", n: "Acc.Depr: Computers", t: "Asset", nr: "Cr" },
  { c: "1500", n: "Fixed Asset: Motor Vehicles", t: "Asset", nr: "Dr" },
  { c: "1510", n: "Acc.Depr: Vehicles", t: "Asset", nr: "Cr" },
  { c: "1600", n: "Deferred Tax Asset", t: "Asset", nr: "Dr" },
  { c: "2000", n: "Accounts Payable", t: "Liability", nr: "Cr" },
  { c: "2100", n: "Accrued Expenses", t: "Liability", nr: "Cr" },
  { c: "2200", n: "MPF Payable", t: "Liability", nr: "Cr" },
  { c: "2300", n: "Profits Tax Provision", t: "Liability", nr: "Cr" },
  { c: "2400", n: "Directors Current Account", t: "Liability", nr: "Cr" },
  { c: "2500", n: "Deferred Tax Liability", t: "Liability", nr: "Cr" },
  { c: "3000", n: "Paid-up Share Capital", t: "Equity", nr: "Cr" },
  { c: "3100", n: "Retained Earnings (Opening)", t: "Equity", nr: "Cr" },
  { c: "3200", n: "Dividends Declared", t: "Equity", nr: "Dr" },
  { c: "4000", n: "Sales Revenue", t: "Revenue", nr: "Cr" },
  { c: "4100", n: "Service Revenue", t: "Revenue", nr: "Cr" },
  { c: "4200", n: "Interest Income", t: "Revenue", nr: "Cr" },
  { c: "4900", n: "Offshore Income (Exempt)", t: "Revenue", nr: "Cr" },
  { c: "5000", n: "Cost of Goods Sold", t: "Expense", nr: "Dr" },
  { c: "5100", n: "Salaries & Wages", t: "Expense", nr: "Dr" },
  { c: "5200", n: "Director Fees", t: "Expense", nr: "Dr" },
  { c: "5300", n: "MPF Employer Contributions", t: "Expense", nr: "Dr" },
  { c: "5400", n: "Depreciation & Amortisation", t: "Expense", nr: "Dr" },
  { c: "5500", n: "Professional Fees", t: "Expense", nr: "Dr" },
  { c: "5600", n: "Office & Admin", t: "Expense", nr: "Dr" },
  { c: "5700", n: "Marketing", t: "Expense", nr: "Dr" },
  { c: "5800", n: "Insurance", t: "Expense", nr: "Dr" },
  { c: "5900", n: "Bank Charges", t: "Expense", nr: "Dr" },
  { c: "5950", n: "FX Loss", t: "Expense", nr: "Dr" },
  { c: "6000", n: "Income Tax Expense", t: "Expense", nr: "Dr" },
  { c: "6100", n: "Deferred Tax Expense", t: "Expense", nr: "Dr" }
];

const FW_CFG: Record<string, {
  label: string;
  color: string;
  bg: string;
  border: string;
  cls: string;
  reports: string[];
  notes: string;
  deferredTax: boolean;
  fairValue: boolean;
}> = {
  full: {
    label: "Full HKFRS",
    color: "#1565c0",
    bg: "#e3f2fd",
    border: "#90caf9",
    cls: "fw-full",
    reports: ["Balance Sheet", "Income Statement", "Cash Flow Statement", "Changes in Equity", "Notes to Accounts", "Segment Reporting", "EPS"],
    notes: "full",
    deferredTax: true,
    fairValue: true,
  },
  pe: {
    label: "HKFRS for Private Entities",
    color: "#2e7d32",
    bg: "#e8f5e9",
    border: "#a5d6a7",
    cls: "fw-pe",
    reports: ["Balance Sheet", "Income Statement", "Cash Flow Statement", "Changes in Equity", "Notes (Simplified)"],
    notes: "simplified",
    deferredTax: true,
    fairValue: false,
  },
  sme: {
    label: "SME-FRF & SME-FRS",
    color: "#e65100",
    bg: "#fff3e0",
    border: "#ffcc80",
    cls: "fw-sme",
    reports: ["Balance Sheet", "Income Statement", "Notes (Minimal)"],
    notes: "minimal",
    deferredTax: false,
    fairValue: false,
  },
};

function WorkspaceContent() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dash";

  // Unified State D
  const [D, setD] = useState<HKProState>({
    settings: { name: "DocuMind HK Pro Co.", brn: "88888888", cr: "77777777", fw: "pe", cur: "HKD", addr: "Central, Hong Kong", aud: "S. K. Chan & Co. CPA" },
    accounts: [...defCOA],
    journals: [],
    invoices: [],
    bills: [],
    assets: [],
    employees: [],
    bkBal: 0,
    log: [],
  });

  // Load from localstorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("hkpro3_next");
    if (saved) {
      try {
        setD(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage data", e);
      }
    }
  }, []);

  // Save to localstorage
  const saveState = (updated: HKProState) => {
    setD(updated);
    localStorage.setItem("hkpro3_next", JSON.stringify(updated));
  };

  const addLog = (a: string, d: string, t = "INFO", stateToUpdate?: HKProState) => {
    const newLog: AuditLog = {
      ts: new Date().toISOString(),
      a,
      d,
      t,
      u: "Admin",
    };
    if (stateToUpdate) {
      const updated = {
        ...stateToUpdate,
        log: [newLog, ...stateToUpdate.log],
      };
      saveState(updated);
    } else {
      const updated = {
        ...D,
        log: [newLog, ...D.log],
      };
      saveState(updated);
    }
  };

  const payInv = (id: number, partial: boolean) => {
    const inv = D.invoices.find((i) => i.id === id);
    if (!inv) return;
    let pd = inv.pd;
    if (partial) {
      const amtStr = prompt("Enter partial payment amount:", String(inv.amt - inv.pd));
      if (!amtStr) return;
      const amt = parseFloat(amtStr);
      if (isNaN(amt) || amt <= 0) return;
      pd = Math.min((inv.pd || 0) + amt, inv.amt);
    } else {
      pd = inv.amt;
    }
    const st = pd >= inv.amt ? "Paid" : "Part-Paid";
    
    const updatedInvs = D.invoices.map((i) =>
      i.id === id ? { ...i, pd, st } : i
    );
    const updatedState = { ...D, invoices: updatedInvs };
    addLog("INV_PAY", `Received payment for ${inv.num}: ${F(pd)}`, "INFO", updatedState);
  };

  const delInv = (id: number) => {
    const inv = D.invoices.find((i) => i.id === id);
    if (!inv) return;
    if (!confirm(`Delete invoice ${inv.num}?`)) return;
    const filtered = D.invoices.filter((i) => i.id !== id);
    const updatedState = { ...D, invoices: filtered };
    addLog("INV_DEL", `Deleted Invoice ${inv.num}`, "INFO", updatedState);
  };

  const payBill = (id: number, partial: boolean) => {
    const bill = D.bills.find((b) => b.id === id);
    if (!bill) return;
    let pd = bill.pd;
    if (partial) {
      const amtStr = prompt("Enter partial payment amount:", String(bill.amt - bill.pd));
      if (!amtStr) return;
      const amt = parseFloat(amtStr);
      if (isNaN(amt) || amt <= 0) return;
      pd = Math.min((bill.pd || 0) + amt, bill.amt);
    } else {
      pd = bill.amt;
    }
    const st = pd >= bill.amt ? "Paid" : "Part-Paid";
    
    const updatedBills = D.bills.map((b) =>
      b.id === id ? { ...b, pd, st } : b
    );
    const updatedState = { ...D, bills: updatedBills };
    addLog("BILL_PAY", `Paid bill ${bill.num}: ${F(pd)}`, "INFO", updatedState);
  };

  const delBill = (id: number) => {
    const bill = D.bills.find((b) => b.id === id);
    if (!bill) return;
    if (!confirm(`Delete bill ${bill.num}?`)) return;
    const filtered = D.bills.filter((b) => b.id !== id);
    const updatedState = { ...D, bills: filtered };
    addLog("BILL_DEL", `Deleted Bill ${bill.num}`, "INFO", updatedState);
  };

  // Helpers
  const F = (v: number, p = "HK$") => p + Number(v || 0).toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const N = (v: number) => Number(v || 0).toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const td = () => new Date().toISOString().split("T")[0];
  const dBtw = (a: string, b: string) => Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 864e5);
  const dtFmt = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const getBal = (code: string, journalsList = D.journals) => {
    let dr = 0, cr = 0;
    journalsList.forEach((j) => {
      j.lines.forEach((l) => {
        if (l.a === code) {
          dr += +l.dr || 0;
          cr += +l.cr || 0;
        }
      });
    });
    const a = D.accounts.find((x) => x.c === code);
    return a ? (a.nr === "Dr" ? dr - cr : cr - dr) : 0;
  };

  const drCr = (code: string) => {
    let dr = 0, cr = 0;
    D.journals.forEach((j) => {
      j.lines.forEach((l) => {
        if (l.a === code) {
          dr += +l.dr || 0;
          cr += +l.cr || 0;
        }
      });
    });
    return { dr, cr };
  };

  const totType = (t: string) => {
    return D.accounts.filter((a) => a.t === t).reduce((s, a) => s + getBal(a.c), 0);
  };

  const mpfCalc = (sal: number, exempt: boolean) => {
    if (exempt) return { ee: 0, er: 0 };
    let ee = 0, er = Math.min(sal * .05, 1500);
    if (sal >= 7100) ee = Math.min(sal * .05, 1500);
    return { ee, er };
  };

  const taxCalc = (p: number, e = "corp") => {
    if (p <= 0) return 0;
    const r1 = e === "corp" ? .0825 : .075, r2 = e === "corp" ? .165 : .15;
    return p <= 2e6 ? p * r1 : (2e6 * r1 + (p - 2e6) * r2);
  };

  const assetBook = (a: Asset) => {
    const an = (a.cost - (a.res || 0)) / a.life;
    const yr = (new Date().getTime() - new Date(a.date).getTime()) / 315576e5;
    const ac = Math.min(an * yr, a.cost - (a.res || 0));
    return { an, ac, wdv: a.cost - ac };
  };

  const assetTax = (a: Asset) => {
    const init = a.cost * .6; // HK Initial Allowance standard is 60%
    const aft = a.cost - init;
    const ann = aft * (a.pool / 100);
    return { init, ann, wdv: a.cost - init - ann };
  };

  // Framework helper
  const fw = D.settings.fw || "pe";
  const cfg = FW_CFG[fw] || FW_CFG.pe;

  // Load Demo Data Function
  const loadDemo = () => {
    const demo: HKProState = {
      settings: { name: "TST Gems & Jewellery Ltd", brn: "61234567", cr: "10987654", fw: "pe", cur: "HKD", addr: "Nathan Road, TST, Kowloon", aud: "Raymond Lee & Partners CPA" },
      accounts: [...defCOA],
      journals: [
        {
          id: 1,
          dt: "2025-01-01",
          ref: "CAP-001",
          desc: "Share capital injection",
          type: "Opening Balance",
          cur: "HKD",
          rate: 1,
          lines: [
            { a: "1010", ld: "HSBC Current Account Entry", dr: 500000, cr: 0 },
            { a: "3000", ld: "Common stock investment", dr: 0, cr: 500000 },
          ],
          ts: new Date().toISOString(),
        },
        {
          id: 2,
          dt: "2025-01-15",
          ref: "JE-0002",
          desc: "Office rent payment",
          type: "Standard",
          cur: "HKD",
          rate: 1,
          lines: [
            { a: "5600", ld: "Central Office Rent", dr: 22000, cr: 0 },
            { a: "1010", ld: "Autopay", dr: 0, cr: 22000 },
          ],
          ts: new Date().toISOString(),
        },
        {
          id: 3,
          dt: "2025-02-05",
          ref: "JE-0003",
          desc: "Purchased Computer equipment",
          type: "Standard",
          cur: "HKD",
          rate: 1,
          lines: [
            { a: "1400", ld: "MacBook Pro + Monitor", dr: 18000, cr: 0 },
            { a: "1010", ld: "Corporate HSBC Card", dr: 0, cr: 18000 },
          ],
          ts: new Date().toISOString(),
        },
        {
          id: 4,
          dt: "2025-03-01",
          ref: "JE-0004",
          desc: "Jewellery Sales Revenue",
          type: "Standard",
          cur: "HKD",
          rate: 1,
          lines: [
            { a: "1100", ld: "Invoice INV-001", dr: 145000, cr: 0 },
            { a: "4000", ld: "Wholesale jewellery local sales", dr: 0, cr: 145000 },
          ],
          ts: new Date().toISOString(),
        },
      ],
      invoices: [
        { id: 1, num: "INV-001", cust: "Chow Tai Fook", dt: "2025-03-01", due: "2025-04-01", amt: 145000, pd: 45000, st: "Part-Paid" },
        { id: 2, num: "INV-002", cust: "Luk Fook Jewellery", dt: "2025-04-10", due: "2025-05-10", amt: 88000, pd: 88000, st: "Paid" },
        { id: 3, num: "INV-003", cust: "Local Retail Walkin", dt: "2025-05-20", due: "2025-06-20", amt: 12000, pd: 0, st: "Outstanding" },
      ],
      bills: [
        { id: 1, num: "BILL-001", vend: "De Beers Diamond Corp", dt: "2025-02-15", due: "2025-03-15", amt: 65000, pd: 65000, st: "Paid" },
        { id: 2, num: "BILL-002", vend: "HK Supplies Ltd", dt: "2025-03-25", due: "2025-04-25", amt: 4800, pd: 0, st: "Unpaid" },
      ],
      assets: [
        { id: 1, name: "Office iMacs & Server", cat: "Computers", date: "2025-01-05", cost: 45000, life: 5, pool: 30, res: 2000, status: "Active" },
        { id: 2, name: "Delivery Van", cat: "Motor Vehicles", date: "2025-03-10", cost: 180000, life: 6, pool: 20, res: 15000, status: "Active" },
      ],
      employees: [
        { id: 1, name: "Sathish Kumar", hkid: "A123456(7)", pos: "Accounting Manager", dept: "Finance", start: "2024-06-01", sal: 28000, housing: 4000, mpfEx: "no", st: "Active" },
        { id: 2, name: "Chris Wong", hkid: "K765432(1)", pos: "Sales Coordinator", dept: "Sales", start: "2025-01-01", sal: 16000, housing: 0, mpfEx: "no", st: "Active" },
      ],
      bkBal: 440000,
      log: [
        { ts: new Date().toISOString(), a: "DEMO_LOAD", d: "Loaded Hong Kong Jewellery Demo Data", t: "INFO", u: "Admin" },
      ],
    };
    saveState(demo);
    alert("✅ Demo data loaded! Enjoy testing.");
  };

  // State formulas for calculations
  const rev = totType("Revenue");
  const exp = totType("Expense");
  const net = rev - exp;
  const tax = taxCalc(net);

  // Tab: New Account state
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("Asset");
  const [newAccNr, setNewAccNr] = useState("Dr");

  // Tab: Journal state
  const [jDt, setJDt] = useState(td());
  const [jRef, setJRef] = useState(`JE-${String(D.journals.length + 1).padStart(4, "0")}`);
  const [jDesc, setJDesc] = useState("");
  const [jType, setJType] = useState("Standard");
  const [jCur, setJCur] = useState("HKD");
  const [jRate, setJRate] = useState(1);
  const [jLines, setJLines] = useState<Array<{ a: string; ld: string; dr: number; cr: number }>>([
    { a: "1010", ld: "", dr: 0, cr: 0 },
    { a: "4000", ld: "", dr: 0, cr: 0 },
  ]);

  // Tab: Bank statement balance
  const [bkBalInput, setBkBalInput] = useState(D.bkBal || 0);

  // Tab: Invoice state
  const [invNum, setInvNum] = useState("");
  const [invCust, setInvCust] = useState("");
  const [invDt, setInvDt] = useState(td());
  const [invDue, setInvDue] = useState("");
  const [invAmt, setInvAmt] = useState(0);

  // Tab: Bill state
  const [billNum, setBillNum] = useState("");
  const [billVend, setBillVend] = useState("");
  const [billDt, setBillDt] = useState(td());
  const [billDue, setBillDue] = useState("");
  const [billAmt, setBillAmt] = useState(0);

  // Tab: Asset state
  const [assName, setAssName] = useState("");
  const [assCat, setAssCat] = useState("Computers");
  const [assDt, setAssDt] = useState(td());
  const [assCost, setAssCost] = useState(0);
  const [assLife, setAssLife] = useState(5);
  const [assPool, setAssPool] = useState(30);
  const [assRes, setAssRes] = useState(0);

  // Tab: Employee state
  const [empName, setEmpName] = useState("");
  const [empHkid, setEmpHkid] = useState("");
  const [empPos, setEmpPos] = useState("");
  const [empDept, setEmpDept] = useState("");
  const [empStart, setEmpStart] = useState(td());
  const [empSal, setEmpSal] = useState(0);
  const [empHousing, setEmpHousing] = useState(0);
  const [empMpfEx, setEmpMpfEx] = useState("no");

  // Tab: Stamp Duty state
  const [sdTab, setSdTab] = useState("prop");
  const [sdVal, setSdVal] = useState(0);
  const [sdBuy, setSdBuy] = useState("hk1");
  const [sdShareVal, setSdShareVal] = useState(0);
  const [sdRent, setSdRent] = useState(0);
  const [sdTerm, setSdTerm] = useState(0);
  const [sdDep, setSdDep] = useState(0);

  // Tab: Tax computation inputs
  const [trEnt, setTrEnt] = useState(0);
  const [trOff, setTrOff] = useState(0);
  const [trChar, setTrChar] = useState(0);
  const [trRd, setTrRd] = useState(0);
  const [trLoss, setTrLoss] = useState(0);

  // Ledger filter state
  const [ledgerFilter, setLedgerFilter] = useState("ALL");

  return (
    <div style={{ minHeight: "100%", position: "relative" }}>
      {/* Top Banner indicating compliance framework */}
      <div className={`fw-banner ${cfg.cls}`}>
        <span className="fw-tag" style={{ background: cfg.color }}>{cfg.label}</span>
        All reports prepared under {cfg.label}. {cfg.reports.length} required statements. Statutory audit required (Cap. 622).
        <button className="hk-btn hk-btn-g hk-btn-s ml-auto" onClick={loadDemo}>
          🎯 Load Demo Data
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}

      {/* 📊 DASHBOARD TAB */}
      {currentTab === "dash" && (
        <div>
          <div className="hk-grid hk-g4" style={{ marginBottom: "18px" }}>
            <div className="hk-stat" style={{ "--c": "var(--green)" } as any}>
              <div className="si">💰</div>
              <div className="lb">Revenue</div>
              <div className="vl">{F(rev)}</div>
              <div className="sub">Current FY</div>
            </div>
            <div className="hk-stat" style={{ "--c": "var(--red)" } as any}>
              <div className="si">📉</div>
              <div className="lb">Expenses</div>
              <div className="vl">{F(exp)}</div>
              <div className="sub">Incl. depreciation</div>
            </div>
            <div className="hk-stat" style={{ "--c": "var(--blue)" } as any}>
              <div className="si">📊</div>
              <div className="lb">Net Profit</div>
              <div className="vl" style={{ color: net >= 0 ? "var(--green)" : "var(--red)" }}>{F(net)}</div>
              <div className="sub">Before tax</div>
            </div>
            <div className="hk-stat" style={{ "--c": "var(--gold)" } as any}>
              <div className="si">🧾</div>
              <div className="lb">Tax Provision</div>
              <div className="vl">{F(tax)}</div>
              <div className="sub">Two-tier estimate</div>
            </div>
          </div>

          <div className="hk-grid hk-g2">
            <div className="hk-card">
              <div className="hk-card-h"><h3>📋 Financial KPIs</h3></div>
              <div className="hk-tw">
                <table className="hk-table">
                  <tbody>
                    <tr>
                      <td>Cash position (HSBC/BOCHK)</td>
                      <td className="hk-nm">{F(getBal("1010") + getBal("1020"))}</td>
                    </tr>
                    <tr>
                      <td>Receivables (AR)</td>
                      <td className="hk-nm">{F(getBal("1100"))}</td>
                    </tr>
                    <tr>
                      <td>Payables (AP)</td>
                      <td className="hk-nm">{F(getBal("2000"))}</td>
                    </tr>
                    <tr>
                      <td>Net Assets</td>
                      <td className="hk-nm">{F(totType("Asset") - totType("Liability"))}</td>
                    </tr>
                    <tr>
                      <td>Gross Profit Margin</td>
                      <td className="hk-nm">{rev > 0 ? ((net / rev) * 100).toFixed(1) + "%" : "N/A"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hk-card">
              <div className="hk-card-h"><h3>✅ Compliance Status</h3></div>
              <div className="hk-chk">
                <div className="hk-chk-ico hk-chk-ok">✅</div>
                <div className="hk-chk-text">
                  <strong>Double-Entry Active</strong>
                  <span>{D.journals.length} entries posted successfully</span>
                </div>
              </div>
              <div className="hk-chk">
                <div className="hk-chk-ico hk-chk-ok">✅</div>
                <div className="hk-chk-text">
                  <strong>Audit Trail Enabled</strong>
                  <span>All actions securely logged</span>
                </div>
              </div>
              <div className="hk-chk">
                <div className="hk-chk-ico hk-chk-ok">✅</div>
                <div className="hk-chk-text">
                  <strong>IR56B Ready</strong>
                  <span>{D.employees.length} employee records configured</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hk-grid hk-g2" style={{ marginTop: "18px" }}>
            <div className="hk-card">
              <div className="hk-card-h"><h3>⏳ AR Aging Overview</h3></div>
              <div className="hk-tw">
                <table className="hk-table">
                  <thead>
                    <tr>
                      <th>Current</th>
                      <th>31-60</th>
                      <th>61-90</th>
                      <th>&gt;90</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="hk-nm" style={{ color: "var(--green)" }}>
                        {F(D.invoices.filter((i) => i.st !== "Paid" && dBtw(i.due, td()) <= 30).reduce((sum, i) => sum + (i.amt - i.pd), 0))}
                      </td>
                      <td className="hk-nm" style={{ color: "var(--orange)" }}>
                        {F(D.invoices.filter((i) => i.st !== "Paid" && dBtw(i.due, td()) > 30 && dBtw(i.due, td()) <= 60).reduce((sum, i) => sum + (i.amt - i.pd), 0))}
                      </td>
                      <td className="hk-nm" style={{ color: "var(--red)" }}>
                        {F(D.invoices.filter((i) => i.st !== "Paid" && dBtw(i.due, td()) > 60 && dBtw(i.due, td()) <= 90).reduce((sum, i) => sum + (i.amt - i.pd), 0))}
                      </td>
                      <td className="hk-nm" style={{ color: "darkred", fontWeight: 900 }}>
                        {F(D.invoices.filter((i) => i.st !== "Paid" && dBtw(i.due, td()) > 90).reduce((sum, i) => sum + (i.amt - i.pd), 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="hk-card">
              <div className="hk-card-h"><h3>📋 Required Statements</h3></div>
              {cfg.reports.map((r) => (
                <div key={r} className="hk-chk">
                  <div className="hk-chk-ico hk-chk-ok">✅</div>
                  <div className="hk-chk-text">
                    <strong>{r}</strong>
                    <span>Required under {cfg.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📏 FRAMEWORK SELECTOR TAB */}
      {currentTab === "framework" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📏 HKFRS Framework Selector – Which Standard Applies?</h3></div>
          <div className="hk-alert hk-a-info">
            <strong>Why this matters:</strong> The framework determines what reports you must produce, what disclosures are required, and how complex your accounting needs to be. Choosing the wrong framework can result in non-compliance penalties.
          </div>

          <div className="hk-grid hk-g3" style={{ marginBottom: "20px" }}>
            <div
              className={`hk-wizard-card ${fw === "full" ? "selected" : ""}`}
              onClick={() => {
                const updated = { ...D, settings: { ...D.settings, fw: "full" } };
                addLog("FW_CHANGE", "Changed framework to Full HKFRS", "INFO", updated);
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏢</div>
              <h4>Full HKFRS</h4>
              <p>For public companies & large entities with public accountability</p>
              <ul className="criteria">
                <li>Listed on HKEX</li>
                <li>Revenue &gt; HK$200M</li>
                <li>Total assets &gt; HK$200M</li>
                <li>Employees &gt; 100</li>
                <li>Full disclosure required</li>
              </ul>
              <div className="hk-badge hk-b-blue" style={{ marginTop: "10px" }}>Most Complex</div>
            </div>

            <div
              className={`hk-wizard-card ${fw === "pe" ? "selected" : ""}`}
              onClick={() => {
                const updated = { ...D, settings: { ...D.settings, fw: "pe" } };
                addLog("FW_CHANGE", "Changed framework to HKFRS for PE", "INFO", updated);
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏬</div>
              <h4>HKFRS for Private Entities</h4>
              <p>For SMEs without public accountability</p>
              <ul className="criteria">
                <li>Not listed on any exchange</li>
                <li>No public accountability</li>
                <li>Revenue HK$10M–200M typical</li>
                <li>Fewer disclosures required</li>
              </ul>
              <div className="hk-badge hk-b-green" style={{ marginTop: "10px" }}>Recommended</div>
            </div>

            <div
              className={`hk-wizard-card ${fw === "sme" ? "selected" : ""}`}
              onClick={() => {
                const updated = { ...D, settings: { ...D.settings, fw: "sme" } };
                addLog("FW_CHANGE", "Changed framework to SME-FRS", "INFO", updated);
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🏠</div>
              <h4>SME-FRF & SME-FRS</h4>
              <p>Simplest framework for qualifying small companies</p>
              <ul className="criteria">
                <li>Revenue ≤ HK$10M</li>
                <li>Total assets ≤ HK$10M</li>
                <li>Employees ≤ 50</li>
                <li>Simplified statements allowed</li>
              </ul>
              <div className="hk-badge hk-b-orange" style={{ marginTop: "10px" }}>Simplest</div>
            </div>
          </div>

          <div className="hk-card" style={{ background: "var(--gray)", marginTop: "20px" }}>
            <h4 style={{ color: cfg.color, fontWeight: "bold", marginBottom: "10px" }}>{cfg.label} Active</h4>
            <p style={{ fontSize: ".82rem", marginBottom: "12px" }}>Your company prepares financial statements under the <strong>{cfg.label}</strong> framework.</p>
            <h4 style={{ fontSize: ".82rem", fontWeight: "bold", marginBottom: "8px" }}>Required Reports:</h4>
            <ul style={{ marginLeft: "16px" }}>
              {cfg.reports.map((r) => (
                <li key={r} style={{ fontSize: ".8rem", marginBottom: "3px" }}>✅ {r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 📋 CHART OF ACCOUNTS TAB */}
      {currentTab === "coa" && (
        <div className="hk-card">
          <div className="hk-card-h">
            <h3>📋 Chart of Accounts</h3>
          </div>

          {/* Quick Add Form */}
          <div className="hk-fr hk-fr4" style={{ marginBottom: "20px", background: "var(--gray)", padding: "12px", borderRadius: "8px" }}>
            <div className="hk-fg">
              <label>Code</label>
              <input type="text" value={newAccCode} onChange={(e) => setNewAccCode(e.target.value)} placeholder="e.g. 4050" />
            </div>
            <div className="hk-fg">
              <label>Name</label>
              <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="e.g. Diamond Sales" />
            </div>
            <div className="hk-fg">
              <label>Type</label>
              <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)}>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
            <div className="hk-fg">
              <label>Normal Balance</label>
              <select value={newAccNr} onChange={(e) => setNewAccNr(e.target.value)}>
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </select>
            </div>
            <div className="hk-fg justify-end" style={{ gridColumn: "span 4", textAlign: "right" }}>
              <button
                className="hk-btn hk-btn-n"
                onClick={() => {
                  if (!newAccCode || !newAccName) {
                    alert("Please fill all fields");
                    return;
                  }
                  if (D.accounts.find((a) => a.c === newAccCode)) {
                    alert("Account code already exists");
                    return;
                  }
                  const updatedAccs = [...D.accounts, { c: newAccCode, n: newAccName, t: newAccType, nr: newAccNr }];
                  updatedAccs.sort((a, b) => a.c.localeCompare(b.c));
                  const updatedState = { ...D, accounts: updatedAccs };
                  addLog("ACC_ADD", `Created account ${newAccCode} - ${newAccName}`, "INFO", updatedState);
                  setNewAccCode("");
                  setNewAccName("");
                }}
              >
                + Add Account
              </button>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Normal</th>
                  <th className="hk-nm">Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {D.accounts.map((a) => {
                  const b = getBal(a.c);
                  const badgeClass =
                    a.t === "Asset" ? "hk-b-blue" :
                    a.t === "Liability" ? "hk-b-red" :
                    a.t === "Equity" ? "hk-b-purple" :
                    a.t === "Revenue" ? "hk-b-green" : "hk-b-orange";

                  return (
                    <tr key={a.c}>
                      <td>{a.c}</td>
                      <td>{a.n}</td>
                      <td><span className={`hk-badge ${badgeClass}`}>{a.t}</span></td>
                      <td>{a.nr}</td>
                      <td className="hk-nm" style={{ color: b >= 0 ? "var(--green)" : "var(--red)" }}>{N(b)}</td>
                      <td>
                        <button
                          className="hk-btn hk-btn-r hk-btn-s"
                          onClick={() => {
                            if (confirm(`Delete account ${a.n}?`)) {
                              const filtered = D.accounts.filter((x) => x.c !== a.c);
                              const updatedState = { ...D, accounts: filtered };
                              addLog("ACC_DEL", `Deleted account ${a.c}`, "INFO", updatedState);
                            }
                          }}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📝 JOURNAL ENTRIES TAB */}
      {currentTab === "journal" && (
        <div>
          <div className="hk-card">
            <div className="hk-card-h"><h3>📝 New Journal Entry</h3></div>
            <div className="hk-fr hk-fr4">
              <div className="hk-fg"><label>Date</label><input type="date" value={jDt} onChange={(e) => setJDt(e.target.value)} /></div>
              <div className="hk-fg"><label>Reference</label><input type="text" value={jRef} onChange={(e) => setJRef(e.target.value)} /></div>
              <div className="hk-fg">
                <label>Currency</label>
                <select value={jCur} onChange={(e) => setJCur(e.target.value)}>
                  <option value="HKD">HKD</option>
                  <option value="USD">USD</option>
                  <option value="CNY">CNY</option>
                </select>
              </div>
              <div className="hk-fg"><label>FX Rate</label><input type="number" value={jRate} onChange={(e) => setJRate(parseFloat(e.target.value) || 1)} step=".0001" /></div>
            </div>
            <div className="hk-fr hk-fr2">
              <div className="hk-fg"><label>Description</label><input type="text" value={jDesc} onChange={(e) => setJDesc(e.target.value)} placeholder="e.g. Diamond wholesale purchase" /></div>
              <div className="hk-fg">
                <label>Type</label>
                <select value={jType} onChange={(e) => setJType(e.target.value)}>
                  <option value="Standard">Standard</option>
                  <option value="Adjusting">Adjusting</option>
                  <option value="Opening Balance">Opening Balance</option>
                </select>
              </div>
            </div>

            <div className="hk-tw" style={{ marginBottom: "15px" }}>
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Line Description</th>
                    <th>Debit (HKD)</th>
                    <th>Credit (HKD)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jLines.map((line, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          value={line.a}
                          onChange={(e) => {
                            const newLines = [...jLines];
                            newLines[idx].a = e.target.value;
                            setJLines(newLines);
                          }}
                          style={{ padding: "6px" }}
                        >
                          {D.accounts.map((ac) => (
                            <option key={ac.c} value={ac.c}>{ac.c} – {ac.n}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={line.ld}
                          onChange={(e) => {
                            const newLines = [...jLines];
                            newLines[idx].ld = e.target.value;
                            setJLines(newLines);
                          }}
                          placeholder="Line details"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={line.dr || ""}
                          onChange={(e) => {
                            const newLines = [...jLines];
                            newLines[idx].dr = parseFloat(e.target.value) || 0;
                            setJLines(newLines);
                          }}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={line.cr || ""}
                          onChange={(e) => {
                            const newLines = [...jLines];
                            newLines[idx].cr = parseFloat(e.target.value) || 0;
                            setJLines(newLines);
                          }}
                          placeholder="0.00"
                        />
                      </td>
                      <td>
                        <button
                          className="hk-btn hk-btn-r hk-btn-s"
                          onClick={() => {
                            const newLines = jLines.filter((_, i) => i !== idx);
                            setJLines(newLines);
                          }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}><strong>TOTALS (HKD)</strong></td>
                    <td className="hk-nm">{N(jLines.reduce((sum, l) => sum + l.dr, 0))}</td>
                    <td className="hk-nm">{N(jLines.reduce((sum, l) => sum + l.cr, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="hk-btn hk-btn-o hk-btn-s"
                onClick={() => setJLines([...jLines, { a: "1010", ld: "", dr: 0, cr: 0 }])}
              >
                + Add Line
              </button>
              <button
                className="hk-btn hk-btn-n"
                onClick={() => {
                  const drTotal = jLines.reduce((sum, l) => sum + l.dr, 0);
                  const crTotal = jLines.reduce((sum, l) => sum + l.cr, 0);
                  if (Math.abs(drTotal - crTotal) > 0.01) {
                    alert(`Journal not balanced. Debit total: ${drTotal}, Credit total: ${crTotal}`);
                    return;
                  }
                  if (drTotal === 0) {
                    alert("Cannot post empty journal");
                    return;
                  }

                  const newEntry: JournalEntry = {
                    id: Date.now(),
                    dt: jDt,
                    ref: jRef,
                    desc: jDesc,
                    type: jType,
                    cur: jCur,
                    rate: jRate,
                    lines: jLines.map((l) => ({ ...l, dr: l.dr * jRate, cr: l.cr * jRate })),
                    ts: new Date().toISOString(),
                  };

                  const updatedJournals = [newEntry, ...D.journals];
                  const updatedState = { ...D, journals: updatedJournals };
                  addLog("JE_POST", `Posted journal ${jRef}: ${jDesc}`, "INFO", updatedState);
                  alert("✅ Journal posted successfully!");

                  // Reset
                  setJDesc("");
                  setJRef(`JE-${String(updatedJournals.length + 1).padStart(4, "0")}`);
                  setJLines([
                    { a: "1010", ld: "", dr: 0, cr: 0 },
                    { a: "4000", ld: "", dr: 0, cr: 0 },
                  ]);
                }}
              >
                📬 Post Journal Entry
              </button>
            </div>
          </div>

          <div className="hk-card">
            <div className="hk-card-h"><h3>📄 Posted Journal Entries</h3></div>
            <div className="hk-tw">
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ref</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Debit Lines</th>
                    <th>Credit Lines</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {D.journals.map((j) => (
                    <tr key={j.id}>
                      <td>{j.dt}</td>
                      <td><strong>{j.ref}</strong></td>
                      <td><span className="hk-badge hk-b-gray">{j.type}</span></td>
                      <td>{j.desc}</td>
                      <td>
                        {j.lines.filter((l) => l.dr > 0).map((l, i) => (
                          <div key={i} style={{ fontSize: "0.75rem" }}>
                            {l.a} ({N(l.dr)})
                          </div>
                        ))}
                      </td>
                      <td>
                        {j.lines.filter((l) => l.cr > 0).map((l, i) => (
                          <div key={i} style={{ fontSize: "0.75rem" }}>
                            {l.a} ({N(l.cr)})
                          </div>
                        ))}
                      </td>
                      <td>
                        <button
                          className="hk-btn hk-btn-r hk-btn-s"
                          onClick={() => {
                            if (confirm("Delete this posted entry?")) {
                              const filtered = D.journals.filter((x) => x.id !== j.id);
                              const updatedState = { ...D, journals: filtered };
                              addLog("JE_DEL", `Deleted journal ${j.ref}`, "INFO", updatedState);
                            }
                          }}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📒 GENERAL LEDGER TAB */}
      {currentTab === "ledger" && (
        <div className="hk-card">
          <div className="hk-card-h">
            <h3>📒 General Ledger</h3>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                value={ledgerFilter}
                onChange={(e) => setLedgerFilter(e.target.value)}
                style={{ padding: "5px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: ".75rem" }}
              >
                <option value="ALL">All Accounts</option>
                {D.accounts.map((ac) => (
                  <option key={ac.c} value={ac.c}>{ac.c} – {ac.n}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ref</th>
                  <th>Description</th>
                  <th className="hk-nm">Debit</th>
                  <th className="hk-nm">Credit</th>
                  <th className="hk-nm">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {D.accounts
                  .filter((a) => ledgerFilter === "ALL" || a.c === ledgerFilter)
                  .map((acc) => {
                    const txs: Array<{ dt: string; ref: string; desc: string; dr: number; cr: number }> = [];
                    D.journals.forEach((j) => {
                      j.lines.forEach((l) => {
                        if (l.a === acc.c) {
                          txs.push({
                            dt: j.dt,
                            ref: j.ref,
                            desc: j.desc,
                            dr: l.dr,
                            cr: l.cr,
                          });
                        }
                      });
                    });

                    if (txs.length === 0 && ledgerFilter === "ALL") return null;

                    txs.sort((a, b) => a.dt.localeCompare(b.dt));
                    let runningBal = 0;

                    return (
                      <Fragment key={acc.c}>
                        <tr style={{ background: "var(--navy)", color: "#fff", fontWeight: "bold" }}>
                          <td colSpan={6}>{acc.c} – {acc.n} ({acc.nr})</td>
                        </tr>
                        {txs.map((t, idx) => {
                          runningBal += acc.nr === "Dr" ? t.dr - t.cr : t.cr - t.dr;
                          return (
                            <tr key={idx}>
                              <td>{t.dt}</td>
                              <td>{t.ref}</td>
                              <td>{t.desc}</td>
                              <td className="hk-nm">{t.dr > 0 ? N(t.dr) : ""}</td>
                              <td className="hk-nm">{t.cr > 0 ? N(t.cr) : ""}</td>
                              <td className="hk-nm" style={{ fontWeight: 700, color: runningBal >= 0 ? "var(--green)" : "var(--red)" }}>
                                {N(runningBal)}
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🏦 BANK RECONCILIATION TAB */}
      {currentTab === "bank" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🏦 Bank Reconciliation</h3></div>
          <div className="hk-fr hk-fr3" style={{ marginBottom: "16px" }}>
            <div className="hk-fg">
              <label>Bank Statement Balance</label>
              <input
                type="number"
                value={bkBalInput}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setBkBalInput(val);
                  saveState({ ...D, bkBal: val });
                }}
              />
            </div>
            <div className="hk-fg">
              <label>Book Balance (Auto HSBC + BOCHK)</label>
              <input
                type="text"
                value={N(getBal("1010") + getBal("1020"))}
                disabled
                style={{ background: "var(--gray)", fontWeight: "bold" }}
              />
            </div>
            <div className="hk-fg">
              <label>Difference</label>
              <input
                type="text"
                value={N(bkBalInput - (getBal("1010") + getBal("1020")))}
                disabled
                style={{
                  fontWeight: "bold",
                  color: Math.abs(bkBalInput - (getBal("1010") + getBal("1020"))) < 0.01 ? "var(--green)" : "var(--red)",
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "10px" }}>
            {Math.abs(bkBalInput - (getBal("1010") + getBal("1020"))) < 0.01 ? (
              <div className="hk-alert hk-a-ok">
                ✅ Bank Statement matches Books perfectly. Reconciled successfully!
              </div>
            ) : (
              <div className="hk-alert hk-a-warn">
                ⚠️ Unreconciled difference of {F(bkBalInput - (getBal("1010") + getBal("1020")))}. Verify outstanding cheques or bank fee postings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 💰 ACCOUNTS RECEIVABLE (AR) TAB */}
      {currentTab === "ar" && (
        <div className="hk-card">
          <div className="hk-card-h">
            <h3>💰 Accounts Receivable</h3>
          </div>

          {/* Quick Invoice Creator */}
          <div className="hk-fr hk-fr4" style={{ marginBottom: "20px", background: "var(--gray)", padding: "12px", borderRadius: "8px" }}>
            <div className="hk-fg"><label>Invoice No</label><input type="text" value={invNum} onChange={(e) => setInvNum(e.target.value)} placeholder="INV-004" /></div>
            <div className="hk-fg"><label>Customer</label><input type="text" value={invCust} onChange={(e) => setInvCust(e.target.value)} placeholder="e.g. Chow Sang Sang" /></div>
            <div className="hk-fg"><label>Date</label><input type="date" value={invDt} onChange={(e) => setInvDt(e.target.value)} /></div>
            <div className="hk-fg"><label>Due Date</label><input type="date" value={invDue} onChange={(e) => setInvDue(e.target.value)} /></div>
            <div className="hk-fg"><label>Amount (HKD)</label><input type="number" value={invAmt || ""} onChange={(e) => setInvAmt(parseFloat(e.target.value) || 0)} placeholder="0.00" /></div>
            <div className="hk-fg justify-end" style={{ gridColumn: "span 4", textAlign: "right" }}>
              <button
                className="hk-btn hk-btn-n"
                onClick={() => {
                  if (!invNum || !invCust || !invAmt) {
                    alert("Please fill all fields");
                    return;
                  }
                  const newInv: Invoice = {
                    id: Date.now(),
                    num: invNum,
                    cust: invCust,
                    dt: invDt,
                    due: invDue || invDt,
                    amt: invAmt,
                    pd: 0,
                    st: "Outstanding",
                  };
                  saveState({ ...D, invoices: [newInv, ...D.invoices] });
                  addLog("INV_ADD", `Created Invoice ${invNum} to ${invCust}`);
                  setInvNum("");
                  setInvCust("");
                  setInvAmt(0);
                }}
              >
                + Add Invoice
              </button>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Inv#</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th className="hk-nm">Amount</th>
                  <th className="hk-nm">Paid</th>
                  <th className="hk-nm">Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {D.invoices.map((inv) => {
                  const bal = inv.amt - inv.pd;
                  const badgeClass = inv.st === "Paid" ? "hk-b-green" : "hk-b-yellow";
                  return (
                    <tr key={inv.id}>
                      <td>{inv.num}</td>
                      <td>{inv.cust}</td>
                      <td>{inv.dt}</td>
                      <td>{inv.due}</td>
                      <td className="hk-nm">{N(inv.amt)}</td>
                      <td className="hk-nm">{N(inv.pd)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(bal)}</td>
                      <td><span className={`hk-badge ${badgeClass}`}>{inv.st}</span></td>
                      <td style={{ display: "flex", gap: "4px" }}>
                        {inv.st !== "Paid" && (
                          <>
                            <button
                              className="hk-btn hk-btn-gr hk-btn-s"
                              onClick={() => payInv(inv.id, false)}
                            >
                              Full
                            </button>
                            <button
                              className="hk-btn hk-btn-b hk-btn-s"
                              onClick={() => payInv(inv.id, true)}
                            >
                              Part
                            </button>
                          </>
                        )}
                        <button
                          className="hk-btn hk-btn-r hk-btn-s"
                          onClick={() => delInv(inv.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⏳ AR AGING REPORT TAB */}
      {currentTab === "ar-aging" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>⏳ Accounts Receivable (AR) Aging Report</h3></div>
          <div className="hk-alert hk-a-warn">
            <strong>Per HKFRS 9:</strong> The Expected Credit Loss (ECL) model requires regular aging analysis of trade receivables to estimate bad debt provisions.
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Inv#</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th className="hk-nm">Total Outstanding</th>
                  <th className="hk-nm">Current (&lt;30d)</th>
                  <th className="hk-nm">31-60 Days</th>
                  <th className="hk-nm">61-90 Days</th>
                  <th className="hk-nm">&gt;90 Days</th>
                </tr>
              </thead>
              <tbody>
                {D.invoices
                  .filter((i) => i.st !== "Paid")
                  .map((inv) => {
                    const balance = inv.amt - inv.pd;
                    const diffDays = dBtw(inv.due, td());
                    return (
                      <tr key={inv.id}>
                        <td>{inv.cust}</td>
                        <td>{inv.num}</td>
                        <td>{inv.dt}</td>
                        <td>{inv.due}</td>
                        <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(balance)}</td>
                        <td className="hk-nm">{diffDays <= 30 ? N(balance) : ""}</td>
                        <td className="hk-nm">{diffDays > 30 && diffDays <= 60 ? N(balance) : ""}</td>
                        <td className="hk-nm">{diffDays > 60 && diffDays <= 90 ? N(balance) : ""}</td>
                        <td className="hk-nm" style={{ color: "var(--red)", fontWeight: "bold" }}>{diffDays > 90 ? N(balance) : ""}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💳 ACCOUNTS PAYABLE (AP) TAB */}
      {currentTab === "ap" && (
        <div className="hk-card">
          <div className="hk-card-h">
            <h3>💳 Accounts Payable</h3>
          </div>

          {/* Quick Bill Creator */}
          <div className="hk-fr hk-fr4" style={{ marginBottom: "20px", background: "var(--gray)", padding: "12px", borderRadius: "8px" }}>
            <div className="hk-fg"><label>Bill Ref No</label><input type="text" value={billNum} onChange={(e) => setBillNum(e.target.value)} placeholder="BILL-003" /></div>
            <div className="hk-fg"><label>Vendor</label><input type="text" value={billVend} onChange={(e) => setBillVend(e.target.value)} placeholder="De Beers Group" /></div>
            <div className="hk-fg"><label>Date</label><input type="date" value={billDt} onChange={(e) => setBillDt(e.target.value)} /></div>
            <div className="hk-fg"><label>Due Date</label><input type="date" value={billDue} onChange={(e) => setBillDue(e.target.value)} /></div>
            <div className="hk-fg"><label>Amount (HKD)</label><input type="number" value={billAmt || ""} onChange={(e) => setBillAmt(parseFloat(e.target.value) || 0)} placeholder="0.00" /></div>
            <div className="hk-fg justify-end" style={{ gridColumn: "span 4", textAlign: "right" }}>
              <button
                className="hk-btn hk-btn-n"
                onClick={() => {
                  if (!billNum || !billVend || !billAmt) {
                    alert("Please fill all fields");
                    return;
                  }
                  const newBill: Bill = {
                    id: Date.now(),
                    num: billNum,
                    vend: billVend,
                    dt: billDt,
                    due: billDue || billDt,
                    amt: billAmt,
                    pd: 0,
                    st: "Unpaid",
                  };
                  saveState({ ...D, bills: [newBill, ...D.bills] });
                  addLog("BILL_ADD", `Registered Bill ${billNum} from ${billVend}`);
                  setBillNum("");
                  setBillVend("");
                  setBillAmt(0);
                }}
              >
                + Add Bill
              </button>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Bill#</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th className="hk-nm">Amount</th>
                  <th className="hk-nm">Paid</th>
                  <th className="hk-nm">Balance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {D.bills.map((b) => {
                  const bal = b.amt - b.pd;
                  const badgeClass = b.st === "Paid" ? "hk-b-green" : "hk-b-yellow";
                  return (
                    <tr key={b.id}>
                      <td>{b.num}</td>
                      <td>{b.vend}</td>
                      <td>{b.dt}</td>
                      <td>{b.due}</td>
                      <td className="hk-nm">{N(b.amt)}</td>
                      <td className="hk-nm">{N(b.pd)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(bal)}</td>
                      <td><span className={`hk-badge ${badgeClass}`}>{b.st}</span></td>
                      <td style={{ display: "flex", gap: "4px" }}>
                        {b.st !== "Paid" && (
                          <>
                            <button
                              className="hk-btn hk-btn-gr hk-btn-s"
                              onClick={() => payBill(b.id, false)}
                            >
                              Pay
                            </button>
                            <button
                              className="hk-btn hk-btn-b hk-btn-s"
                              onClick={() => payBill(b.id, true)}
                            >
                              Part
                            </button>
                          </>
                        )}
                        <button
                          className="hk-btn hk-btn-r hk-btn-s"
                          onClick={() => delBill(b.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🕐 AP AGING REPORT TAB */}
      {currentTab === "ap-aging" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🕐 Accounts Payable (AP) Aging Report</h3></div>
          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Bill#</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th className="hk-nm">Total Outstanding</th>
                  <th className="hk-nm">Current (&lt;30d)</th>
                  <th className="hk-nm">31-60 Days</th>
                  <th className="hk-nm">61-90 Days</th>
                  <th className="hk-nm">&gt;90 Days</th>
                </tr>
              </thead>
              <tbody>
                {D.bills
                  .filter((b) => b.st !== "Paid")
                  .map((b) => {
                    const balance = b.amt - b.pd;
                    const diffDays = dBtw(b.due, td());
                    return (
                      <tr key={b.id}>
                        <td>{b.vend}</td>
                        <td>{b.num}</td>
                        <td>{b.dt}</td>
                        <td>{b.due}</td>
                        <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(balance)}</td>
                        <td className="hk-nm">{diffDays <= 30 ? N(balance) : ""}</td>
                        <td className="hk-nm">{diffDays > 30 && diffDays <= 60 ? N(balance) : ""}</td>
                        <td className="hk-nm">{diffDays > 60 && diffDays <= 90 ? N(balance) : ""}</td>
                        <td className="hk-nm" style={{ color: "var(--red)" }}>{diffDays > 90 ? N(balance) : ""}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🏗 ASSET REGISTER TAB */}
      {currentTab === "assets" && (
        <div className="hk-card">
          <div className="hk-card-h">
            <h3>🏗 Fixed Asset Register & IRD Depreciation Pools</h3>
          </div>
          <div className="hk-alert hk-a-info">
            <strong>IRD Depreciation Rules:</strong> Asset purchases qualify for initial allowance (60%) followed by pool annual allowance (30% for Computer equipment, 20% for Motor vehicles, 10% for office furniture).
          </div>

          {/* Quick Asset Creator */}
          <div className="hk-fr hk-fr4" style={{ marginBottom: "20px", background: "var(--gray)", padding: "12px", borderRadius: "8px" }}>
            <div className="hk-fg"><label>Asset Name</label><input type="text" value={assName} onChange={(e) => setAssName(e.target.value)} placeholder="MacBook Pro" /></div>
            <div className="hk-fg">
              <label>Depreciation Pool</label>
              <select value={assPool} onChange={(e) => setAssPool(parseInt(e.target.value) || 30)}>
                <option value={30}>Pool A (30% Computers/IT)</option>
                <option value={20}>Pool B (20% Vehicles/Furniture)</option>
                <option value={10}>Pool C (10% Machinery/Buildings)</option>
              </select>
            </div>
            <div className="hk-fg"><label>Purchase Date</label><input type="date" value={assDt} onChange={(e) => setAssDt(e.target.value)} /></div>
            <div className="hk-fg"><label>Cost (HKD)</label><input type="number" value={assCost || ""} onChange={(e) => setAssCost(parseFloat(e.target.value) || 0)} placeholder="0.00" /></div>
            <div className="hk-fg"><label>Est Life (Yrs)</label><input type="number" value={assLife} onChange={(e) => setAssLife(parseInt(e.target.value) || 5)} /></div>
            <div className="hk-fg"><label>Residual Value</label><input type="number" value={assRes || ""} onChange={(e) => setAssRes(parseFloat(e.target.value) || 0)} placeholder="0" /></div>
            <div className="hk-fg justify-end" style={{ gridColumn: "span 4", textAlign: "right" }}>
              <button
                className="hk-btn hk-btn-n"
                onClick={() => {
                  if (!assName || !assCost) {
                    alert("Please fill all fields");
                    return;
                  }
                  const newAsset: Asset = {
                    id: Date.now(),
                    name: assName,
                    cat: assPool === 30 ? "Computers" : assPool === 20 ? "Vehicles" : "Machinery",
                    date: assDt,
                    cost: assCost,
                    life: assLife,
                    pool: assPool,
                    res: assRes,
                    status: "Active",
                  };
                  saveState({ ...D, assets: [newAsset, ...D.assets] });
                  addLog("ASSET_ADD", `Registered Fixed Asset: ${assName} (Cost: HK$${assCost})`);
                  setAssName("");
                  setAssCost(0);
                  setAssRes(0);
                }}
              >
                + Add Asset
              </button>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Category</th>
                  <th>Purchase Date</th>
                  <th className="hk-nm">Cost</th>
                  <th>IRD Pool</th>
                  <th className="hk-nm">Tax Initial (60%)</th>
                  <th className="hk-nm">Tax WDV (Remaining)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {D.assets.map((a) => {
                  const tx = assetTax(a);
                  return (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.cat}</td>
                      <td>{a.date}</td>
                      <td className="hk-nm">{N(a.cost)}</td>
                      <td><span className="hk-badge hk-b-purple">Pool {a.pool}%</span></td>
                      <td className="hk-nm">{N(tx.init)}</td>
                      <td className="hk-nm">{N(tx.wdv)}</td>
                      <td><span className="hk-badge hk-b-green">{a.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📉 DEPRECIATION SCHEDULE TAB */}
      {currentTab === "depr" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📉 Depreciation Schedule: Book vs Tax Allowances</h3></div>
          <div className="hk-grid hk-g2" style={{ marginBottom: "14px" }}>
            <div className="hk-stat" style={{ "--c": "var(--blue)" } as any}>
              <div className="lb">Book Depreciation/Yr</div>
              <div className="vl">{F(D.assets.reduce((sum, a) => sum + assetBook(a).an, 0))}</div>
            </div>
            <div className="hk-stat" style={{ "--c": "var(--purple)" } as any}>
              <div className="lb">IRD Tax Allowances/Yr (Total)</div>
              <div className="vl">{F(D.assets.reduce((sum, a) => sum + assetTax(a).ann + assetTax(a).init, 0))}</div>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th className="hk-nm">Cost</th>
                  <th>Est Life</th>
                  <th className="hk-nm">Book Depr/Yr</th>
                  <th className="hk-nm">Accum. Book Depr</th>
                  <th className="hk-nm">Book WDV</th>
                  <th className="hk-nm">Tax Init (60%)</th>
                  <th className="hk-nm">Tax Ann (Pool)</th>
                  <th className="hk-nm">Tax WDV</th>
                </tr>
              </thead>
              <tbody>
                {D.assets.map((a) => {
                  const bk = assetBook(a);
                  const tx = assetTax(a);
                  return (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td className="hk-nm">{N(a.cost)}</td>
                      <td>{a.life} Yrs</td>
                      <td className="hk-nm">{N(bk.an)}</td>
                      <td className="hk-nm">{N(bk.ac)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(bk.wdv)}</td>
                      <td className="hk-nm">{N(tx.init)}</td>
                      <td className="hk-nm">{N(tx.ann)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(tx.wdv)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 👥 EMPLOYEE RECORDS TAB */}
      {currentTab === "emp" && (
        <div className="hk-card">
          <div className="hk-card-h">
            <h3>👥 Employee Records</h3>
          </div>

          {/* Quick Employee Creator */}
          <div className="hk-fr hk-fr4" style={{ marginBottom: "20px", background: "var(--gray)", padding: "12px", borderRadius: "8px" }}>
            <div className="hk-fg"><label>Name</label><input type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="Raymond Ho" /></div>
            <div className="hk-fg"><label>HKID</label><input type="text" value={empHkid} onChange={(e) => setEmpHkid(e.target.value)} placeholder="Z123456(A)" /></div>
            <div className="hk-fg"><label>Position</label><input type="text" value={empPos} onChange={(e) => setEmpPos(e.target.value)} placeholder="Sales Rep" /></div>
            <div className="hk-fg"><label>Department</label><input type="text" value={empDept} onChange={(e) => setEmpDept(e.target.value)} placeholder="Sales" /></div>
            <div className="hk-fg"><label>Monthly Salary</label><input type="number" value={empSal || ""} onChange={(e) => setEmpSal(parseFloat(e.target.value) || 0)} placeholder="0.00" /></div>
            <div className="hk-fg"><label>Housing Allowance</label><input type="number" value={empHousing || ""} onChange={(e) => setEmpHousing(parseFloat(e.target.value) || 0)} placeholder="0" /></div>
            <div className="hk-fg">
              <label>MPF Status</label>
              <select value={empMpfEx} onChange={(e) => setEmpMpfEx(e.target.value)}>
                <option value="no">Required (EE/ER 5%)</option>
                <option value="yes">Exempt (Directors/Foreigners)</option>
              </select>
            </div>
            <div className="hk-fg justify-end" style={{ gridColumn: "span 4", textAlign: "right" }}>
              <button
                className="hk-btn hk-btn-n"
                onClick={() => {
                  if (!empName || !empHkid || !empSal) {
                    alert("Please fill all fields");
                    return;
                  }
                  const newEmp: Employee = {
                    id: Date.now(),
                    name: empName,
                    hkid: empHkid,
                    pos: empPos,
                    dept: empDept,
                    start: empStart,
                    sal: empSal,
                    housing: empHousing,
                    mpfEx: empMpfEx,
                    st: "Active",
                  };
                  const updatedState = { ...D, employees: [newEmp, ...D.employees] };
                  addLog("EMP_ADD", `Added employee: ${empName}`, "INFO", updatedState);
                  setEmpName("");
                  setEmpHkid("");
                  setEmpSal(0);
                  setEmpHousing(0);
                }}
              >
                + Add Employee
              </button>
            </div>
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>HKID</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th className="hk-nm">Basic Salary</th>
                  <th>MPF Contributions</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {D.employees.map((e) => (
                  <tr key={e.id}>
                    <td>{e.name}</td>
                    <td>{e.hkid}</td>
                    <td>{e.pos}</td>
                    <td>{e.dept}</td>
                    <td className="hk-nm">{N(e.sal)}</td>
                    <td><span className={`hk-badge ${e.mpfEx === "no" ? "hk-b-green" : "hk-b-gray"}`}>{e.mpfEx === "no" ? "Mandatory" : "Exempt"}</span></td>
                    <td><span className="hk-badge hk-b-green">{e.st}</span></td>
                    <td>
                      <button
                        className="hk-btn hk-btn-r hk-btn-s"
                        onClick={() => {
                          if (confirm(`Remove employee ${e.name}?`)) {
                              const filtered = D.employees.filter((x) => x.id !== e.id);
                              const updatedState = { ...D, employees: filtered };
                              addLog("EMP_DEL", `Removed employee: ${e.name}`, "INFO", updatedState);
                          }
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 💵 PAYROLL PROCESSING TAB */}
      {currentTab === "payroll" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>💵 Payroll & Mandatory Provident Fund (MPF) Processing</h3></div>
          <div className="hk-alert hk-a-info">
            <strong>MPF Caps:</strong> EE & ER Mandatory contributions are capped at HK$1,500 each per month (calculated on a maximum monthly salary of HK$30,000). Employees earning less than HK$7,100 are exempt from EE contributions.
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="hk-nm">Basic Salary</th>
                  <th className="hk-nm">Housing Allowance</th>
                  <th className="hk-nm">Gross Pay</th>
                  <th className="hk-nm">EE MPF (5%)</th>
                  <th className="hk-nm">Net Pay</th>
                  <th className="hk-nm">ER MPF (5%)</th>
                  <th className="hk-nm">Total Employer Cost</th>
                </tr>
              </thead>
              <tbody>
                {D.employees.map((e) => {
                  const mpf = mpfCalc(e.sal, e.mpfEx === "yes");
                  const gross = e.sal + (e.housing || 0);
                  const netPay = gross - mpf.ee;
                  const totalCost = gross + mpf.er;
                  return (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td className="hk-nm">{N(e.sal)}</td>
                      <td className="hk-nm">{N(e.housing)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(gross)}</td>
                      <td className="hk-nm" style={{ color: "var(--red)" }}>{N(mpf.ee)}</td>
                      <td className="hk-nm" style={{ color: "var(--green)", fontWeight: "bold" }}>{N(netPay)}</td>
                      <td className="hk-nm" style={{ color: "var(--orange)" }}>{N(mpf.er)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(totalCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔐 MPF CALCULATOR TAB */}
      {currentTab === "mpf" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🔐 Interactive MPF Calculator</h3></div>
          <div className="hk-grid hk-g2">
            <div>
              <div className="hk-fr hk-fr2">
                <div className="hk-fg">
                  <label>Monthly Salary (HK$)</label>
                  <input
                    type="number"
                    value={sdVal || ""}
                    onChange={(e) => setSdVal(parseFloat(e.target.value) || 0)}
                    placeholder="25000"
                  />
                </div>
                <div className="hk-fg">
                  <label>Employee Category</label>
                  <select value={sdBuy} onChange={(e) => setSdBuy(e.target.value)}>
                    <option value="hk1">Standard Employee</option>
                    <option value="hk2">Exempt Employee</option>
                  </select>
                </div>
              </div>

              {/* Display Result */}
              {(() => {
                const mpf = mpfCalc(sdVal, sdBuy === "hk2");
                return (
                  <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px", marginTop: "14px" }}>
                    <table className="hk-table">
                      <tbody>
                        <tr>
                          <td>Monthly Gross Salary</td>
                          <td className="hk-nm">{F(sdVal)}</td>
                        </tr>
                        <tr>
                          <td style={{ color: "var(--red)" }}>Employee MPF Contribution (5%)</td>
                          <td className="hk-nm" style={{ color: "var(--red)" }}>{F(mpf.ee)}</td>
                        </tr>
                        <tr>
                          <td style={{ color: "var(--orange)" }}>Employer MPF Contribution (5%)</td>
                          <td className="hk-nm" style={{ color: "var(--orange)" }}>{F(mpf.er)}</td>
                        </tr>
                        <tr style={{ borderTop: "2px solid var(--border)", fontWeight: "bold" }}>
                          <td>Net Take-home Pay</td>
                          <td className="hk-nm" style={{ color: "var(--green)" }}>{F(sdVal - mpf.ee)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px" }}>
              <h4 style={{ color: "var(--navy)", fontWeight: "bold", marginBottom: "8px" }}>HK MPF Contribution Scale</h4>
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Monthly Income</th>
                    <th>EE Share</th>
                    <th>ER Share</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>&lt; HK$7,100</td>
                    <td>Exempt (0%)</td>
                    <td>5%</td>
                  </tr>
                  <tr>
                    <td>HK$7,100 – HK$30,000</td>
                    <td>5%</td>
                    <td>5%</td>
                  </tr>
                  <tr>
                    <td>&gt; HK$30,000</td>
                    <td>Capped (HK$1,500)</td>
                    <td>Capped (HK$1,500)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📄 IR56B GENERATOR TAB */}
      {currentTab === "ir56b" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📄 IR56B – Employer's Return of Remuneration</h3></div>
          <div className="hk-alert hk-a-warn">
            <strong>Filing Deadline:</strong> Form IR56B must be submitted within 1 month from the date of issue (normally 1st April annually). Late filing is an offense liable to a penalty of HK$10,000 per employee.
          </div>

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>HKID</th>
                  <th>Reporting Period</th>
                  <th className="hk-nm">Annual Basic Salary</th>
                  <th className="hk-nm">Housing Benefits</th>
                  <th className="hk-nm">Employee MPF Paid</th>
                  <th className="hk-nm">Taxable Income</th>
                </tr>
              </thead>
              <tbody>
                {D.employees.map((e) => {
                  const annualSal = e.sal * 12;
                  const annualHousing = (e.housing || 0) * 12;
                  const mpf = mpfCalc(e.sal, e.mpfEx === "yes");
                  const annualMpf = mpf.ee * 12;
                  const taxable = annualSal + annualHousing; // Note: MPF EE contribution is not deducted for employer gross IR56B reporting, but deductible on individual tax returns.
                  return (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td>{e.hkid}</td>
                      <td>01/04/2024 to 31/03/2025</td>
                      <td className="hk-nm">{N(annualSal)}</td>
                      <td className="hk-nm">{N(annualHousing)}</td>
                      <td className="hk-nm">{N(annualMpf)}</td>
                      <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(taxable)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🧾 TAX COMPUTATION TAB */}
      {currentTab === "tax-recon" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🧾 Tax Computation Worksheets (BIR51 Reconciliation)</h3></div>
          <div className="hk-alert hk-a-info">
            This module reconciles your Net Profit per accounting books (HKFRS) to your **Assessable Profit** under the Inland Revenue Ordinance (IRO) by adjusting for non-allowable expenses and tax-exempt revenues.
          </div>

          <div className="hk-grid hk-g2">
            <div>
              <h4 style={{ fontWeight: "bold", marginBottom: "10px", color: "var(--navy)" }}>Tax Computation Adjustments</h4>
              <div className="hk-fg"><label>Non-deductible Entertainment (HK$)</label><input type="number" value={trEnt} onChange={(e) => setTrEnt(parseFloat(e.target.value) || 0)} /></div>
              <div className="hk-fg" style={{ marginTop: "10px" }}><label>Offshore Profits Claim (Exempt) (HK$)</label><input type="number" value={trOff} onChange={(e) => setTrOff(parseFloat(e.target.value) || 0)} /></div>
              <div className="hk-fg" style={{ marginTop: "10px" }}><label>Enhanced R&D Expenses Deduction (HK$)</label><input type="number" value={trRd} onChange={(e) => setTrRd(parseFloat(e.target.value) || 0)} /></div>
              <div className="hk-fg" style={{ marginTop: "10px" }}><label>Unabsorbed Tax Loss Carry-Forward (HK$)</label><input type="number" value={trLoss} onChange={(e) => setTrLoss(parseFloat(e.target.value) || 0)} /></div>
            </div>

            {/* Display Reconciled Assessable Profit */}
            {(() => {
              const bookDepr = D.assets.reduce((sum, a) => sum + assetBook(a).an, 0);
              const taxAllow = D.assets.reduce((sum, a) => sum + assetTax(a).ann + assetTax(a).init, 0);
              const assessableProfit = Math.max(0, net + bookDepr + trEnt - taxAllow - trOff - (trRd * 2) - trLoss); // Enhanced R&D gives additional 200% deduction
              const t1Tax = Math.min(assessableProfit, 2e6) * 0.0825;
              const t2Tax = Math.max(0, assessableProfit - 2e6) * 0.165;
              const finalTax = t1Tax + t2Tax;

              return (
                <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px" }}>
                  <h4 style={{ fontWeight: "bold", marginBottom: "10px", color: "var(--navy)" }}>Assessable Profit (Reconciled)</h4>
                  <table className="hk-table">
                    <tbody>
                      <tr>
                        <td>Accounting Net Profit</td>
                        <td className="hk-nm">{N(net)}</td>
                      </tr>
                      <tr style={{ color: "var(--red)" }}>
                        <td>Add: Book Depreciation</td>
                        <td className="hk-nm">+{N(bookDepr)}</td>
                      </tr>
                      <tr style={{ color: "var(--red)" }}>
                        <td>Add: Non-deductible Entertainment</td>
                        <td className="hk-nm">+{N(trEnt)}</td>
                      </tr>
                      <tr style={{ color: "var(--green)" }}>
                        <td>Less: IRD Tax Allowances</td>
                        <td className="hk-nm">-{N(taxAllow)}</td>
                      </tr>
                      <tr style={{ color: "var(--green)" }}>
                        <td>Less: Offshore Revenue Claims</td>
                        <td className="hk-nm">-{N(trOff)}</td>
                      </tr>
                      <tr style={{ color: "var(--green)" }}>
                        <td>Less: Enhanced R&D Extra Deduction</td>
                        <td className="hk-nm">-{N(trRd * 2)}</td>
                      </tr>
                      <tr style={{ color: "var(--green)" }}>
                        <td>Less: Prior Loss Set-off</td>
                        <td className="hk-nm">-{N(trLoss)}</td>
                      </tr>
                      <tr style={{ borderTop: "2px solid var(--navy)", fontWeight: "bold" }}>
                        <td>ASSESSABLE PROFIT (TAXABLE)</td>
                        <td className="hk-nm" style={{ color: "var(--navy)" }}>{N(assessableProfit)}</td>
                      </tr>
                      <tr style={{ fontWeight: "bold", color: "var(--red)" }}>
                        <td>ESTIMATED HONG KONG PROFITS TAX</td>
                        <td className="hk-nm">{N(finalTax)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 📐 PROFITS TAX CALCULATOR TAB */}
      {currentTab === "profits-tax" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📐 Hong Kong Profits Tax Calculator (Two-Tiered Rates)</h3></div>
          <div className="hk-alert hk-a-info">
            <strong>Two-Tiered Profits Tax Rates:</strong> Corporations are taxed at 8.25% on the first HK$2,000,000 of assessable profits, and 16.5% on the remainder. For unincorporated businesses, the rates are 7.5% and 15% respectively.
          </div>

          <div className="hk-grid hk-g2">
            <div>
              <div className="hk-fr hk-fr2">
                <div className="hk-fg">
                  <label>Assessable Profits (HK$)</label>
                  <input
                    type="number"
                    value={sdVal || ""}
                    onChange={(e) => setSdVal(parseFloat(e.target.value) || 0)}
                    placeholder="2500000"
                  />
                </div>
                <div className="hk-fg">
                  <label>Entity Structure</label>
                  <select value={sdBuy} onChange={(e) => setSdBuy(e.target.value)}>
                    <option value="hk1">Corporation (8.25% / 16.5%)</option>
                    <option value="hk2">Unincorporated (7.5% / 15%)</option>
                  </select>
                </div>
              </div>

              {/* Calculator Output */}
              {(() => {
                const isCorp = sdBuy === "hk1";
                const tier1Rate = isCorp ? 0.0825 : 0.075;
                const tier2Rate = isCorp ? 0.165 : 0.15;

                const t1 = Math.min(sdVal, 2e6) * tier1Rate;
                const t2 = Math.max(0, sdVal - 2e6) * tier2Rate;
                const totalTax = t1 + t2;

                return (
                  <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px", marginTop: "14px" }}>
                    <table className="hk-table">
                      <tbody>
                        <tr>
                          <td>Taxable Assessable Profits</td>
                          <td className="hk-nm">{F(sdVal)}</td>
                        </tr>
                        <tr>
                          <td>First HK$2M Tier 1 Tax</td>
                          <td className="hk-nm">{F(t1)}</td>
                        </tr>
                        <tr>
                          <td>Remaining Tier 2 Tax</td>
                          <td className="hk-nm">{F(t2)}</td>
                        </tr>
                        <tr style={{ borderTop: "2px solid var(--border)", fontWeight: "bold", color: "var(--red)" }}>
                          <td>Total Estimated Profits Tax</td>
                          <td className="hk-nm">{F(totalTax)}</td>
                        </tr>
                        <tr>
                          <td>Effective Tax Rate</td>
                          <td className="hk-nm">{sdVal > 0 ? ((totalTax / sdVal) * 100).toFixed(2) + "%" : "0%"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px" }}>
              <h4 style={{ color: "var(--navy)", fontWeight: "bold", marginBottom: "8px" }}>Tax Rate Reference</h4>
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Tier Bracket</th>
                    <th>Corporations</th>
                    <th>Unincorporated</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>First HK$2,000,000</td>
                    <td>8.25%</td>
                    <td>7.5%</td>
                  </tr>
                  <tr>
                    <td>Above HK$2,000,000</td>
                    <td>16.5%</td>
                    <td>15.0%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🔖 STAMP DUTY CALCULATOR TAB */}
      {currentTab === "stamp-duty" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🔖 Hong Kong Stamp Duty Calculator</h3></div>
          <div className="hk-tabs">
            <div className={`hk-tab ${sdTab === "prop" ? "active" : ""}`} onClick={() => setSdTab("prop")}>🏠 Property Transaction</div>
            <div className={`hk-tab ${sdTab === "share" ? "active" : ""}`} onClick={() => setSdTab("share")}>📈 Share Transfer</div>
            <div className={`hk-tab ${sdTab === "lease" ? "active" : ""}`} onClick={() => setSdTab("lease")}>📜 Tenancy Lease</div>
          </div>

          {sdTab === "prop" && (
            <div>
              <div className="hk-fr hk-fr2">
                <div className="hk-fg">
                  <label>Property Value (HK$)</label>
                  <input
                    type="number"
                    value={sdVal || ""}
                    onChange={(e) => setSdVal(parseFloat(e.target.value) || 0)}
                    placeholder="6000000"
                  />
                </div>
                <div className="hk-fg">
                  <label>Buyer Type</label>
                  <select value={sdBuy} onChange={(e) => setSdBuy(e.target.value)}>
                    <option value="hk1">Hong Kong Permanent Resident (First Home)</option>
                    <option value="hk2">Hong Kong Resident (Second+ Home / Non-HK Permanent Resident)</option>
                  </select>
                </div>
              </div>

              {/* Calculate Property Stamp Duty */}
              {(() => {
                let avd = 0;
                if (sdBuy === "hk1") {
                  // Scale 2 AVD (First home permanent resident)
                  if (sdVal <= 3e6) avd = 100;
                  else if (sdVal <= 3528240) avd = 100 + (sdVal - 3e6) * 0.1;
                  else if (sdVal <= 4.5e6) avd = sdVal * 0.015;
                  else if (sdVal <= 4935480) avd = 67500 + (sdVal - 4.5e6) * 0.1;
                  else if (sdVal <= 6e6) avd = sdVal * 0.0225;
                  else if (sdVal <= 6642860) avd = 135000 + (sdVal - 6e6) * 0.1;
                  else if (sdVal <= 9e6) avd = sdVal * 0.03;
                  else if (sdVal <= 10.08e6) avd = 270000 + (sdVal - 9e6) * 0.1;
                  else if (sdVal <= 2e7) avd = sdVal * 0.0375;
                  else avd = sdVal * 0.0425;
                } else {
                  // Flat rate 7.5% for non-first home / non-HK residents
                  avd = sdVal * 0.075;
                }

                return (
                  <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px", marginTop: "14px" }}>
                    <table className="hk-table">
                      <tbody>
                        <tr>
                          <td>Ad Valorem Stamp Duty (AVD)</td>
                          <td className="hk-nm" style={{ color: "var(--red)", fontWeight: "bold" }}>{F(avd)}</td>
                        </tr>
                        <tr>
                          <td>Effective Rate</td>
                          <td className="hk-nm">{sdVal > 0 ? ((avd / sdVal) * 100).toFixed(2) + "%" : "0%"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {sdTab === "share" && (
            <div>
              <div className="hk-fg" style={{ maxWidth: "300px" }}>
                <label>Share Transfer Consideration / Net Asset Value (HK$)</label>
                <input
                  type="number"
                  value={sdShareVal || ""}
                  onChange={(e) => setSdShareVal(parseFloat(e.target.value) || 0)}
                  placeholder="500000"
                />
              </div>

              {(() => {
                // Share transfer duty: 0.2% of transaction amount or net asset value (whichever is higher) plus HK$5.
                const duty = Math.ceil(sdShareVal / 1000) * 2; // HK$2 per HK$1,000 (0.2%)
                return (
                  <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px", marginTop: "14px" }}>
                    <table className="hk-table">
                      <tbody>
                        <tr>
                          <td>Stamp Duty on Share Transfer (0.2%)</td>
                          <td className="hk-nm" style={{ color: "var(--red)", fontWeight: "bold" }}>{F(duty)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {sdTab === "lease" && (
            <div>
              <div className="hk-fr hk-fr3">
                <div className="hk-fg"><label>Monthly Rental (HK$)</label><input type="number" value={sdRent || ""} onChange={(e) => setSdRent(parseFloat(e.target.value) || 0)} /></div>
                <div className="hk-fg"><label>Lease Term (Months)</label><input type="number" value={sdTerm || ""} onChange={(e) => setSdTerm(parseInt(e.target.value) || 0)} /></div>
                <div className="hk-fg"><label>Key Money / Lease Premium (HK$)</label><input type="number" value={sdDep || ""} onChange={(e) => setSdDep(parseFloat(e.target.value) || 0)} /></div>
              </div>

              {(() => {
                const totalRent = sdRent * sdTerm;
                let duty = 0;
                if (sdTerm <= 12) duty = sdRent * 12 * 0.0025; // 0.25% of annual rent
                else if (sdTerm <= 36) duty = totalRent * 0.005; // 0.5% of total rent over period
                else duty = totalRent * 0.01; // 1% of total rent over period
                const premiumDuty = sdDep * 0.005;

                return (
                  <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px", marginTop: "14px" }}>
                    <table className="hk-table">
                      <tbody>
                        <tr>
                          <td>Duty on Lease Rent</td>
                          <td className="hk-nm">{F(duty)}</td>
                        </tr>
                        <tr>
                          <td>Duty on Lease Premium</td>
                          <td className="hk-nm">{F(premiumDuty)}</td>
                        </tr>
                        <tr style={{ borderTop: "2px solid var(--border)", fontWeight: "bold", color: "var(--red)" }}>
                          <td>Total Lease Stamp Duty</td>
                          <td className="hk-nm">{F(duty + premiumDuty)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ⚖ TRIAL BALANCE TAB */}
      {currentTab === "tb" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>⚖ Trial Balance</h3></div>
          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Account Name</th>
                  <th className="hk-nm">Debit (HKD)</th>
                  <th className="hk-nm">Credit (HKD)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let totalDr = 0;
                  let totalCr = 0;

                  return (
                    <>
                      {D.accounts.map((a) => {
                        const balance = getBal(a.c);
                        if (balance === 0) return null;

                        const isDr = a.nr === "Dr";
                        const drVal = isDr ? balance : 0;
                        const crVal = isDr ? 0 : balance;

                        totalDr += drVal;
                        totalCr += crVal;

                        return (
                          <tr key={a.c}>
                            <td>{a.c}</td>
                            <td>{a.n}</td>
                            <td className="hk-nm">{drVal > 0 ? N(drVal) : ""}</td>
                            <td className="hk-nm">{crVal > 0 ? N(crVal) : ""}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ borderTop: "2px solid var(--navy)", fontWeight: "bold" }}>
                        <td colSpan={2}><strong>TOTALS</strong></td>
                        <td className="hk-nm">{N(totalDr)}</td>
                        <td className="hk-nm">{N(totalCr)}</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📈 PROFIT & LOSS TAB */}
      {currentTab === "pl" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📈 Statement of Profit or Loss (Comprehensive Income)</h3></div>
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div className="hk-rl hk-sec"><span>REVENUE</span></div>
            {D.accounts
              .filter((a) => a.t === "Revenue")
              .map((a) => {
                const balance = getBal(a.c);
                return balance !== 0 ? (
                  <div className="hk-rl indent" key={a.c}>
                    <span>{a.n}</span>
                    <span className="hk-nm">{N(balance)}</span>
                  </div>
                ) : null;
              })}
            <div className="hk-rl hk-sub">
              <span>Total Revenue</span>
              <span className="hk-nm">{N(rev)}</span>
            </div>

            <div className="hk-rl hk-sec"><span>COST OF SALES</span></div>
            {(() => {
              const cogs = getBal("5000");
              return (
                <>
                  <div className="hk-rl indent">
                    <span>Cost of Goods Sold (COGS)</span>
                    <span className="hk-nm">({N(cogs)})</span>
                  </div>
                  <div className="hk-rl hk-sub">
                    <span>Gross Profit</span>
                    <span className="hk-nm">{N(rev - cogs)}</span>
                  </div>
                </>
              );
            })()}

            <div className="hk-rl hk-sec"><span>OPERATING EXPENSES</span></div>
            {D.accounts
              .filter((a) => a.t === "Expense" && a.c !== "5000" && a.c !== "6000")
              .map((a) => {
                const balance = getBal(a.c);
                return balance !== 0 ? (
                  <div className="hk-rl indent" key={a.c}>
                    <span>{a.n}</span>
                    <span className="hk-nm">({N(balance)})</span>
                  </div>
                ) : null;
              })}
            <div className="hk-rl hk-sub">
              <span>Total Operating Expenses</span>
              <span className="hk-nm">({N(exp - getBal("5000"))})</span>
            </div>

            <div className="hk-rl hk-sub">
              <span>Operating Net Profit</span>
              <span className="hk-nm" style={{ color: net >= 0 ? "var(--green)" : "var(--red)" }}>{N(net)}</span>
            </div>
            <div className="hk-rl indent">
              <span>Profits Tax provision</span>
              <span className="hk-nm">({N(tax)})</span>
            </div>
            <div className="hk-rl hk-total">
              <span>NET PROFIT FOR THE YEAR</span>
              <span className="hk-nm" style={{ color: net - tax >= 0 ? "var(--green)" : "var(--red)" }}>HK$ {N(net - tax)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 🗂 BALANCE SHEET TAB */}
      {currentTab === "bs" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🗂 Statement of Financial Position (Balance Sheet)</h3></div>
          <div className="hk-grid hk-g2" style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* ASSETS */}
            <div>
              <div className="hk-rl hk-sec"><span>ASSETS</span></div>
              {D.accounts
                .filter((a) => a.t === "Asset")
                .map((a) => {
                  const balance = getBal(a.c);
                  return balance !== 0 ? (
                    <div className="hk-rl indent" key={a.c}>
                      <span>{a.n}</span>
                      <span className="hk-nm">{N(balance)}</span>
                    </div>
                  ) : null;
                })}
              <div className="hk-rl hk-total">
                <span>TOTAL ASSETS</span>
                <span className="hk-nm">HK$ {N(totType("Asset"))}</span>
              </div>
            </div>

            {/* LIABILITIES & EQUITY */}
            <div>
              <div className="hk-rl hk-sec"><span>LIABILITIES</span></div>
              {D.accounts
                .filter((a) => a.t === "Liability")
                .map((a) => {
                  const balance = getBal(a.c);
                  return balance !== 0 ? (
                    <div className="hk-rl indent" key={a.c}>
                      <span>{a.n}</span>
                      <span className="hk-nm">{N(balance)}</span>
                    </div>
                  ) : null;
                })}
              <div className="hk-rl hk-sub">
                <span>Total Liabilities</span>
                <span className="hk-nm">{N(totType("Liability"))}</span>
              </div>

              <div className="hk-rl hk-sec"><span>EQUITY</span></div>
              {D.accounts
                .filter((a) => a.t === "Equity")
                .map((a) => {
                  const balance = getBal(a.c);
                  return balance !== 0 ? (
                    <div className="hk-rl indent" key={a.c}>
                      <span>{a.n}</span>
                      <span className="hk-nm">{N(balance)}</span>
                    </div>
                  ) : null;
                })}
              {/* Current Year Profit addition */}
              <div className="hk-rl indent">
                <span>Current Year Profit (After Tax)</span>
                <span className="hk-nm">{N(net - tax)}</span>
              </div>
              <div className="hk-rl hk-total">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span className="hk-nm">HK$ {N(totType("Liability") + totType("Equity") + (net - tax))}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💧 CASH FLOW STATEMENT TAB */}
      {currentTab === "cf" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>💧 Statement of Cash Flows (Indirect Method)</h3></div>
          {fw === "sme" && (
            <div className="hk-alert hk-a-warn">
              ⚠️ Under the SME-FRS framework, a Statement of Cash Flows is <strong>not required</strong>. The report below is displayed for informational purposes only.
            </div>
          )}

          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div className="hk-rl hk-sec"><span>OPERATING ACTIVITIES</span></div>
            <div className="hk-rl indent"><span>Net Profit Before Tax</span><span className="hk-nm">{N(net)}</span></div>
            {(() => {
              const bookDepr = D.assets.reduce((sum, a) => sum + assetBook(a).an, 0);
              const arChange = getBal("1100");
              const apChange = getBal("2000");
              const operatingCash = net + bookDepr - arChange + apChange;
              const investingCash = -D.assets.reduce((sum, a) => sum + a.cost, 0);
              const financingCash = getBal("3000") + getBal("2400"); // Share Capital + Directors Loan
              const netChange = operatingCash + investingCash + financingCash;

              return (
                <>
                  <div className="hk-rl indent"><span>Adjustment: Depreciation</span><span className="hk-nm">+{N(bookDepr)}</span></div>
                  <div className="hk-rl indent"><span>Decrease/(Increase) in Accounts Receivable</span><span className="hk-nm">({N(arChange)})</span></div>
                  <div className="hk-rl indent"><span>Increase/(Decrease) in Accounts Payable</span><span className="hk-nm">{N(apChange)}</span></div>
                  <div className="hk-rl hk-sub"><span>Net Cash from Operating Activities</span><span className="hk-nm">{N(operatingCash)}</span></div>

                  <div className="hk-rl hk-sec"><span>INVESTING ACTIVITIES</span></div>
                  <div className="hk-rl indent"><span>Purchase of Property, Plant & Equipment</span><span className="hk-nm">({N(-investingCash)})</span></div>
                  <div className="hk-rl hk-sub"><span>Net Cash used in Investing Activities</span><span className="hk-nm">({N(-investingCash)})</span></div>

                  <div className="hk-rl hk-sec"><span>FINANCING ACTIVITIES</span></div>
                  <div className="hk-rl indent"><span>Proceeds from Share Capital / Loans</span><span className="hk-nm">{N(financingCash)}</span></div>
                  <div className="hk-rl hk-sub"><span>Net Cash from Financing Activities</span><span className="hk-nm">{N(financingCash)}</span></div>

                  <div className="hk-rl hk-total"><span>NET CHANGE IN CASH</span><span className="hk-nm" style={{ color: netChange >= 0 ? "var(--green)" : "var(--red)" }}>HK$ {N(netChange)}</span></div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* 🔄 CHANGES IN EQUITY TAB */}
      {currentTab === "eq" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🔄 Statement of Changes in Equity</h3></div>
          {fw === "sme" && (
            <div className="hk-alert hk-a-warn">
              ⚠️ Under SME-FRS, a Statement of Changes in Equity is <strong>not required</strong>.
            </div>
          )}

          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th className="hk-nm">Share Capital</th>
                  <th className="hk-nm">Retained Earnings</th>
                  <th className="hk-nm">Total Equity</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const shareCap = getBal("3000");
                  const opRetained = getBal("3100");
                  const finalProfit = net - tax;
                  return (
                    <>
                      <tr>
                        <td>Opening Balance</td>
                        <td className="hk-nm">{N(shareCap)}</td>
                        <td className="hk-nm">{N(opRetained)}</td>
                        <td className="hk-nm" style={{ fontWeight: "bold" }}>{N(shareCap + opRetained)}</td>
                      </tr>
                      <tr>
                        <td>Profit for the Year</td>
                        <td className="hk-nm">–</td>
                        <td className="hk-nm" style={{ color: "var(--green)" }}>{N(finalProfit)}</td>
                        <td className="hk-nm" style={{ color: "var(--green)", fontWeight: "bold" }}>{N(finalProfit)}</td>
                      </tr>
                      <tr style={{ borderTop: "2px solid var(--border)", fontWeight: "bold" }}>
                        <td>Closing Balance</td>
                        <td className="hk-nm">{N(shareCap)}</td>
                        <td className="hk-nm">{N(opRetained + finalProfit)}</td>
                        <td className="hk-nm" style={{ color: "var(--navy)" }}>{N(shareCap + opRetained + finalProfit)}</td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📑 NOTES TO ACCOUNTS TAB */}
      {currentTab === "notes" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📑 Notes to the Financial Statements</h3></div>
          <div style={{ maxWidth: "850px", margin: "0 auto" }}>
            <div className="hk-notes-box">
              <h4>1. General Information</h4>
              <p>{D.settings.name} is a private company limited by shares incorporated in Hong Kong. Registered office at {D.settings.addr}.</p>
            </div>
            <div className="hk-notes-box">
              <h4>2. Basis of Preparation</h4>
              <p>These financial statements have been prepared in accordance with the <strong>{cfg.label}</strong> framework issued by the Hong Kong Institute of Certified Public Accountants (HKICPA) and the Hong Kong Companies Ordinance (Cap. 622).</p>
            </div>
            <div className="hk-notes-box">
              <h4>3. Significant Accounting Policies</h4>
              <ol>
                <li><strong>Revenue:</strong> Recognised upon delivery of goods / transfer of control.</li>
                <li><strong>Property, Plant & Equipment:</strong> Recorded at historical cost less accumulated straight-line depreciation.</li>
                {cfg.deferredTax && <li><strong>Deferred Tax:</strong> Accounted for temporary differences under the liability method at 16.5%.</li>}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ✅ COMPLIANCE CENTER TAB */}
      {currentTab === "compliance" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>✅ Hong Kong Statutory Compliance Center</h3></div>
          <div className="hk-grid hk-g2">
            <div>
              <h4 style={{ fontWeight: "bold", marginBottom: "10px", color: "var(--navy)" }}>📋 Compliance Checklist</h4>
              <div className="hk-chk">
                <div className="hk-chk-ico hk-chk-ok">✅</div>
                <div className="hk-chk-text">
                  <strong>Audited Accounts (Cap. 622 s.405)</strong>
                  <span>Practising CPA Audit is mandatory for all HK incorporated companies</span>
                </div>
              </div>
              <div className="hk-chk">
                <div className="hk-chk-ico hk-chk-ok">✅</div>
                <div className="hk-chk-text">
                  <strong>Record Keeping (7 Years)</strong>
                  <span>Accounting logs, invoices, vouchers must be retained for 7 years</span>
                </div>
              </div>
              <div className="hk-chk">
                <div className="hk-chk-ico hk-chk-ok">✅</div>
                <div className="hk-chk-text">
                  <strong>Employer Return filing</strong>
                  <span>IR56B forms successfully configured and generated</span>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px" }}>
              <h4 style={{ fontWeight: "bold", marginBottom: "10px", color: "var(--navy)" }}>⚖️ Legal Penalties for Late Filings</h4>
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Offence</th>
                    <th>Standard Court Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Late Profits Tax Return (BIR51)</td>
                    <td>HK$10,000 + 300% of tax undercharged</td>
                  </tr>
                  <tr>
                    <td>Failure to Keep Proper Records</td>
                    <td>Fine up to HK$300,000</td>
                  </tr>
                  <tr>
                    <td>Late Annual Return (NAR1)</td>
                    <td>HK$4,800 to HK$20,000 escalated by days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 AUDIT TRAIL TAB */}
      {currentTab === "audit" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>🔍 System Audit Trail Logs</h3></div>
          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Code</th>
                  <th>Details Logged</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {D.log.map((logItem, idx) => (
                  <tr key={idx}>
                    <td>{new Date(logItem.ts).toLocaleString()}</td>
                    <td><span className="hk-badge hk-b-blue">{logItem.a}</span></td>
                    <td>{logItem.d}</td>
                    <td><strong>{logItem.u}</strong></td>
                  </tr>
                ))}
                {D.log.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: "16px" }}>
                      No actions logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 📅 STATUTORY DEADLINES TAB */}
      {currentTab === "deadlines" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>📅 Hong Kong Statutory Deadlines</h3></div>
          <div className="hk-tw">
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Deadline Target</th>
                  <th>Regulatory Filing Form</th>
                  <th>Filing Authority</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Within 18 months of incorporation</td>
                  <td>First Profits Tax Return (BIR51)</td>
                  <td>Inland Revenue Department (IRD)</td>
                </tr>
                <tr>
                  <td>Annually (By 30th April)</td>
                  <td>IR56B Employer's Return</td>
                  <td>IRD</td>
                </tr>
                <tr>
                  <td>Within 42 days of Incorporation Anniversary</td>
                  <td>Annual Return (Form NAR1)</td>
                  <td>Companies Registry (CR)</td>
                </tr>
                <tr>
                  <td>Monthly (By 10th of next month)</td>
                  <td>MPF Contribution & Remittance Statement</td>
                  <td>Mandatory Provident Fund Schemes Authority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⚙ SETTINGS TAB */}
      {currentTab === "settings" && (
        <div className="hk-card">
          <div className="hk-card-h"><h3>⚙ Company Configuration & Settings</h3></div>
          <div className="hk-fr hk-fr3">
            <div className="hk-fg">
              <label>Legal Company Name</label>
              <input
                type="text"
                value={D.settings.name}
                onChange={(e) => {
                  const updated = { ...D, settings: { ...D.settings, name: e.target.value } };
                  saveState(updated);
                }}
              />
            </div>
            <div className="hk-fg">
              <label>Business Registration Number (BRN)</label>
              <input
                type="text"
                value={D.settings.brn}
                onChange={(e) => {
                  const updated = { ...D, settings: { ...D.settings, brn: e.target.value } };
                  saveState(updated);
                }}
              />
            </div>
            <div className="hk-fg">
              <label>Companies Registry No (CR No)</label>
              <input
                type="text"
                value={D.settings.cr}
                onChange={(e) => {
                  const updated = { ...D, settings: { ...D.settings, cr: e.target.value } };
                  saveState(updated);
                }}
              />
            </div>
          </div>
          <div className="hk-fr hk-fr2" style={{ marginTop: "12px" }}>
            <div className="hk-fg">
              <label>Registered Office Address</label>
              <input
                type="text"
                value={D.settings.addr}
                onChange={(e) => {
                  const updated = { ...D, settings: { ...D.settings, addr: e.target.value } };
                  saveState(updated);
                }}
              />
            </div>
            <div className="hk-fg">
              <label>Appointed Auditor (CPA)</label>
              <input
                type="text"
                value={D.settings.aud}
                onChange={(e) => {
                  const updated = { ...D, settings: { ...D.settings, aud: e.target.value } };
                  saveState(updated);
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              className="hk-btn hk-btn-n"
              onClick={() => {
                addLog("SET_SAVE", "Updated company information parameters");
                alert("✅ Configuration saved successfully!");
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main page component with React Suspense wrapper for Next.js searchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
