"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="space-y-6">
        <PageHeader title="Payroll History" description="View your payroll history" />
        <div className="text-center py-20 text-muted-foreground">Loading payroll history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll History"
        description="View your historical payroll runs"
      />

      <div className="space-y-6">
        {payrollRuns.length === 0 ? (
          <Card className="bg-[#1e2130] border-border">
            <CardContent className="text-center py-12 text-muted-foreground">
              No payroll history yet.
            </CardContent>
          </Card>
        ) : (
          payrollRuns.map((payroll) => (
            <Card key={payroll.id} className="bg-[#1e2130] border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{payroll.runNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)} | Payment: {formatDate(payroll.paymentDate)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payroll.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-500" :
                  payroll.status === "PAID" ? "bg-blue-500/20 text-blue-500" :
                  "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {payroll.status}
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Gross Pay</p>
                    <p className="text-lg font-mono font-bold text-foreground">{formatMoney(payroll.totalGrossPay, "HKD")}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Net Pay</p>
                    <p className="text-lg font-mono font-bold text-emerald-500">{formatMoney(payroll.totalNetPay, "HKD")}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-mono font-bold text-primary">{formatMoney(payroll.totalCost, "HKD")}</p>
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-secondary/30">
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">Employee</TableHead>
                        <TableHead className="text-muted-foreground text-right">Gross Pay</TableHead>
                        <TableHead className="text-muted-foreground text-right">Net Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.lines.map((line) => (
                        <TableRow key={line.id} className="border-border">
                          <TableCell className="font-medium text-foreground">{line.employee.name}</TableCell>
                          <TableCell className="text-right font-mono text-foreground">{formatMoney(line.grossPay, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-500">{formatMoney(line.netPay, "HKD")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
