"use client";

import { useState, useEffect } from "react";

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

interface AgingStats {
  current: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

export default function APAgingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
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
          setBills(data.bills || []);
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

    const outstandingBills = bills.filter(bill => bill.st !== "Paid");
    
    outstandingBills.forEach(bill => {
      const dueDate = new Date(bill.due);
      const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const balance = bill.amt - (bill.pd || 0);

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
  }, [bills]);

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

  // Get aging bucket for a bill
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

  // Calculate potential late payment penalties
  const calculateLatePenalties = () => {
    const { days31to60, days61to90, over90 } = agingStats;
    
    // Typical supplier penalties:
    // - 31-60 days: 2% penalty
    // - 61-90 days: 5% penalty  
    // - Over 90 days: 10% penalty + potential legal action
    const penalties = 
      (days31to60 * 0.02) + 
      (days61to90 * 0.05) + 
      (over90 * 0.10);
    
    return penalties;
  };

  const latePenalties = calculateLatePenalties();
  const outstandingBills = bills.filter(bill => bill.st !== "Paid");

  return (
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>🕐 AP Aging Report</h3>
        </div>

        <div className="hk-grid hk-g4" style={{ marginBottom: "14px" }}>
          <div className="hk-stat" style={{ "--c": "var(--green)" } as React.CSSProperties}>
            <div className="lb">Current</div>
            <div className="vl">{formatCurrency(agingStats.current)}</div>
            <div className="sub">
              {agingStats.total > 0 ? `${((agingStats.current / agingStats.total) * 100).toFixed(1)}% of total` : "No outstanding"}
            </div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--gold)" } as React.CSSProperties}>
            <div className="lb">31-60 Days</div>
            <div className="vl">{formatCurrency(agingStats.days31to60)}</div>
            <div className="sub">2% penalty: {formatCurrency(agingStats.days31to60 * 0.02)}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--orange)" } as React.CSSProperties}>
            <div className="lb">61-90 Days</div>
            <div className="vl">{formatCurrency(agingStats.days61to90)}</div>
            <div className="sub">5% penalty: {formatCurrency(agingStats.days61to90 * 0.05)}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--red)" } as React.CSSProperties}>
            <div className="lb">{">90 Days"}</div>
            <div className="vl">{formatCurrency(agingStats.over90)}</div>
            <div className="sub">10% penalty: {formatCurrency(agingStats.over90 * 0.10)}</div>
          </div>
        </div>

        <div className="hk-alert hk-a-err">
          <strong>Total Outstanding Payables:</strong> {formatCurrency(agingStats.total)} | <strong>Potential Late Payment Penalties:</strong> {formatCurrency(latePenalties)}
          <br />
          Late payment can damage supplier relationships, affect credit ratings, and disrupt the supply chain.
        </div>

        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Bill#</th>
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
              {outstandingBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center text-muted-foreground py-8">
                    No outstanding bills
                  </td>
                </tr>
              ) : (
                outstandingBills.map((bill) => {
                  const balance = bill.amt - (bill.pd || 0);
                  const agingBucket = getAgingBucket(bill.due);
                  const daysDiff = daysBetween(bill.due, new Date().toISOString().split("T")[0]);

                  return (
                    <tr key={bill.id}>
                      <td>{bill.vend}</td>
                      <td>{bill.num}</td>
                      <td>{bill.dt}</td>
                      <td>{bill.due}</td>
                      <td className="hk-nm">{formatCurrency(bill.amt)}</td>
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
          </table>
        </div>

        <div className="hk-grid hk-g3" style={{ marginTop: "14px" }}>
          <div className="hk-notes-box">
            <h4>High Priority</h4>
            <ul>
              <li>{">90 days"}: {formatCurrency(agingStats.over90)}</li>
              <li>Immediate payment to avoid legal action and supply stoppage.</li>
            </ul>
          </div>
          <div className="hk-notes-box">
            <h4>Medium Priority</h4>
            <ul>
              <li>61-90 days: {formatCurrency(agingStats.days61to90)}</li>
              <li>Schedule for settlement within 1-2 weeks.</li>
            </ul>
          </div>
          <div className="hk-notes-box">
            <h4>Low Priority</h4>
            <ul>
              <li>31-60 days: {formatCurrency(agingStats.days31to60)}</li>
              <li>Plan payment within normal creditor cycle.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
