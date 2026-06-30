"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, Trash2, Edit, Eye, CheckCircle, XCircle, User, Building, Calendar, CreditCard } from "lucide-react";
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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

  const handleSeed = async () => {
    try {
      toast.info("Seeding demo payroll data...");
      const res = await fetch("/api/seed-payroll", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        
        // Sync to HKFRS LocalStorage Dashboard State
        const saved = localStorage.getItem("hkpro3_next");
        if (saved && data.data?.employees) {
          try {
            const D = JSON.parse(saved);
            const seeded = data.data.employees;
            
            // Map DB employees to Dashboard schema
            const newEmployees = seeded.map((emp: any) => ({
              id: emp.id,
              name: emp.name,
              hkid: emp.hkid || "N/A",
              pos: emp.position,
              dept: emp.department,
              start: emp.startDate.split('T')[0],
              sal: parseFloat(emp.basicSalary),
              housing: parseFloat(emp.housingAllowance || 0),
              mpfEx: emp.mpfExempt ? "yes" : "no",
              st: emp.status
            }));

            // Replace or merge? Let's merge and avoid duplicates by name
            const existingNames = new Set(D.employees.map((e: any) => e.name));
            const toAdd = newEmployees.filter((e: any) => !existingNames.has(e.name));
            
            D.employees = [...toAdd, ...D.employees];
            localStorage.setItem("hkpro3_next", JSON.stringify(D));
            toast.info("Dashboard employee records updated");
          } catch (e) {
            console.error("Sync to local storage failed", e);
          }
        }
        
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to seed data");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
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
        setIsAddDialogOpen(false);
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PUT",
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
        toast.success("Employee updated successfully");
        setIsEditDialogOpen(false);
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to update employee");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Employee deleted successfully");
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to delete employee");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    
    try {
      const res = await fetch(`/api/employees/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Employee status changed to ${newStatus}`);
        fetchEmployees();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Failed to update employee status");
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      hkid: employee.hkid || "",
      position: employee.position || "",
      department: employee.department || "",
      startDate: employee.startDate.split('T')[0],
      basicSalary: employee.basicSalary.toString(),
      housingAllowance: employee.housingAllowance.toString(),
      mpfExempt: employee.mpfExempt ? "yes" : "no",
      notes: employee.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const calculateMPF = (salary: number, mpfExempt: boolean) => {
    if (mpfExempt) return 0;
    
    const MPF_THRESHOLD_MIN = 7100;
    const MPF_THRESHOLD_MAX = 30000;
    const MPF_RATE = 0.05;
    const STATUTORY_CAP = 1500;
    
    if (salary < MPF_THRESHOLD_MIN) {
      return 0;
    } else if (salary <= MPF_THRESHOLD_MAX) {
      return salary * MPF_RATE;
    } else {
      return STATUTORY_CAP;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Records" description="Manage your employee records" />
        <div className="text-center py-20 text-muted-foreground">Loading employees...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Records"
        description="Manage your employee records, MPF contributions, and employment details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Are you sure you want to seed demo employees?")) {
                  handleSeed();
                }
              }}
            >
              Seed Demo Data
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0a1628] hover:bg-[#112240]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                  <div className="hk-fr hk-fr4">
                    <div className="hk-fg">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="hk-fg">
                      <Label htmlFor="hkid">HKID</Label>
                      <Input
                        id="hkid"
                        value={formData.hkid}
                        onChange={(e) => setFormData({ ...formData, hkid: e.target.value })}
                        placeholder="A123456(7)"
                      />
                    </div>
                    <div className="hk-fg">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="Accountant"
                      />
                    </div>
                    <div className="hk-fg">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Finance"
                      />
                    </div>
                    <div className="hk-fg">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="hk-fg">
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
                    <div className="hk-fg">
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
                    <div className="hk-fg">
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
                  <div className="hk-fg">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#0a1628] hover:bg-[#112240]">
                      Add Employee
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Employee Statistics */}
      <div className="hk-grid hk-g4">
        <div className="hk-stat" style={{ "--c": "#0a1628" } as any}>
          <div className="lb">Total Employees</div>
          <div className="vl">{employees.length}</div>
          <div className="sub">All registered staff</div>
          <div className="si">👥</div>
        </div>
        
        <div className="hk-stat" style={{ "--c": "#10b981" } as any}>
          <div className="lb">Active</div>
          <div className="vl">{employees.filter(e => e.status === "ACTIVE").length}</div>
          <div className="sub">Currently employed</div>
          <div className="si">✅</div>
        </div>
        
        <div className="hk-stat" style={{ "--c": "#6b7280" } as any}>
          <div className="lb">Inactive</div>
          <div className="vl">{employees.filter(e => e.status === "INACTIVE").length}</div>
          <div className="sub">Former staff</div>
          <div className="si">⏸️</div>
        </div>
        
        <div className="hk-stat" style={{ "--c": "#f59e0b" } as any}>
          <div className="lb">MPF Exempt</div>
          <div className="vl">{employees.filter(e => e.mpfExempt).length}</div>
          <div className="sub">No MPF required</div>
          <div className="si">💳</div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>Employee List</h3>
          <div className="flex gap-2">
            <button className="hk-btn hk-btn-o hk-btn-s">
              Export CSV
            </button>
          </div>
        </div>
        <div className="hk-tw">
          {employees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No employees yet. Click "Add Employee" to get started.
            </div>
          ) : (
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>HKID</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Start Date</th>
                  <th className="hk-nm">Basic Salary</th>
                  <th>MPF Contributions</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const mpfContribution = calculateMPF(emp.basicSalary, emp.mpfExempt);
                  
                  return (
                    <tr key={emp.id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {emp.name}
                        </div>
                      </td>
                      <td className="font-mono text-sm">{emp.hkid || "-"}</td>
                      <td>
                        <span className={`hk-badge ${emp.position ? "hk-b-blue" : "hk-b-gray"}`}>
                          {emp.position || "-"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {emp.department || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(emp.startDate)}
                        </div>
                      </td>
                      <td className="hk-nm font-bold">
                        {formatMoney(emp.basicSalary, "HKD")}
                      </td>
                      <td>
                        {emp.mpfExempt ? (
                          <span className="hk-badge hk-b-gray">Exempt</span>
                        ) : (
                          <span className="hk-badge hk-b-green">{formatMoney(mpfContribution, "HKD")}</span>
                        )}
                      </td>
                      <td>
                        <span className={`hk-badge ${emp.status === "ACTIVE" ? "hk-b-green" : "hk-b-gray"}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="hk-btn hk-btn-b hk-btn-s"
                            onClick={() => openViewDialog(emp)}
                            title="View Details"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            className="hk-btn hk-btn-gr hk-btn-s"
                            onClick={() => openEditDialog(emp)}
                            title="Edit"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            className="hk-btn hk-btn-g hk-btn-s"
                            onClick={() => handleToggleStatus(emp.id, emp.status)}
                            title={emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          >
                            {emp.status === "ACTIVE" ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            className="hk-btn hk-btn-r hk-btn-s"
                            onClick={() => handleDelete(emp.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee: {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="hk-fr hk-fr4">
              <div className="hk-fg">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-hkid">HKID</Label>
                <Input
                  id="edit-hkid"
                  value={formData.hkid}
                  onChange={(e) => setFormData({ ...formData, hkid: e.target.value })}
                  placeholder="A123456(7)"
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Accountant"
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Finance"
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-basicSalary">Basic Salary (HKD) *</Label>
                <Input
                  id="edit-basicSalary"
                  type="number"
                  step="0.01"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  placeholder="25000"
                  required
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-housingAllowance">Housing Allowance (HKD)</Label>
                <Input
                  id="edit-housingAllowance"
                  type="number"
                  step="0.01"
                  value={formData.housingAllowance}
                  onChange={(e) => setFormData({ ...formData, housingAllowance: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="hk-fg">
                <Label htmlFor="edit-mpfExempt">MPF Status</Label>
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
            <div className="hk-fg">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0a1628] hover:bg-[#112240]">
                Update Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details: {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6 pt-4">
              <div className="hk-grid hk-g2">
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Employee Code</Label>
                  <div className="font-mono font-bold text-primary">{selectedEmployee.code}</div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">HKID</Label>
                  <div className="font-mono">{selectedEmployee.hkid || "-"}</div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Position</Label>
                  <div>
                    <span className={`hk-badge ${selectedEmployee.position ? "hk-b-blue" : "hk-b-gray"}`}>
                      {selectedEmployee.position || "-"}
                    </span>
                  </div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {selectedEmployee.department || "-"}
                  </div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(selectedEmployee.startDate)}
                  </div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div>
                    <span className={`hk-badge ${selectedEmployee.status === "ACTIVE" ? "hk-b-green" : "hk-b-gray"}`}>
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Basic Salary</Label>
                  <div className="font-mono font-bold">{formatMoney(selectedEmployee.basicSalary, "HKD")}</div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Housing Allowance</Label>
                  <div className="font-mono">
                    {selectedEmployee.housingAllowance > 0 ? formatMoney(selectedEmployee.housingAllowance, "HKD") : "-"}
                  </div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">MPF Contribution</Label>
                  <div>
                    {selectedEmployee.mpfExempt ? (
                      <span className="hk-badge hk-b-gray">Exempt</span>
                    ) : (
                      <span className="hk-badge hk-b-green">
                        {formatMoney(calculateMPF(selectedEmployee.basicSalary, selectedEmployee.mpfExempt), "HKD")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Total Compensation</Label>
                  <div className="font-mono font-bold text-primary">
                    {formatMoney(selectedEmployee.basicSalary + selectedEmployee.housingAllowance, "HKD")}
                  </div>
                </div>
              </div>
              
              {selectedEmployee.notes && (
                <div className="hk-fg">
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                    {selectedEmployee.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}