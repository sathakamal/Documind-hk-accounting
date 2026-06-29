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
import { Plus, CheckCircle2, History } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Employee {
  id: string;
  code: string;
  name: string;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payroll Processing" description="Process your monthly payroll" />
        <div className="text-center py-20 text-muted-foreground">Loading payroll...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Processing"
        description="Process your monthly payroll and MPF contributions"
        actions={
          <div className="flex gap-2">
            <Link href="/payroll-history">
              <Button variant="outline">
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </Link>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Payroll Run
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Payroll Run</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="periodStart">Period Start *</Label>
                      <Input
                        id="periodStart"
                        type="date"
                        value={formData.periodStart}
                        onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="periodEnd">Period End *</Label>
                      <Input
                        id="periodEnd"
                        type="date"
                        value={formData.periodEnd}
                        onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentDate">Payment Date *</Label>
                      <Input
                        id="paymentDate"
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        required
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
                      >
                        {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    <div className="border border-border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border">
                            <TableHead className="w-12">
                              <Checkbox
                                checked={employees.length > 0 && selectedEmployees.length === employees.length}
                                onCheckedChange={toggleAllEmployees}
                              />
                            </TableHead>
                            <TableHead className="text-muted-foreground">Code</TableHead>
                            <TableHead className="text-muted-foreground">Name</TableHead>
                            <TableHead className="text-muted-foreground text-right">Basic Salary</TableHead>
                            <TableHead className="text-muted-foreground">MPF</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employees.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No active employees. Please add employees first.
                              </TableCell>
                            </TableRow>
                          ) : (
                            employees.map((emp) => (
                              <TableRow key={emp.id} className="border-border">
                                <TableCell>
                                  <Checkbox
                                    checked={selectedEmployees.includes(emp.id)}
                                    onCheckedChange={() => toggleEmployee(emp.id)}
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-primary">{emp.code}</TableCell>
                                <TableCell className="font-medium text-foreground">{emp.name}</TableCell>
                                <TableCell className="text-right font-mono text-foreground">{formatMoney(emp.basicSalary, "HKD")}</TableCell>
                                <TableCell>
                                  <span className={emp.mpfExempt ? "text-muted-foreground" : "text-emerald-500"}>
                                    {emp.mpfExempt ? "Exempt" : "Required"}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={selectedEmployees.length === 0}>
                      Create Payroll Run
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="space-y-6">
        {payrollRuns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              No payroll runs yet. Click "New Payroll Run" to get started.
            </CardContent>
          </Card>
        ) : (
          payrollRuns.map((payroll) => (
            <Card key={payroll.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>{payroll.runNumber}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(payroll.periodStart)} - {formatDate(payroll.periodEnd)} | Payment: {formatDate(payroll.paymentDate)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    payroll.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-500" :
                    payroll.status === "PAID" ? "bg-blue-500/20 text-blue-500" :
                    "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {payroll.status}
                  </span>
                  {payroll.status === "DRAFT" && (
                    <Button onClick={() => handleApprove(payroll.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Gross Pay</p>
                    <p className="text-lg font-mono font-bold">{formatMoney(payroll.totalGrossPay, "HKD")}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Employee MPF</p>
                    <p className="text-lg font-mono font-bold text-destructive">{formatMoney(payroll.totalEmployeeMpf, "HKD")}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Employer MPF</p>
                    <p className="text-lg font-mono font-bold text-orange-500">{formatMoney(payroll.totalEmployerMpf, "HKD")}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Net Pay</p>
                    <p className="text-lg font-mono font-bold text-emerald-500">{formatMoney(payroll.totalNetPay, "HKD")}</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-lg font-mono font-bold text-primary">{formatMoney(payroll.totalCost, "HKD")}</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-secondary">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="text-right">Basic</TableHead>
                        <TableHead className="text-right">Housing</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">EE MPF</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-right">ER MPF</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payroll.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-medium">{line.employee.name}</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(line.basicSalary, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(line.housingAllowance, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono font-bold">{formatMoney(line.grossPay, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono text-destructive">{formatMoney(line.employeeMpf, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-500">{formatMoney(line.netPay, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono text-orange-500">{formatMoney(line.employerMpf, "HKD")}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-primary">{formatMoney(line.totalCost, "HKD")}</TableCell>
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
