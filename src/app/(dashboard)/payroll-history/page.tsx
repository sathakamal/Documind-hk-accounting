"use client";

import { useEffect, useState } from "react";
import { formatMoney, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PayrollLine {
  id: string;
  employee: {
    name: string;
  };
  grossPay: number;
  netPay: number;
}

interface PayrollRun {
  id: string;
  runNumber: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  status: string;
  totalGrossPay: number;
  totalNetPay: number;
  totalCost: number;
  lines: PayrollLine[];
}

export default function PayrollHistoryPage() {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/payroll-runs");
      const data = await res.json();
      if (data.success) {
        setPayrollRuns(data.data);
      }
    } catch (err) {
      toast.error("Failed to load payroll history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="hk-page">
        <div className="text-center py-20 text-muted-foreground">Loading payroll history...</div>
      </div>
    );
  }

  return (
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>📜 Payroll History</h3>
          <span className="hk-badge hk-b-blue">{payrollRuns.length} Run{payrollRuns.length === 1 ? "" : "s"}</span>
        </div>
        {payrollRuns.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
              No payroll history yet.
          </div>
        ) : (
          <div className="space-y-4">
            {payrollRuns.map((payroll) => (
              <div key={payroll.id} className="hk-card" style={{ background: "var(--gray)" }}>
                <div className="hk-card-h">
                <div>
                    <h3>{payroll.runNumber}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)} | Payment: {formatDate(payroll.paymentDate)}
                  </p>
                </div>
                  <span className={`hk-badge ${
                    payroll.status === "APPROVED" ? "hk-b-green" :
                    payroll.status === "PAID" ? "hk-b-blue" :
                    "hk-b-orange"
                  }`}>
                    {payroll.status}
                  </span>
                </div>

                <div className="hk-grid hk-g3" style={{ marginBottom: "16px" }}>
                  <div className="hk-stat" style={{ "--c": "var(--blue)" } as React.CSSProperties}>
                    <div className="lb">Gross Pay</div>
                    <div className="vl">{formatMoney(payroll.totalGrossPay, "HKD")}</div>
                  </div>
                  <div className="hk-stat" style={{ "--c": "var(--green)" } as React.CSSProperties}>
                    <div className="lb">Net Pay</div>
                    <div className="vl" style={{ color: "var(--green)" }}>{formatMoney(payroll.totalNetPay, "HKD")}</div>
                  </div>
                  <div className="hk-stat" style={{ "--c": "var(--gold)" } as React.CSSProperties}>
                    <div className="lb">Total Cost</div>
                    <div className="vl">{formatMoney(payroll.totalCost, "HKD")}</div>
                  </div>
                </div>

                <div className="hk-tw">
                  <table className="hk-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th className="hk-nm">Gross Pay</th>
                        <th className="hk-nm">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="font-medium">{line.employee.name}</td>
                          <td className="hk-nm font-mono">{formatMoney(line.grossPay, "HKD")}</td>
                          <td className="hk-nm font-mono" style={{ color: "var(--green)", fontWeight: 700 }}>
                            {formatMoney(line.netPay, "HKD")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
