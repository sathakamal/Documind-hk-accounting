"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface MPFCalculation {
  monthlySalary: number;
  employmentType: "employed" | "self-employed" | "exempt";
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  statutoryCapApplied: boolean;
  exemptBelowThreshold: boolean;
}

export default function MPFCalculatorPage() {
  const [monthlySalary, setMonthlySalary] = useState<number>(25000);
  const [employmentType, setEmploymentType] = useState<"employed" | "self-employed" | "exempt">("employed");
  const [calculation, setCalculation] = useState<MPFCalculation | null>(null);
  const [examples, setExamples] = useState<Array<{ salary: number; ee: number; er: number; total: number }>>([]);

  // MPF calculation logic based on HK rules
  const calculateMPF = () => {
    let employeeContribution = 0;
    let employerContribution = 0;
    let statutoryCapApplied = false;
    let exemptBelowThreshold = false;

    const MPF_THRESHOLD_MIN = 7100;
    const MPF_THRESHOLD_MAX = 30000;
    const MPF_RATE = 0.05; // 5%
    const STATUTORY_CAP = 1500; // HK$1,500 per month

    if (employmentType === "exempt") {
      // Exempt employees (e.g., domestic helpers, certain part-time)
      employeeContribution = 0;
      employerContribution = 0;
    } else if (employmentType === "self-employed") {
      // Self-employed: 5% of declared income
      employeeContribution = monthlySalary * MPF_RATE;
      employerContribution = 0; // Self-employed pays both sides
    } else {
      // Regular employed
      if (monthlySalary < MPF_THRESHOLD_MIN) {
        // Below threshold: employee exempt, employer pays 5%
        employeeContribution = 0;
        employerContribution = monthlySalary * MPF_RATE;
        exemptBelowThreshold = true;
      } else if (monthlySalary <= MPF_THRESHOLD_MAX) {
        // Within range: both pay 5%
        employeeContribution = monthlySalary * MPF_RATE;
        employerContribution = monthlySalary * MPF_RATE;
      } else {
        // Above max: both pay capped at HK$1,500
        employeeContribution = STATUTORY_CAP;
        employerContribution = STATUTORY_CAP;
        statutoryCapApplied = true;
      }
    }

    const totalContribution = employeeContribution + employerContribution;

    setCalculation({
      monthlySalary,
      employmentType,
      employeeContribution,
      employerContribution,
      totalContribution,
      statutoryCapApplied,
      exemptBelowThreshold
    });
  };

  // Generate example calculations
  useEffect(() => {
    const exampleSalaries = [5000, 7100, 15000, 30000, 50000, 100000];
    const examples = exampleSalaries.map(salary => {
      let ee = 0;
      let er = 0;
      
      if (salary < 7100) {
        ee = 0;
        er = salary * 0.05;
      } else if (salary <= 30000) {
        ee = salary * 0.05;
        er = salary * 0.05;
      } else {
        ee = 1500;
        er = 1500;
      }
      
      return {
        salary,
        ee: Math.round(ee),
        er: Math.round(er),
        total: Math.round(ee + er)
      };
    });
    
    setExamples(examples);
  }, []);

  // Recalculate when inputs change
  useEffect(() => {
    calculateMPF();
  }, [monthlySalary, employmentType]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MPF Calculator</h1>
          <p className="text-muted-foreground">
            Hong Kong Mandatory Provident Fund Contribution Calculator
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>MPF Rules (Cap. 485):</strong> Employee & Employer each contribute 5%. 
          Minimum income: HK$7,100 (employee exempt below). Maximum: HK$30,000 (cap HK$1,500 each). 
          Self-employed: 5% of declared income. Contributions due by 10th of following month.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>MPF Contribution Calculator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (HK$)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  min="0"
                  step="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment-type">Employment Type</Label>
                <Select
                  value={employmentType}
                  onValueChange={(value: "employed" | "self-employed" | "exempt") => setEmploymentType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="exempt">Exempt Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {calculation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Employee Contribution</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(calculation.employeeContribution)}</div>
                    <div className="text-xs text-muted-foreground mt-1">5% of relevant income</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Employer Contribution</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(calculation.employerContribution)}</div>
                    <div className="text-xs text-muted-foreground mt-1">5% of relevant income</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Monthly Contribution</div>
                  <div className="text-3xl font-bold mt-1 text-blue-700">
                    {formatCurrency(calculation.totalContribution)}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    {calculation.exemptBelowThreshold && (
                      <Badge className="bg-yellow-100 text-yellow-800">Employee exempt below HK$7,100</Badge>
                    )}
                    {calculation.statutoryCapApplied && (
                      <Badge className="bg-green-100 text-green-800">Statutory cap HK$1,500 applied</Badge>
                    )}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <strong>Annual Total:</strong> {formatCurrency(calculation.totalContribution * 12)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MPF Contribution Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Monthly Income</TableHead>
                    <TableHead className="text-right">Employee (5%)</TableHead>
                    <TableHead className="text-right">Employer (5%)</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examples.map((example, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{formatCurrency(example.salary)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(example.ee)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(example.er)}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(example.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Key MPF Regulations:</h3>
              <ul className="text-sm space-y-1">
                <li>• <strong>Mandatory Participation:</strong> All employees aged 18-65 with 60+ days employment</li>
                <li>• <strong>Contribution Period:</strong> 1st to last day of each month</li>
                <li>• <strong>Payment Deadline:</strong> 10th day of following month</li>
                <li>• <strong>Penalties:</strong> Late payment: 5% surcharge + HK$450 fixed penalty</li>
                <li>• <strong>Exemptions:</strong> Domestic helpers, certain part-time (&lt; 60 days), self-employed (voluntary)</li>
                <li>• <strong>Tax Deductible:</strong> Employee contributions deductible up to HK$18,000 annually</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MPF Scheme Types & Investment Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600">💰</span>
                </div>
                <h3 className="font-semibold">Conservative Fund</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Capital preservation focus, low risk, suitable for near-retirement members
              </p>
              <div className="mt-3 text-xs">
                <Badge className="bg-blue-100 text-blue-800">Avg Return: 2-3%</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600">📈</span>
                </div>
                <h3 className="font-semibold">Balanced Fund</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Mix of equities and bonds, moderate risk, suitable for mid-career members
              </p>
              <div className="mt-3 text-xs">
                <Badge className="bg-green-100 text-green-800">Avg Return: 4-6%</Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600">🚀</span>
                </div>
                <h3 className="font-semibold">Growth Fund</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Equity-focused, higher risk, suitable for young members with long investment horizon
              </p>
              <div className="mt-3 text-xs">
                <Badge className="bg-orange-100 text-orange-800">Avg Return: 6-8%</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold mb-2">Important Compliance Notes:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>MPF Authority (MPFA):</strong> Regulatory body overseeing compliance</li>
              <li>• <strong>Record Keeping:</strong> Must maintain contribution records for 7 years</li>
              <li>• <strong>Annual Statement:</strong> Must provide annual benefit statement to employees</li>
              <li>• <strong>Scheme Transfer:</strong> Employees can transfer accumulated benefits between schemes</li>
              <li>• <strong>Early Withdrawal:</strong> Only permitted for specific circumstances (retirement, permanent departure, etc.)</li>
              <li>• <strong>Default Investment Strategy (DIS):</strong> Automatic investment option if no choice made</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}