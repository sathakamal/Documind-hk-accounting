"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Bell } from "lucide-react";
import { format, addDays, differenceInDays, isBefore, isAfter } from "date-fns";

interface HKDeadline {
  id: string;
  title: string;
  description: string;
  agency: "IRD" | "CR" | "MPFA" | "Labour" | "Customs" | "Others";
  formNumber: string;
  dueDate: Date;
  filingPeriod: string;
  frequency: "Monthly" | "Quarterly" | "Annually" | "Bi-annually" | "Ad-hoc";
  status: "pending" | "submitted" | "overdue" | "upcoming";
  penaltyAmount?: number;
  penaltyDescription?: string;
  submissionDate?: Date;
  reminderDays: number;
  importance: "critical" | "high" | "medium" | "low";
  notes?: string;
}

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<HKDeadline[]>([
    {
      id: "1",
      title: "Employer's Return of Remuneration & Pensions",
      description: "IR56B Form - Annual return of employee remuneration",
      agency: "IRD",
      formNumber: "IR56B",
      dueDate: new Date(new Date().getFullYear(), 3, 30), // April 30
      filingPeriod: `Year ended ${new Date().getFullYear() - 1}-12-31`,
      frequency: "Annually",
      status: "pending",
      penaltyAmount: 10000,
      penaltyDescription: "HK$10,000 fine + additional penalties for late submission",
      reminderDays: 30,
      importance: "critical"
    },
    {
      id: "2",
      title: "Profits Tax Return",
      description: "BIR51 Form - Corporation profits tax return",
      agency: "IRD",
      formNumber: "BIR51",
      dueDate: new Date(new Date().getFullYear(), 10, 15), // November 15
      filingPeriod: `Year ended ${new Date().getFullYear() - 1}-03-31`,
      frequency: "Annually",
      status: "pending",
      penaltyAmount: 5000,
      penaltyDescription: "HK$5,000 fine + 5% surcharge on tax payable",
      reminderDays: 45,
      importance: "critical"
    },
    {
      id: "3",
      title: "MPF Contribution Payment",
      description: "Monthly MPF contributions for employees",
      agency: "MPFA",
      formNumber: "MPF-SS",
      dueDate: addDays(new Date(), 10), // 10 days from now
      filingPeriod: `Month ended ${format(new Date(), 'yyyy-MM')}`,
      frequency: "Monthly",
      status: "upcoming",
      penaltyAmount: 5000,
      penaltyDescription: "HK$5,000 fine per employee + interest on arrears",
      reminderDays: 7,
      importance: "high"
    },
    {
      id: "4",
      title: "Business Registration Renewal",
      description: "Annual business registration certificate renewal",
      agency: "CR",
      formNumber: "BRN-1",
      dueDate: new Date(new Date().getFullYear(), 0, 31), // January 31
      filingPeriod: `Year ${new Date().getFullYear()}`,
      frequency: "Annually",
      status: "submitted",
      submissionDate: new Date(new Date().getFullYear(), 0, 15),
      reminderDays: 60,
      importance: "high"
    },
    {
      id: "5",
      title: "Annual Return (NAR1)",
      description: "Company annual return to Companies Registry",
      agency: "CR",
      formNumber: "NAR1",
      dueDate: new Date(new Date().getFullYear(), 5, 30), // June 30
      filingPeriod: `Year ended ${new Date().getFullYear() - 1}-12-31`,
      frequency: "Annually",
      status: "pending",
      penaltyAmount: 3480,
      penaltyDescription: "HK$3,480 penalty for late filing",
      reminderDays: 90,
      importance: "high"
    },
    {
      id: "6",
      title: "Salaries Tax Return",
      description: "Individual salaries tax return (employees earning > HK$132,000)",
      agency: "IRD",
      formNumber: "BIR60",
      dueDate: new Date(new Date().getFullYear(), 5, 1), // June 1
      filingPeriod: `Year ended ${new Date().getFullYear() - 1}-03-31`,
      frequency: "Annually",
      status: "overdue",
      penaltyAmount: 10000,
      penaltyDescription: "HK$10,000 fine + additional tax assessment",
      reminderDays: 30,
      importance: "critical"
    },
    {
      id: "7",
      title: "Property Tax Return",
      description: "Property tax return for rental income",
      agency: "IRD",
      formNumber: "BIR57",
      dueDate: new Date(new Date().getFullYear(), 3, 30), // April 30
      filingPeriod: `Year ended ${new Date().getFullYear() - 1}-03-31`,
      frequency: "Annually",
      status: "pending",
      penaltyAmount: 5000,
      penaltyDescription: "HK$5,000 fine + 5% surcharge",
      reminderDays: 30,
      importance: "medium"
    },
    {
      id: "8",
      title: "Stamp Duty Payment",
      description: "Stamp duty on property transactions",
      agency: "IRD",
      formNumber: "IRSD111A",
      dueDate: addDays(new Date(), 30), // 30 days from execution
      filingPeriod: "Upon execution of agreement",
      frequency: "Ad-hoc",
      status: "upcoming",
      penaltyAmount: 10000,
      penaltyDescription: "HK$10,000 fine + 10x stamp duty",
      reminderDays: 14,
      importance: "high"
    }
  ]);

  const [filterAgency, setFilterAgency] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterImportance, setFilterImportance] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<HKDeadline[]>([]);
  const [overdueDeadlines, setOverdueDeadlines] = useState<HKDeadline[]>([]);
  const [complianceScore, setComplianceScore] = useState<number>(0);

  // Calculate compliance metrics
  useEffect(() => {
    const totalDeadlines = deadlines.length;
    const submittedDeadlines = deadlines.filter(d => d.status === "submitted").length;
    const pendingDeadlines = deadlines.filter(d => d.status === "pending").length;
    const overdueDeadlines = deadlines.filter(d => d.status === "overdue").length;
    
    // Calculate compliance score (submitted + pending that are not overdue)
    const compliantCount = submittedDeadlines + pendingDeadlines;
    const score = totalDeadlines > 0 ? Math.round((compliantCount / totalDeadlines) * 100) : 100;
    setComplianceScore(score);

    // Get upcoming deadlines (within next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    const upcoming = deadlines.filter(d => 
      d.status === "pending" && 
      isBefore(d.dueDate, thirtyDaysFromNow) && 
      isAfter(d.dueDate, today)
    );
    setUpcomingDeadlines(upcoming);

    // Get overdue deadlines
    const overdue = deadlines.filter(d => 
      d.status === "overdue" || 
      (d.status === "pending" && isBefore(d.dueDate, today))
    );
    setOverdueDeadlines(overdue);
  }, [deadlines]);

  const filteredDeadlines = deadlines.filter(deadline => {
    if (filterAgency !== "all" && deadline.agency !== filterAgency) return false;
    if (filterStatus !== "all" && deadline.status !== filterStatus) return false;
    if (filterImportance !== "all" && deadline.importance !== filterImportance) return false;
    if (searchTerm && !deadline.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !deadline.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !deadline.formNumber.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "submitted":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Submitted</Badge>;
      case "overdue":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
      case "upcoming":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAgencyBadge = (agency: string) => {
    switch (agency) {
      case "IRD":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">IRD</Badge>;
      case "CR":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">CR</Badge>;
      case "MPFA":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">MPFA</Badge>;
      case "Labour":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Labour</Badge>;
      default:
        return <Badge variant="secondary">{agency}</Badge>;
    }
  };

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Low</Badge>;
      default:
        return <Badge variant="secondary">{importance}</Badge>;
    }
  };

  const markAsSubmitted = (id: string) => {
    setDeadlines(deadlines.map(d => 
      d.id === id ? { ...d, status: "submitted", submissionDate: new Date() } : d
    ));
  };

  const calculateDaysRemaining = (dueDate: Date) => {
    const today = new Date();
    const diff = differenceInDays(dueDate, today);
    return diff;
  };

  const exportToCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Title,Description,Agency,Form Number,Due Date,Filing Period,Frequency,Status,Importance,Days Remaining\n"
      + deadlines.map(d => 
          `"${d.title}","${d.description}","${d.agency}","${d.formNumber}","${format(d.dueDate, 'yyyy-MM-dd')}","${d.filingPeriod}","${d.frequency}","${d.status}","${d.importance}","${calculateDaysRemaining(d.dueDate)}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hk_deadlines_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>📅 HK Statutory Deadlines</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} className="hk-btn hk-btn-o hk-btn-s">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button className="hk-btn hk-btn-n hk-btn-s">
              <Bell className="mr-2 h-4 w-4" />
              Reminders
            </Button>
          </div>
        </div>

        <div className="hk-grid hk-g4" style={{ marginBottom: "14px" }}>
          <div className="hk-stat" style={{ "--c": "var(--blue)" } as React.CSSProperties}>
            <div className="lb">Compliance Score</div>
            <div className="vl">{complianceScore}%</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--red)" } as React.CSSProperties}>
            <div className="lb">Overdue</div>
            <div className="vl">{overdueDeadlines.length}</div>
            <div className="sub">HK${overdueDeadlines.reduce((sum, d) => sum + (d.penaltyAmount || 0), 0).toLocaleString()}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--gold)" } as React.CSSProperties}>
            <div className="lb">Upcoming (30 days)</div>
            <div className="vl">{upcomingDeadlines.length}</div>
            <div className="sub">{upcomingDeadlines.length > 0 ? format(upcomingDeadlines[0].dueDate, "MMM dd") : "None"}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--green)" } as React.CSSProperties}>
            <div className="lb">Submitted</div>
            <div className="vl">{deadlines.filter(d => d.status === "submitted").length}</div>
          </div>
        </div>

        {overdueDeadlines.length > 0 && (
          <div className="hk-alert hk-a-red">
            You have {overdueDeadlines.length} overdue filing(s) with potential penalties totaling HK${overdueDeadlines.reduce((sum, d) => sum + (d.penaltyAmount || 0), 0).toLocaleString()}.
          </div>
        )}

        <div className="hk-fr hk-fr4" style={{ marginBottom: "14px" }}>
          <div className="hk-fg">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="hk-input" />
          </div>
          <div className="hk-fg">
            <Label htmlFor="agency">Agency</Label>
            <Select value={filterAgency} onValueChange={setFilterAgency}>
              <SelectTrigger id="agency" className="hk-input"><SelectValue placeholder="All Agencies" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                <SelectItem value="IRD">IRD</SelectItem>
                <SelectItem value="CR">CR</SelectItem>
                <SelectItem value="MPFA">MPFA</SelectItem>
                <SelectItem value="Labour">Labour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hk-fg">
            <Label htmlFor="status">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger id="status" className="hk-input"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hk-fg">
            <Label htmlFor="importance">Importance</Label>
            <Select value={filterImportance} onValueChange={setFilterImportance}>
              <SelectTrigger id="importance" className="hk-input"><SelectValue placeholder="All Importance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Importance</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr>
                <th>Deadline</th>
                <th>Form</th>
                <th>Authority</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Priority</th>
                <th className="hk-nm">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeadlines.map((deadline) => (
                <tr key={deadline.id}>
                  <td>
                    <div>{deadline.title}</div>
                    <div className="text-xs text-muted-foreground">{deadline.description}</div>
                  </td>
                  <td>{deadline.formNumber}</td>
                  <td>{getAgencyBadge(deadline.agency)}</td>
                  <td>
                    {format(deadline.dueDate, "yyyy-MM-dd")}
                    <div className="text-xs text-muted-foreground">
                      {calculateDaysRemaining(deadline.dueDate) < 0
                        ? `${Math.abs(calculateDaysRemaining(deadline.dueDate))} days overdue`
                        : `${calculateDaysRemaining(deadline.dueDate)} days remaining`}
                    </div>
                  </td>
                  <td>{getStatusBadge(deadline.status)}</td>
                  <td>{getImportanceBadge(deadline.importance)}</td>
                  <td className="hk-nm">HK${(deadline.penaltyAmount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hk-grid hk-g2">
        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr><th>Deadline</th><th>Filing</th><th>Authority</th></tr>
            </thead>
            <tbody>
              <tr><td>1 April annually</td><td>IR56B submission</td><td>IRD</td></tr>
              <tr><td>Within 42 days of AR</td><td>Annual Return (NAR1)</td><td>CR</td></tr>
              <tr><td>Within 1 month of notice</td><td>Profits Tax Return</td><td>IRD</td></tr>
              <tr><td>Monthly (10th)</td><td>MPF Contributions</td><td>MPFA</td></tr>
              <tr><td>Within 9 months of FYE</td><td>Audited Accounts</td><td>Cap. 622</td></tr>
            </tbody>
          </table>
        </div>
        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr><th>Offence</th><th>Penalty</th></tr>
            </thead>
            <tbody>
              <tr><td>Late Profits Tax Return</td><td>HK$10,000 + surcharge</td></tr>
              <tr><td>No proper records</td><td>Up to HK$300,000</td></tr>
              <tr><td>Late NAR1</td><td>HK$4,800 - HK$20,000</td></tr>
              <tr><td>Late MPF</td><td>5% surcharge / month</td></tr>
              <tr><td>No IR56B</td><td>HK$10,000 / employee</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
