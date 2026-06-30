"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Filter, Download, Info, Shield, Clock, User } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure" | "warning";
  recordId?: string;
}

export default function AuditTrailPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "1",
      timestamp: "2026-06-30 14:30:25",
      user: "admin@documind.hk",
      action: "CREATE",
      module: "Payroll",
      details: "Created payroll run PR-2026-07-02 for period 2026-05-31 to 2026-06-29",
      ipAddress: "203.185.46.88",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      status: "success",
      recordId: "PR-2026-07-02"
    },
    {
      id: "2",
      timestamp: "2026-06-30 14:28:10",
      user: "admin@documind.hk",
      action: "APPROVE",
      module: "Payroll",
      details: "Approved payroll run PR-2026-07-02, total HK$125,000",
      ipAddress: "203.185.46.88",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      status: "success",
      recordId: "PR-2026-07-02"
    },
    {
      id: "3",
      timestamp: "2026-06-30 14:25:45",
      user: "accountant@documind.hk",
      action: "UPDATE",
      module: "Chart of Accounts",
      details: "Updated account 5000 - Salaries & Wages balance to HK$450,000",
      ipAddress: "203.185.46.92",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      status: "success",
      recordId: "5000"
    },
    {
      id: "4",
      timestamp: "2026-06-30 14:20:15",
      user: "admin@documind.hk",
      action: "DELETE",
      module: "Employees",
      details: "Deleted employee record for Chan Tai Man (ID: EMP-003)",
      ipAddress: "203.185.46.88",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      status: "success",
      recordId: "EMP-003"
    },
    {
      id: "5",
      timestamp: "2026-06-30 14:18:30",
      user: "auditor@skchan.com",
      action: "VIEW",
      module: "Financial Reports",
      details: "Viewed Profit & Loss statement for period 2026-01-01 to 2026-06-30",
      ipAddress: "58.153.12.45",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0",
      status: "success"
    },
    {
      id: "6",
      timestamp: "2026-06-30 14:15:00",
      user: "accountant@documind.hk",
      action: "CREATE",
      module: "Journal Entries",
      details: "Created journal entry JE-2026-006 for office rent payment",
      ipAddress: "203.185.46.92",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS OS X 10_15_7) AppleWebKit/537.36",
      status: "success",
      recordId: "JE-2026-006"
    },
    {
      id: "7",
      timestamp: "2026-06-30 14:10:20",
      user: "admin@documind.hk",
      action: "LOGIN",
      module: "Authentication",
      details: "User logged in from Hong Kong",
      ipAddress: "203.185.46.88",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      status: "success"
    },
    {
      id: "8",
      timestamp: "2026-06-30 14:05:45",
      user: "unknown@external.com",
      action: "LOGIN",
      module: "Authentication",
      details: "Failed login attempt - invalid credentials",
      ipAddress: "112.65.12.78",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      status: "failure"
    }
  ]);

  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(auditLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modules, setModules] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  // Extract unique modules and actions
  useEffect(() => {
    const uniqueModules = Array.from(new Set(auditLogs.map(log => log.module)));
    const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
    
    setModules(uniqueModules);
    setActions(uniqueActions);
  }, [auditLogs]);

  // Apply filters
  useEffect(() => {
    let filtered = auditLogs;

    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.module.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        (log.recordId && log.recordId.toLowerCase().includes(term))
      );
    }

    // Module filter
    if (filterModule !== "all") {
      filtered = filtered.filter(log => log.module === filterModule);
    }

    // Action filter
    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, filterModule, filterAction, filterStatus, auditLogs]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "success": return "bg-green-100 text-green-800";
      case "failure": return "bg-red-100 text-red-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case "CREATE": return "bg-blue-100 text-blue-800";
      case "UPDATE": return "bg-yellow-100 text-yellow-800";
      case "DELETE": return "bg-red-100 text-red-800";
      case "VIEW": return "bg-gray-100 text-gray-800";
      case "LOGIN": return "bg-purple-100 text-purple-800";
      case "APPROVE": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-HK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ["Timestamp", "User", "Action", "Module", "Details", "IP Address", "Status", "Record ID"],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.user,
        log.action,
        log.module,
        log.details,
        log.ipAddress,
        log.status,
        log.recordId || ""
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getModuleIcon = (module: string) => {
    switch(module) {
      case "Payroll": return "💵";
      case "Chart of Accounts": return "📋";
      case "Employees": return "👥";
      case "Financial Reports": return "📊";
      case "Authentication": return "🔐";
      case "Journal Entries": return "📝";
      default: return "📁";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-muted-foreground">
            Immutable Activity Log with 7-Year Retention (Cap. 622)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Legal Requirement:</strong> Companies Ordinance (Cap. 622) requires all companies to maintain 
          proper books of account and records for at least 7 years. This audit trail provides an immutable log 
          of all user activities for compliance and security monitoring.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Log Filters
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {filteredLogs.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger>
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module} value={module}>
                      {getModuleIcon(module)} {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        {formatDate(log.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{log.user}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getModuleIcon(log.module)}</span>
                        <span>{log.module}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.details}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <div className="text-lg font-semibold text-gray-500">No audit logs found</div>
              <div className="text-sm text-gray-400">Try adjusting your filters or search term</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail Compliance Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Legal Requirements (Cap. 622)</h4>
                <ul className="text-sm space-y-2">
                  <li>
                    • <strong>Section 373:</strong> Every company must keep proper books of account
                  </li>
                  <li>
                    • <strong>Section 374:</strong> Records must be kept for at least 7 years
                  </li>
                  <li>
                    • <strong>Section 405:</strong> Financial statements must be audited annually
                  </li>
                  <li>
                    • <strong>Penalty:</strong> Up to HK$300,000 for non-compliance
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Audit Trail Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• Immutable log - cannot be altered or deleted</li>
                  <li>• Timestamped with user and IP address</li>
                  <li>• Detailed action descriptions</li>
                  <li>• Module-based categorization</li>
                  <li>• Status tracking (success/failure/warning)</li>
                  <li>• 7-year retention period</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Security Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• User authentication tracking</li>
                  <li>• IP address logging</li>
                  <li>• User agent tracking</li>
                  <li>• Failed login monitoring</li>
                  <li>• Sensitive action alerts</li>
                  <li>• Data integrity verification</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">Compliance Monitoring</h4>
                <ul className="text-sm space-y-1">
                  <li>• Regular audit log reviews</li>
                  <li>• Suspicious activity alerts</li>
                  <li>• Access pattern analysis</li>
                  <li>• Compliance reporting</li>
                  <li>• Retention period monitoring</li>
                  <li>• Data backup verification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Retention & Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">7</span>
                </div>
                <div>
                  <h4 className="font-semibold">Retention Period</h4>
                  <p className="text-xs text-muted-foreground">Minimum 7 years</p>
                </div>
              </div>
              <p className="text-sm">
                All audit logs must be retained for at least 7 years as required by Cap. 622.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">🔒</span>
                </div>
                <div>
                  <h4 className="font-semibold">Data Integrity</h4>
                  <p className="text-xs text-muted-foreground">Immutable records</p>
                </div>
              </div>
              <p className="text-sm">
                Audit logs are cryptographically secured and cannot be altered or deleted.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600">📊</span>
                </div>
                <div>
                  <h4 className="font-semibold">Monitoring</h4>
                  <p className="text-xs text-muted-foreground">Real-time alerts</p>
                </div>
              </div>
              <p className="text-sm">
                Automated monitoring for suspicious activities and compliance violations.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold mb-2">Important Compliance Notes:</h3>
            <ul className="text-sm space-y-1">
              <li>• Audit logs must be reviewed regularly for suspicious activities</li>
              <li>• Access to audit logs should be restricted to authorized personnel only</li>
              <li>• Regular backups of audit logs must be maintained</li>
              <li>• Audit log integrity must be verified periodically</li>
              <li>• Retention period compliance must be monitored</li>
              <li>• Audit trail must be available for inspection by authorities</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-green-50 border-green-200">
        <AlertDescription>
          <strong>Important:</strong> This audit trail provides a comprehensive log of all user activities 
          for compliance with HK Companies Ordinance (Cap. 622). Ensure regular reviews, proper retention, 
          and integrity verification to maintain compliance status.
        </AlertDescription>
      </Alert>
    </div>
  );
}