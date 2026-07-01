"use client";

import { useState, useEffect } from "react";

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

interface AgingStats {
  current: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

export default function ARAgingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agingStats, setAgingStats] = useState<AgingStats>({
    current: 0,
    days31to60: 0,
    days61to90: 0,
    over90: 0,
    total: 0
  });

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem("hkpro3_next");
        if (saved) {
          const data = JSON.parse(saved);
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
    // Listen for storage changes (in case data is updated in another tab)
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, []);

  // Calculate aging statistics
  useEffect(() => {
    const today = new Date();
    let current = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let over90 = 0;
    let total = 0;

    const outstandingInvoices = invoices.filter(inv => inv.st !== "Paid");
    
    outstandingInvoices.forEach(inv => {
      const dueDate = new Date(inv.due);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const balance = inv.amt - (inv.pd || 0);

      if (daysDiff <= 0) {
        current += balance;
      } else if (daysDiff <= 30) {
        current += balance; // Still considered current if within 30 days past due
      } else if (daysDiff <= 60) {
        days31to60 += balance;
      } else if (daysDiff <= 90) {
        days61to90 += balance;
      } else {
        over90 += balance;
      }
      
      total += balance;
    });

    setAgingStats({
      current,
      days31to60,
      days61to90,
      over90,
      total
    });
  }, [invoices]);

  // Format currency for HK
  const formatCurrency = (amount: number) => {
    return `HK$${amount.toLocaleString("en-HK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Calculate days between dates
  const daysBetween = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Get aging bucket for an invoice
  const getAgingBucket = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 0) return "Current";
    if (daysDiff <= 30) return "Current"; // Within 30 days past due
    if (daysDiff <= 60) return "31-60";
    if (daysDiff <= 90) return "61-90";
    return ">90";
  };

  // Get status badge color
  const getStatusBadge = (daysDiff: number) => {
    if (daysDiff <= 0) return "hk-badge hk-b-green";
    if (daysDiff <= 30) return "hk-badge hk-b-gold";
    if (daysDiff <= 60) return "hk-badge hk-b-orange";
    return "hk-badge hk-b-red";
  };

  // Calculate expected credit loss (HKFRS 9)
  const calculateExpectedCreditLoss = () => {
    const { days31to60, days61to90, over90 } = agingStats;
    
    // HKFRS 9 simplified approach:
    // - 31-60 days: 10% provision
    // - 61-90 days: 25% provision  
    // - Over 90 days: 50% provision
    const provision = 
      (days31to60 * 0.10) + 
      (days61to90 * 0.25) + 
      (over90 * 0.50);
    
    return provision;
  };

  const expectedCreditLoss = calculateExpectedCreditLoss();
  const outstandingInvoices = invoices.filter(inv => inv.st !== "Paid");
  const outstandingTotal = outstandingInvoices.reduce((sum, inv) => sum + inv.amt, 0);
  const eclRate = agingStats.total > 0 ? (expectedCreditLoss / agingStats.total) * 100 : 0;

  return (
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>⏳ AR Aging Report</h3>
          <button className="hk-btn hk-btn-o hk-btn-s">CSV</button>
        </div>

        <div className="hk-alert hk-a-warn">
          Per HKFRS 9: expected credit loss model requires aging analysis to determine bad debt provisions.
        </div>

        <div className="hk-grid hk-g4" style={{ marginBottom: "14px" }}>
          <div className="hk-stat" style={{ "--c": "var(--green)" } as React.CSSProperties}>
            <div className="lb">Current</div>
            <div className="vl">{formatCurrency(agingStats.current)}</div>
            <div className="sub">
              {agingStats.total > 0 ? `${((agingStats.current / agingStats.total) * 100).toFixed(1)}% of total` : "No outstanding"}
            </div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--orange)" } as React.CSSProperties}>
            <div className="lb">31-60 Days</div>
            <div className="vl">{formatCurrency(agingStats.days31to60)}</div>
            <div className="sub">10% ECL: {formatCurrency(agingStats.days31to60 * 0.10)}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--red)" } as React.CSSProperties}>
            <div className="lb">61-90 Days</div>
            <div className="vl">{formatCurrency(agingStats.days61to90)}</div>
            <div className="sub">25% ECL: {formatCurrency(agingStats.days61to90 * 0.25)}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--purple)" } as React.CSSProperties}>
            <div className="lb">{">90 Days"}</div>
            <div className="vl">{formatCurrency(agingStats.over90)}</div>
            <div className="sub">50% ECL: {formatCurrency(agingStats.over90 * 0.50)}</div>
          </div>
        </div>

        <div className="hk-alert hk-a-info">
          <strong>Total Outstanding:</strong> {formatCurrency(agingStats.total)} | <strong>Expected Credit Loss:</strong> {formatCurrency(expectedCreditLoss)} ({eclRate.toFixed(2)}%)
          <br />
          <strong>Journal Entry Required:</strong> DR Bad Debt Expense {formatCurrency(expectedCreditLoss)} / CR Allowance for Doubtful Debts {formatCurrency(expectedCreditLoss)}
        </div>

        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Inv#</th>
                <th>Date</th>
                <th>Due</th>
                <th className="hk-nm">Total</th>
                <th className="hk-nm">Current</th>
                <th className="hk-nm">31-60</th>
                <th className="hk-nm">61-90</th>
                <th className="hk-nm">{">90"}</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {outstandingInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted-foreground py-8">
                    No outstanding invoices
                  </td>
                </tr>
              ) : (
                outstandingInvoices.map((invoice) => {
                  const balance = invoice.amt - (invoice.pd || 0);
                  const agingBucket = getAgingBucket(invoice.due);
                  const daysDiff = daysBetween(invoice.due, new Date().toISOString().split("T")[0]);

                  return (
                    <tr key={invoice.id}>
                      <td>{invoice.cust}</td>
                      <td>{invoice.num}</td>
                      <td>{invoice.dt}</td>
                      <td>{invoice.due}</td>
                      <td className="hk-nm">{formatCurrency(invoice.amt)}</td>
                      <td className="hk-nm">{agingBucket === "Current" ? formatCurrency(balance) : ""}</td>
                      <td className="hk-nm">{agingBucket === "31-60" ? formatCurrency(balance) : ""}</td>
                      <td className="hk-nm">{agingBucket === "61-90" ? formatCurrency(balance) : ""}</td>
                      <td className="hk-nm">{agingBucket === ">90" ? formatCurrency(balance) : ""}</td>
                      <td>
                        <span className={getStatusBadge(daysDiff)}>
                          {daysDiff <= 0 ? "Current" : `${daysDiff}d`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}><strong>Totals</strong></td>
                <td className="hk-nm">{formatCurrency(outstandingTotal)}</td>
                <td className="hk-nm">{formatCurrency(agingStats.current)}</td>
                <td className="hk-nm">{formatCurrency(agingStats.days31to60)}</td>
                <td className="hk-nm">{formatCurrency(agingStats.days61to90)}</td>
                <td className="hk-nm">{formatCurrency(agingStats.over90)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="hk-notes-box" style={{ marginTop: "14px" }}>
          <h4>HKFRS 9 Compliance Notes</h4>
          <ul>
            <li>Expected credit loss must be recognized from initial recognition of the receivable.</li>
            <li>The simplified approach normally applies to trade receivables without a significant financing component.</li>
            <li>Lifetime ECL should reflect historical loss experience plus forward-looking information.</li>
            <li>Allowance for doubtful debts should be reviewed and updated at each reporting date.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
