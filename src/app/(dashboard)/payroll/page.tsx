"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, CheckCircle2, History, DollarSign, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { addDays, format, differenceInDays } from "date-fns";

interface Employee {
  id: string;
  code: string;
  name: string;
  hkid: string | null;
  basicSalary: number;
  housingAllowance: number;
  mpfExempt: boolean;
  status: string;
}

interface PayrollLine {
  id: string;
  employee: Employee;
  basicSalary: number;
  housingAllowance: number;
  grossPay: number;
  employeeMpf: number;
  netPay: number;
  employerMpf: number;
  totalCost: number;
}

interface PayrollRun {
  id: string;
  runNumber: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  status: string;
  totalGrossPay: number;
  totalEmployeeMpf: number;
  totalEmployerMpf: number;
  totalNetPay: number;
  totalCost: number;
  lines: PayrollLine[];
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
    paymentDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split("T")[0],
  });

  const fetchData = async () => {
    try {
      const [empRes, payrollRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/payroll-runs"),
      ]);
      const empData = await empRes.json();
      const payrollData = await payrollRes.json();
      
      if (empData.success) {
        setEmployees(empData.data.filter((e: Employee) => e.status === "ACTIVE"));
      }
      if (payrollData.success) {
        setPayrollRuns(payrollData.data);
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(empId)
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const toggleAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(e => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }

    try {
      const res = await fetch("/api/payroll-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          employeeIds: selectedEmployees,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payroll run created successfully");
        setIsDialogOpen(false);
        setSelectedEmployees([]);
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to create payroll run");
    }
  };

  const handleApprove = async (payrollId: string) => {
    if (!confirm("Are you sure you want to approve this payroll? This will create journal entries.")) {
      return;
    }

    try {
      const res = await fetch(`/api/payroll-runs/${payrollId}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payroll approved and journal entries created");
        
        // Sync to HKFRS LocalStorage Dashboard State
        const saved = localStorage.getItem("hkpro3_next");
        if (saved && data.data.journalEntry) {
          try {
            const D = JSON.parse(saved);
            const je = data.data.journalEntry;
            
            const newJE = {
              id: je.id,
              dt: je.date.split('T')[0],
              ref: je.reference || `PR-${je.id.substring(0,4)}`,
              desc: je.description,
              type: "Standard",
              cur: "HKD",
              rate: 1,
              lines: je.lines.map((l: any) => ({
                a: l.account.code,
                ld: `Payroll ${data.data.runNumber}`,
                dr: parseFloat(l.debit),
                cr: parseFloat(l.credit)
              })),
              ts: new Date().toISOString()
            };

            // Force refresh accounts list to include any auto-created accounts
            const accRes = await fetch("/api/accounts");
            const accData = await accRes.json();
            if (accData.success) {
              // Map DB accounts to Dashboard schema
              const dbAccs = accData.data.map((a: any) => ({
                c: a.code,
                n: a.name,
                t: a.type.charAt(0) + a.type.slice(1).toLowerCase(),
                nr: (a.type === "ASSET" || a.type === "EXPENSE") ? "Dr" : "Cr"
              }));
              
              // Merge with existing dashboard accounts, prioritizing DB records
              const existingCodes = new Set(dbAccs.map((a: any) => a.c));
              const localOnly = D.accounts.filter((a: any) => !existingCodes.has(a.c));
              D.accounts = [...dbAccs, ...localOnly].sort((a, b) => a.c.localeCompare(b.c));
            }

            D.journals = [newJE, ...D.journals];
            localStorage.setItem("hkpro3_next", JSON.stringify(D));
            toast.info("Dashboard reports updated with payroll data");
          } catch (e) {
            console.error("Sync to local storage failed", e);
          }
        }
        
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to approve payroll");
    }
  };

  const handleMarkAsPaid = async (payrollId: string) => {
    if (!confirm("Are you sure you want to mark this payroll as paid? This will update the status and can't be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/payroll-runs/${payrollId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payroll marked as paid");
        fetchData();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to mark payroll as paid");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payroll Processing" description="Process your monthly payroll" />
        <div className="text-center py-20 text-muted-foreground">Loading payroll...</div>
      </div>
    );
  }

  // Calculate next MPF payment deadline (10th of next month)
  const getNextMPFDeadline = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // MPF payment is due on the 10th of the following month
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    
    const deadline = new Date(nextMonthYear, nextMonth, 10);
    return deadline;
  };

  const nextMPFDeadline = getNextMPFDeadline();
  const daysUntilDeadline = differenceInDays(nextMPFDeadline, new Date());
  const isDeadlineClose = daysUntilDeadline <= 7;
  const isDeadlineCritical = daysUntilDeadline <= 3;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Processing"
        description="Process your monthly payroll and MPF contributions"
        actions={
          <div className="flex gap-2">
            <Link href="/payroll-history">
              <Button variant="outline" className="hk-btn hk-btn-o">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hk-btn hk-btn-n">
                  <Plus className="w-4 h-4 mr-2" />
                  New Payroll Run
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Payroll Run</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  <div className="hk-grid hk-g3">
                    <div className="hk-fg">
                      <Label htmlFor="periodStart">Period Start *</Label>
                      <Input
                        id="periodStart"
                        type="date"
                        value={formData.periodStart}
                        onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                        required
                        className="hk-input"
                      />
                    </div>
                    <div className="hk-fg">
                      <Label htmlFor="periodEnd">Period End *</Label>
                      <Input
                        id="periodEnd"
                        type="date"
                        value={formData.periodEnd}
                        onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                        required
                        className="hk-input"
                      />
                    </div>
                    <div className="hk-fg">
                      <Label htmlFor="paymentDate">Payment Date *</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        required
                        className="hk-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Select Employees to Include</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleAllEmployees}
                        className="hk-btn hk-btn-o hk-btn-s"
                      >
                        {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="border border-border rounded-lg">
                      <table className="hk-table">
                        <thead>
                          <tr>
                            <th className="w-12">
                              <Checkbox
                                checked={employees.length > 0 && selectedEmployees.length === employees.length}
                                onCheckedChange={toggleAllEmployees}
                              />
                            </th>
                            <th>Code</th>
                            <th>Name</th>
                            <th className="hk-nm">Basic Salary</th>
                            <th>MPF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted-foreground py-8">
                                No active employees. Please add employees first.
                              </td>
                            </tr>
                          ) : (
                            employees.map((emp) => (
                              <tr key={emp.id}>
                                <td>
                                  <Checkbox
                                    checked={selectedEmployees.includes(emp.id)}
                                    onCheckedChange={() => toggleEmployee(emp.id)}
                                  />
                                </td>
                                <td className="font-mono text-primary">{emp.code}</td>
                                <td className="font-medium text-foreground">{emp.name}</td>
                                <td className="hk-nm font-mono text-foreground">{formatMoney(emp.basicSalary, "HKD")}</td>
                                <td>
                                  <span className={emp.mpfExempt ? "text-muted-foreground" : "text-emerald-500"}>
                                    {emp.mpfExempt ? "Exempt" : "Required"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="hk-btn hk-btn-o">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={selectedEmployees.length === 0} className="hk-btn hk-btn-n">
                      Create Payroll Run
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* MPF Payment Deadline Reminder */}
      <div className={`hk-alert ${isDeadlineCritical ? "hk-a-red" : isDeadlineClose ? "hk-a-orange" : "hk-a-blue"}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${isDeadlineCritical ? "text-red-500" : isDeadlineClose ? "text-orange-500" : "text-blue-500"}`} />
          <div className="flex-1">
            <div className="font-semibold text-foreground mb-1">
              MPF Payment Deadline Reminder
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Next MPF contribution payment is due on <strong>{format(nextMPFDeadline, "MMMM d, yyyy")}</strong> (10th of following month).
              {daysUntilDeadline > 0 ? (
                <span> You have <strong>{daysUntilDeadline} day{daysUntilDeadline !== 1 ? "s" : ""}</strong> remaining.</span>
              ) : (
                <span className="text-red-500 font-semibold"> The deadline has passed! Please make payment immediately to avoid penalties.</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <strong>HK MPF Regulations:</strong> Monthly contributions must be paid to MPF trustees by the 10th day of the following month. 
              Penalties: HK$5,000 fine per employee + interest on arrears. Employees earning less than HK$7,100 are exempt from employee contributions.
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`hk-badge ${isDeadlineCritical ? "hk-b-red" : isDeadlineClose ? "hk-b-orange" : "hk-b-blue"}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {daysUntilDeadline > 0 ? `${daysUntilDeadline}d left` : "OVERDUE"}
            </div>
            <Link href="/mpf">
              <Button size="sm" className={`hk-btn ${isDeadlineCritical ? "hk-btn-r" : isDeadlineClose ? "hk-btn-o" : "hk-btn-b"}`}>
                View MPF Details
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {payrollRuns.length === 0 ? (
          <div className="hk-card">
            <div className="text-center py-12 text-muted-foreground">
              No payroll runs yet. Click "New Payroll Run" to get started.
            </div>
          </div>
        ) : (
          payrollRuns.map((payroll) => (
            <div className="hk-card" key={payroll.id}>
              <div className="hk-card-h flex flex-row items-center justify-between pb-2">
                <div>
                  <h3>{payroll.runNumber}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)} | Payment: {formatDate(payroll.paymentDate)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`hk-badge ${
                    payroll.status === "APPROVED" ? "hk-b-green" :
                    payroll.status === "PAID" ? "hk-b-blue" :
                    "hk-b-yellow"
                  }`}>
                    {payroll.status}
                  </span>
                  {payroll.status === "DRAFT" && (
                    <Button onClick={() => handleApprove(payroll.id)} className="hk-btn hk-btn-gr">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}
                  {payroll.status === "APPROVED" && (
                    <Button onClick={() => handleMarkAsPaid(payroll.id)} className="hk-btn hk-btn-g">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <div className="hk-grid hk-g5 mb-6">
                  <div className="hk-stat">
                    <div className="lb">Gross Pay</div>
                    <div className="vl">{formatMoney(payroll.totalGrossPay, "HKD")}</div>
                  </div>
                  <div className="hk-stat">
                    <div className="lb">Employee MPF</div>
                    <div className="vl" style={{ color: "var(--red)" }}>{formatMoney(payroll.totalEmployeeMpf, "HKD")}</div>
                  </div>
                  <div className="hk-stat">
                    <div className="lb">Employer MPF</div>
                    <div className="vl" style={{ color: "var(--orange)" }}>{formatMoney(payroll.totalEmployerMpf, "HKD")}</div>
                  </div>
                  <div className="hk-stat">
                    <div className="lb">Net Pay</div>
                    <div className="vl" style={{ color: "var(--green)" }}>{formatMoney(payroll.totalNetPay, "HKD")}</div>
                  </div>
                  <div className="hk-stat">
                    <div className="lb">Total Cost</div>
                    <div className="vl" style={{ color: "var(--navy)" }}>{formatMoney(payroll.totalCost, "HKD")}</div>
                  </div>
                </div>

                <div className="hk-tw">
                  <table className="hk-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>HKID</th>
                        <th className="hk-nm">Basic</th>
                        <th className="hk-nm">Housing</th>
                        <th className="hk-nm">Gross</th>
                        <th className="hk-nm">EE MPF</th>
                        <th className="hk-nm">Net</th>
                        <th className="hk-nm">ER MPF</th>
                        <th className="hk-nm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payroll.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="font-medium">{line.employee.name}</td>
                          <td className="font-mono text-sm">{line.employee.hkid || "-"}</td>
                          <td className="hk-nm font-mono">{formatMoney(line.basicSalary, "HKD")}</td>
                          <td className="hk-nm font-mono">{formatMoney(line.housingAllowance, "HKD")}</td>
                          <td className="hk-nm font-mono" style={{ fontWeight: "bold" }}>{formatMoney(line.grossPay, "HKD")}</td>
                          <td className="hk-nm font-mono" style={{ color: "var(--red)" }}>{formatMoney(line.employeeMpf, "HKD")}</td>
                          <td className="hk-nm font-mono" style={{ color: "var(--green)", fontWeight: "bold" }}>{formatMoney(line.netPay, "HKD")}</td>
                          <td className="hk-nm font-mono" style={{ color: "var(--orange)" }}>{formatMoney(line.employerMpf, "HKD")}</td>
                          <td className="hk-nm font-mono" style={{ fontWeight: "bold" }}>{formatMoney(line.totalCost, "HKD")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
