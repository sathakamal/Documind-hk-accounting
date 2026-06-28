"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  code: string;
  name: string;
  hkid: string | null;
  position: string | null;
  department: string | null;
  startDate: string;
  basicSalary: number;
  housingAllowance: number;
  mpfExempt: boolean;
  status: string;
  notes: string | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    hkid: "",
    position: "",
    department: "",
    startDate: new Date().toISOString().split("T")[0],
    basicSalary: "",
    housingAllowance: "",
    mpfExempt: "no",
    notes: "",
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      }
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basicSalary: parseFloat(formData.basicSalary),
          housingAllowance: parseFloat(formData.housingAllowance) || 0,
          mpfExempt: formData.mpfExempt === "yes",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Employee added successfully");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          hkid: "",
          position: "",
          department: "",
          startDate: new Date().toISOString().split("T")[0],
          basicSalary: "",
          housingAllowance: "",
          mpfExempt: "no",
          notes: "",
        });
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to add employee");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employees" description="Manage your employee records" />
        <div className="text-center py-20 text-muted-foreground">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your employee records"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hkid">HKID</Label>
                    <Input
                      id="hkid"
                      value={formData.hkid}
                      onChange={(e) => setFormData({ ...formData, hkid: e.target.value })}
                      placeholder="A123456(7)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      placeholder="Accountant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Finance"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basicSalary">Basic Salary (HKD) *</Label>
                    <Input
                      id="basicSalary"
                      type="number"
                      step="0.01"
                      value={formData.basicSalary}
                      onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                      placeholder="25000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="housingAllowance">Housing Allowance (HKD)</Label>
                    <Input
                      id="housingAllowance"
                      type="number"
                      step="0.01"
                      value={formData.housingAllowance}
                      onChange={(e) => setFormData({ ...formData, housingAllowance: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mpfExempt">MPF Status</Label>
                    <Select
                      value={formData.mpfExempt}
                      onValueChange={(val) => setFormData({ ...formData, mpfExempt: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">Required (EE/ER 5%)</SelectItem>
                        <SelectItem value="yes">Exempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Add Employee
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="bg-[#1e2130] border-border">
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No employees yet. Click "Add Employee" to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Code</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Position</TableHead>
                  <TableHead className="text-muted-foreground">Department</TableHead>
                  <TableHead className="text-muted-foreground text-right">Basic Salary</TableHead>
                  <TableHead className="text-muted-foreground">MPF</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className="border-border">
                    <TableCell className="font-mono text-primary">{emp.code}</TableCell>
                    <TableCell className="font-medium text-foreground">{emp.name}</TableCell>
                    <TableCell className="text-muted-foreground">{emp.position || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{emp.department || "-"}</TableCell>
                    <TableCell className="text-right font-mono text-foreground">{formatMoney(emp.basicSalary, "HKD")}</TableCell>
                    <TableCell>
                      <span className={`${emp.mpfExempt ? "text-muted-foreground" : "text-emerald-500"}`}>
                        {emp.mpfExempt ? "Exempt" : "Required"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`${emp.status === "ACTIVE" ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {emp.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
