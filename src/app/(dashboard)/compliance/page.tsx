"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Info, FileText, Calendar } from "lucide-react";

interface ComplianceItem {
  id: string;
  description: string;
  authority: string;
  frequency: "monthly" | "quarterly" | "annually" | "one-time";
  deadline: string;
  status: "compliant" | "pending" | "overdue" | "exempt";
  penalty: string;
  notes: string;
}

interface FrameworkRequirement {
  framework: "full" | "pe" | "sme";
  requirement: string;
  full: string;
  pe: string;
  sme: string;
}

export default function ComplianceCenterPage() {
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
    {
      id: "1",
      description: "MPF Contributions",
      authority: "MPFA",
      frequency: "monthly",
      deadline: "10th of following month",
      status: "compliant",
      penalty: "5% surcharge + HK$450 fixed penalty",
      notes: "Employee & employer each 5%, statutory cap HK$1,500"
    },
    {
      id: "2",
      description: "Profits Tax Return (BIR51)",
      authority: "IRD",
      frequency: "annually",
      deadline: "Within 1 month of notice",
      status: "pending",
      penalty: "HK$10,000 + 5% surcharge",
      notes: "Two-tiered rates: 8.25%/16.5% for corporations"
    },
    {
      id: "3",
      description: "IR56B - Employer's Return",
      authority: "IRD",
      frequency: "annually",
      deadline: "1 April",
      status: "overdue",
      penalty: "HK$10,000 per employee",
      notes: "Annual return of remuneration & pensions"
    },
    {
      id: "4",
      description: "Annual Return (NAR1)",
      authority: "CR",
      frequency: "annually",
      deadline: "Within 42 days of AR",
      status: "pending",
      penalty: "HK$870 + daily penalty",
      notes: "Annual return to Companies Registry"
    },
    {
      id: "5",
      description: "Business Registration Renewal",
      authority: "IRD",
      frequency: "annually",
      deadline: "1 month before expiry",
      status: "compliant",
      penalty: "HK$300 + possible prosecution",
      notes: "BR certificate must be renewed annually"
    },
    {
      id: "6",
      description: "Audited Financial Statements",
      authority: "Cap. 622",
      frequency: "annually",
      deadline: "Within 9 months of FYE",
      status: "pending",
      penalty: "Up to HK$300,000",
      notes: "All HK companies require audit regardless of size"
    },
    {
      id: "7",
      description: "Tax Computation Records",
      authority: "IRD",
      frequency: "annually",
      deadline: "7-year retention",
      status: "compliant",
      penalty: "HK$10,000 per offense",
      notes: "Must maintain tax computation records for 7 years"
    },
    {
      id: "8",
      description: "Employment Contract Records",
      authority: "Labour Dept",
      frequency: "one-time",
      deadline: "Upon employment",
      status: "compliant",
      penalty: "HK$10,000 per employee",
      notes: "Written employment contracts required"
    }
  ]);

  const [frameworkRequirements, setFrameworkRequirements] = useState<FrameworkRequirement[]>([
    {
      framework: "full",
      requirement: "Financial Statements",
      full: "✅ Full HKFRS",
      pe: "✅ HKFRS for PE",
      sme: "✅ SME-FRS"
    },
    {
      framework: "full",
      requirement: "Balance Sheet",
      full: "✅ Required",
      pe: "✅ Required",
      sme: "✅ Required"
    },
    {
      framework: "full",
      requirement: "Income Statement",
      full: "✅ Required",
      pe: "✅ Required",
      sme: "✅ Required"
    },
    {
      framework: "full",
      requirement: "Cash Flow Statement",
      full: "✅ Required",
      pe: "✅ Required",
      sme: "❌ Exempt"
    },
    {
      framework: "full",
      requirement: "Changes in Equity",
      full: "✅ Required",
      pe: "✅ Required",
      sme: "❌ Exempt"
    },
    {
      framework: "full",
      requirement: "Notes to Accounts",
      full: "✅ Full Notes",
      pe: "✅ Simplified",
      sme: "✅ Minimal"
    },
    {
      framework: "full",
      requirement: "Segment Reporting",
      full: "✅ Required",
      pe: "❌ Exempt",
      sme: "❌ Exempt"
    },
    {
      framework: "full",
      requirement: "EPS Calculation",
      full: "✅ Required",
      pe: "❌ Exempt",
      sme: "❌ Exempt"
    },
    {
      framework: "full",
      requirement: "Deferred Tax",
      full: "✅ Required",
      pe: "✅ Required",
      sme: "❌ Exempt"
    }
  ]);

  const [complianceScore, setComplianceScore] = useState(0);
  const [overdueItems, setOverdueItems] = useState<ComplianceItem[]>([]);
  const [pendingItems, setPendingItems] = useState<ComplianceItem[]>([]);

  // Calculate compliance metrics
  useEffect(() => {
    const totalItems = complianceItems.length;
    const compliantItems = complianceItems.filter(item => item.status === "compliant").length;
    const score = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100;
    
    setComplianceScore(score);
    setOverdueItems(complianceItems.filter(item => item.status === "overdue"));
    setPendingItems(complianceItems.filter(item => item.status === "pending"));
  }, [complianceItems]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "compliant": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending": return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "overdue": return <XCircle className="h-5 w-5 text-red-600" />;
      case "exempt": return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "compliant": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "exempt": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch(frequency) {
      case "monthly": return "bg-purple-100 text-purple-800";
      case "quarterly": return "bg-blue-100 text-blue-800";
      case "annually": return "bg-green-100 text-green-800";
      case "one-time": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatusText = (status: string) => {
    switch(status) {
      case "compliant": return "Compliant";
      case "pending": return "Pending";
      case "overdue": return "Overdue";
      case "exempt": return "Exempt";
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Center</h1>
          <p className="text-muted-foreground">
            Hong Kong Statutory Compliance Checklist & Monitoring
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 text-lg px-4 py-2">
          Cap. 622 Compliant
        </Badge>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Companies Ordinance (Cap. 622):</strong> Every company incorporated in Hong Kong must have its 
          financial statements audited by a practising CPA, regardless of size. There is NO audit exemption for 
          small companies in HK (unlike UK/Singapore). Records must be kept for 7 years.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-700">{complianceScore}%</div>
              <div className="text-sm text-muted-foreground mt-2">Overall Compliance Rate</div>
            </div>
            
            <Progress value={complianceScore} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {complianceItems.filter(item => item.status === "compliant").length}
                </div>
                <div className="text-xs text-muted-foreground">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">
                  {overdueItems.length}
                </div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueItems.length > 0 ? (
              <div className="space-y-3">
                {overdueItems.map(item => (
                  <div key={item.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{item.description}</div>
                        <div className="text-xs text-muted-foreground">{item.authority} • {item.deadline}</div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                    </div>
                    <div className="text-xs text-red-600 mt-2">
                      Penalty: {item.penalty}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-green-700">No Overdue Items</div>
                <div className="text-sm text-muted-foreground">All compliance requirements are up to date</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingItems.length > 0 ? (
              <div className="space-y-3">
                {pendingItems.slice(0, 3).map(item => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{item.description}</div>
                        <div className="text-xs text-muted-foreground">{item.authority}</div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      Deadline: {item.deadline}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <div className="text-lg font-semibold text-green-700">No Pending Deadlines</div>
                <div className="text-sm text-muted-foreground">All requirements are compliant</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>HK Statutory Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold">Requirement</th>
                  <th className="text-left p-3 text-sm font-semibold">Authority</th>
                  <th className="text-left p-3 text-sm font-semibold">Frequency</th>
                  <th className="text-left p-3 text-sm font-semibold">Deadline</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {complianceItems.map(item => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-xs text-muted-foreground">{item.notes}</div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-gray-100 text-gray-800">{item.authority}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getFrequencyColor(item.frequency)}>
                        {item.frequency}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{item.deadline}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge className={getStatusColor(item.status)}>
                          {formatStatusText(item.status)}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-red-600">{item.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Required Reports (Per Framework)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Full HKFRS</h4>
                <ul className="text-sm space-y-1">
                  <li>• Full set of financial statements</li>
                  <li>• Comprehensive notes to accounts</li>
                  <li>• Segment reporting</li>
                  <li>• EPS calculation</li>
                  <li>• Deferred tax computation</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">HKFRS for Private Entities</h4>
                <ul className="text-sm space-y-1">
                  <li>• Full set of financial statements</li>
                  <li>• Simplified notes to accounts</li>
                  <li>• No segment reporting required</li>
                  <li>• No EPS calculation required</li>
                  <li>• Deferred tax computation required</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold mb-2">SME-FRF & SME-FRS</h4>
                <ul className="text-sm space-y-1">
                  <li>• Simplified financial statements</li>
                  <li>• Minimal notes to accounts</li>
                  <li>• No cash flow statement required</li>
                  <li>• No changes in equity required</li>
                  <li>• No deferred tax computation required</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit & Record Keeping Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Auditor Requirements</h4>
                <ul className="text-sm space-y-1">
                  <li>• Must be a Certified Public Accountant (CPA) registered with HKICPA</li>
                  <li>• Must hold a Practising Certificate</li>
                  <li>• Must be independent of the company</li>
                  <li>• Appointed at each AGM</li>
                  <li>• Fees must be disclosed in accounts</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Record Keeping (s.373-s.374)</h4>
                <ul className="text-sm space-y-1">
                  <li>• Proper books of account must be kept</li>
                  <li>• Records must explain transactions & financial position</li>
                  <li>• Must enable preparation of financial statements</li>
                  <li>• Minimum retention: <strong>7 years</strong></li>
                  <li>• Penalty for non-compliance: up to HK$300,000</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold mb-2">Key Compliance Dates</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>1 April:</strong> IR56B submission deadline</li>
                  <li>• <strong>Within 42 days of AR:</strong> Annual Return (NAR1)</li>
                  <li>• <strong>Within 9 months of FYE:</strong> Audited accounts</li>
                  <li>• <strong>10th of each month:</strong> MPF contributions</li>
                  <li>• <strong>Annually:</strong> Business registration renewal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-green-50 border-green-200">
        <AlertDescription>
          <strong>Important:</strong> This compliance center provides monitoring based on HK statutory requirements. 
          Ensure all deadlines are met and records are maintained for 7 years as required by Cap. 622. 
          Consult with a qualified professional for specific compliance advice.
        </AlertDescription>
      </Alert>
    </div>
  );
}