"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, AlertTriangle, CheckCircle, Clock, FileText, Download, Bell, Filter } from "lucide-react";
import { format, addDays, differenceInDays, isBefore, isAfter, parseISO } from "date-fns";

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
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HK Compliance Deadlines</h1>
          <p className="text-muted-foreground">
            Track all Hong Kong statutory filing deadlines, penalties, and compliance requirements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button>
            <Bell className="mr-2 h-4 w-4" />
            Set Reminders
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore}%</div>
            <Progress value={complianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {deadlines.filter(d => d.status === "submitted").length} of {deadlines.length} deadlines met
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueDeadlines.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Total penalties: HK${overdueDeadlines.reduce((sum, d) => sum + (d.penaltyAmount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingDeadlines.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Next due: {upcomingDeadlines.length > 0 ? format(upcomingDeadlines[0].dueDate, 'MMM dd') : 'None'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {deadlines.filter(d => d.status === "submitted").length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last submission: {format(new Date(), 'MMM dd')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueDeadlines.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overdue Deadlines Detected</AlertTitle>
          <AlertDescription>
            You have {overdueDeadlines.length} overdue filing(s) with potential penalties totaling HK$
            {overdueDeadlines.reduce((sum, d) => sum + (d.penaltyAmount || 0), 0).toLocaleString()}.
            Submit immediately to avoid additional penalties.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search deadlines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Select value={filterAgency} onValueChange={setFilterAgency}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  <SelectItem value="IRD">Inland Revenue Department (IRD)</SelectItem>
                  <SelectItem value="CR">Companies Registry (CR)</SelectItem>
                  <SelectItem value="MPFA">MPF Authority (MPFA)</SelectItem>
                  <SelectItem value="Labour">Labour Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="importance">Importance</Label>
              <Select value={filterImportance} onValueChange={setFilterImportance}>
                <SelectTrigger>
                  <SelectValue placeholder="All Importance" />
                </SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Deadlines ({deadlines.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdueDeadlines.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingDeadlines.length})</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredDeadlines.map((deadline) => (
            <Card key={deadline.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{deadline.title}</CardTitle>
                    <CardDescription>{deadline.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(deadline.status)}
                    {getAgencyBadge(deadline.agency)}
                    {getImportanceBadge(deadline.importance)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{format(deadline.dueDate, 'PPP')}</span>
                      <Badge variant={calculateDaysRemaining(deadline.dueDate) < 0 ? "destructive" : "outline"}>
                        {calculateDaysRemaining(deadline.dueDate) < 0 
                          ? `${Math.abs(calculateDaysRemaining(deadline.dueDate))} days overdue`
                          : `${calculateDaysRemaining(deadline.dueDate)} days remaining`
                        }
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Filing Details</Label>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Form:</span>
                        <span className="font-medium">{deadline.formNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Period:</span>
                        <span className="font-medium">{deadline.filingPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="font-medium">{deadline.frequency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Penalties & Actions</Label>
                    <div className="mt-1 space-y-2">
                      {deadline.penaltyAmount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Penalty:</span>
                          <span className="font-medium text-red-600">HK${deadline.penaltyAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {deadline.status !== "submitted" && (
                          <Button size="sm" onClick={() => markAsSubmitted(deadline.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Submitted
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <FileText className="mr-2 h-4 w-4" />
                          Download Form
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {deadline.penaltyDescription && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {deadline.penaltyDescription}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          {overdueDeadlines.map((deadline) => (
            <Card key={deadline.id} className="border-red-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-red-700">{deadline.title}</CardTitle>
                    <CardDescription>{deadline.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="destructive">OVERDUE</Badge>
                    {getAgencyBadge(deadline.agency)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-red-700">Critical Information</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days Overdue:</span>
                        <span className="font-medium text-red-700">
                          {Math.abs(calculateDaysRemaining(deadline.dueDate))} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Penalty Amount:</span>
                        <span className="font-medium text-red-700">
                          HK${deadline.penaltyAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Immediate Actions Required</Label>
                    <div className="mt-2 space-y-2">
                      <Button className="w-full" variant="destructive" onClick={() => markAsSubmitted(deadline.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Immediately
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Form & Instructions
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* HK Compliance Notes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Important HK Compliance Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Inland Revenue Department (IRD)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Profits Tax: First installment due in November, second in April</li>
                  <li>• Salaries Tax: Individual returns due June 1st annually</li>
                  <li>• Property Tax: Due April 30th for preceding tax year</li>
                  <li>• Stamp Duty: Must be paid within 30 days of execution</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Companies Registry (CR)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Annual Return (NAR1): Due within 42 days after anniversary of incorporation</li>
                  <li>• Business Registration: Renewal due January 31st annually</li>
                  <li>• Change of Particulars: Must be filed within 1 month of change</li>
                </ul>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">MPF Authority (MPFA)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Monthly Contributions: Due by 10th of following month</li>
                  <li>• Annual Return: Due April 30th for preceding calendar year</li>
                  <li>• Penalties: HK$5,000 per employee + interest on arrears</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Key Penalties Summary</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Late Profits Tax: 5% surcharge + further 10% if &gt;6 months overdue</li>
                  <li>• Late Annual Return: HK$3,480 penalty + daily fines</li>
                  <li>• Late MPF: HK$5,000 per employee + 10% interest on arrears</li>
                  <li>• Late IR56B: HK$10,000 fine + additional penalties</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}