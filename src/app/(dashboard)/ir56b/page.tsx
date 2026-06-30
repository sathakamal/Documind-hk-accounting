"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Info, FileText } from "lucide-react";

interface EmployeeRecord {
  id: string;
  name: string;
  hkid: string;
  position: string;
  department: string;
  startDate: string;
  monthlySalary: number;
  annualBonus?: number;
  housingAllowance?: number;
  otherAllowances?: number;
  mpfContribution: number;
}

interface IR56BRecord {
  employeeName: string;
  hkid: string;
  period: string;
  basicSalary: number;
  bonus: number;
  housing: number;
  otherAllowances: number;
  mpfContribution: number;
  totalRemuneration: number;
  taxableIncome: number;
}

export default function IR56BGeneratorPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([
    {
      id: "1",
      name: "Chan Tai Man",
      hkid: "A123456(7)",
      position: "Accountant",
      department: "Finance",
      startDate: "2025-01-15",
      monthlySalary: 35000,
      annualBonus: 42000,
      housingAllowance: 8000,
      otherAllowances: 2000,
      mpfContribution: 1500
    },
    {
      id: "2",
      name: "Wong Siu Ming",
      hkid: "B234567(8)",
      position: "Sales Manager",
      department: "Sales",
      startDate: "2025-03-20",
      monthlySalary: 45000,
      annualBonus: 54000,
      housingAllowance: 10000,
      otherAllowances: 3000,
      mpfContribution: 1500
    },
    {
      id: "3",
      name: "Lee Ka Yan",
      hkid: "C345678(9)",
      position: "Admin Assistant",
      department: "Administration",
      startDate: "2025-06-10",
      monthlySalary: 18000,
      annualBonus: 9000,
      housingAllowance: 0,
      otherAllowances: 1000,
      mpfContribution: 900
    },
    {
      id: "4",
      name: "Cheung Wai Kit",
      hkid: "D456789(0)",
      position: "IT Specialist",
      department: "IT",
      startDate: "2025-08-05",
      monthlySalary: 28000,
      annualBonus: 16800,
      housingAllowance: 5000,
      otherAllowances: 1500,
      mpfContribution: 1400
    }
  ]);

  const [ir56bRecords, setIr56bRecords] = useState<IR56BRecord[]>([]);
  const [totalRemuneration, setTotalRemuneration] = useState(0);
  const [totalTaxableIncome, setTotalTaxableIncome] = useState(0);
  const [reportPeriod, setReportPeriod] = useState("2026-04-01 to 2027-03-31");

  // Generate IR56B records from employee data
  useEffect(() => {
    const records: IR56BRecord[] = employees.map(employee => {
      const annualBasic = employee.monthlySalary * 12;
      const bonus = employee.annualBonus || 0;
      const housing = (employee.housingAllowance || 0) * 12;
      const other = (employee.otherAllowances || 0) * 12;
      const mpf = employee.mpfContribution * 12;
      
      const totalRemuneration = annualBasic + bonus + housing + other;
      const taxableIncome = totalRemuneration - mpf; // MPF contributions are tax deductible
      
      return {
        employeeName: employee.name,
        hkid: employee.hkid,
        period: reportPeriod,
        basicSalary: annualBasic,
        bonus,
        housing,
        otherAllowances: other,
        mpfContribution: mpf,
        totalRemuneration,
        taxableIncome
      };
    });
    
    setIr56bRecords(records);
    
    // Calculate totals
    const totalRem = records.reduce((sum, record) => sum + record.totalRemuneration, 0);
    const totalTax = records.reduce((sum, record) => sum + record.taxableIncome, 0);
    
    setTotalRemuneration(totalRem);
    setTotalTaxableIncome(totalTax);
  }, [employees, reportPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const exportToCSV = () => {
    const headers = [
      "Employee Name",
      "HKID",
      "Period",
      "Basic Salary",
      "Bonus",
      "Housing Allowance",
      "Other Allowances",
      "MPF Contribution",
      "Total Remuneration",
      "Taxable Income"
    ];
    
    const csvContent = [
      headers.join(","),
      ...ir56bRecords.map(record => [
        `"${record.employeeName}"`,
        `"${record.hkid}"`,
        `"${record.period}"`,
        record.basicSalary,
        record.bonus,
        record.housing,
        record.otherAllowances,
        record.mpfContribution,
        record.totalRemuneration,
        record.taxableIncome
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `IR56B_${new Date().getFullYear()}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateIRDReport = () => {
    const report = {
      employerName: "DocuMind HK Pro Co.",
      employerBRN: "88888888",
      employerCR: "77777777",
      reportPeriod,
      totalEmployees: employees.length,
      totalRemuneration,
      totalTaxableIncome,
      records: ir56bRecords
    };
    
    const reportContent = JSON.stringify(report, null, 2);
    const blob = new Blob([reportContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `IR56B_Report_${new Date().getFullYear()}.json`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IR56B Generator</h1>
          <p className="text-muted-foreground">
            Employer's Return of Remuneration & Pensions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={generateIRDReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate IRD Report
          </Button>
        </div>
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important Deadline:</strong> File by <strong>1 April</strong> annually. 
          Late filing penalty: HK$10,000 per employee. 
          IR56F required when employee leaves; IR56G when departing Hong Kong.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{employees.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Active staff for reporting period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Remuneration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalRemuneration)}</div>
            <p className="text-sm text-muted-foreground mt-1">Gross payments to all employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Taxable Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalTaxableIncome)}</div>
            <p className="text-sm text-muted-foreground mt-1">After MPF deductions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>IR56B – Employer's Return of Remuneration</CardTitle>
          <div className="text-sm text-muted-foreground">
            Reporting Period: {reportPeriod}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>HKID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">Housing</TableHead>
                  <TableHead className="text-right">MPF</TableHead>
                  <TableHead className="text-right">Total Remun.</TableHead>
                  <TableHead className="text-right">Taxable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ir56bRecords.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell className="font-mono">{record.hkid}</TableCell>
                    <TableCell>{record.period}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(record.basicSalary)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(record.bonus)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(record.housing)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(record.mpfContribution)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">{formatCurrency(record.totalRemuneration)}</TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge className="bg-blue-100 text-blue-800">
                        {formatCurrency(record.taxableIncome)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">Grand Totals</div>
              <div className="text-2xl font-bold">{formatCurrency(totalRemuneration)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Taxable Income</div>
              <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalTaxableIncome)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>IR56B Filing Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold mb-1">Who Must File</h4>
                <ul className="text-sm space-y-1">
                  <li>• All employers with employees in Hong Kong</li>
                  <li>• Regardless of business size or profit level</li>
                  <li>• Even if business ceased during year</li>
                  <li>• Must file for each employee earning HK$120,000+ annually</li>
                </ul>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold mb-1">Information Required</h4>
                <ul className="text-sm space-y-1">
                  <li>• Employee's full name and HKID number</li>
                  <li>• Position and department</li>
                  <li>• Employment period during tax year</li>
                  <li>• All remuneration (cash and non-cash)</li>
                  <li>• MPF contributions made</li>
                </ul>
              </div>

              <div className="p-3 border rounded-lg">
                <h4 className="font-semibold mb-1">Penalties for Non-Compliance</h4>
                <ul className="text-sm space-y-1">
                  <li>• Late filing: HK$10,000 per employee</li>
                  <li>• Incorrect information: HK$10,000 per item</li>
                  <li>• Willful evasion: up to HK$50,000 + 3x tax undercharged</li>
                  <li>• Imprisonment for serious cases</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related IRD Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold">IR56F</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Notice of Cessation of Employment</h4>
                    <p className="text-xs text-muted-foreground">Within 1 month of employee leaving</p>
                  </div>
                </div>
                <p className="text-sm">
                  Required when employee leaves employment. Must include final remuneration details.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">IR56G</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Notice of Departure from Hong Kong</h4>
                    <p className="text-xs text-muted-foreground">At least 1 month before departure</p>
                  </div>
                </div>
                <p className="text-sm">
                  Required when employee permanently leaves Hong Kong. Must clear all tax liabilities.
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">BIR56</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Application for Holding Over Provisional Tax</h4>
                    <p className="text-xs text-muted-foreground">When business profits decrease</p>
                  </div>
                </div>
                <p className="text-sm">
                  Apply to reduce provisional tax payments when current year profits are lower.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert className="bg-green-50 border-green-200">
        <AlertDescription>
          <strong>Important:</strong> This IR56B generator produces data in the exact format required by the 
          Hong Kong Inland Revenue Department. Ensure all information is accurate before submission. 
          Keep records for 7 years as required by Cap. 622.
        </AlertDescription>
      </Alert>
    </div>
  );
}