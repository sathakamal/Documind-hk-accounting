"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>🔐 MPF Calculator</h3>
        </div>

        <div className="hk-alert hk-a-info">
          <strong>MPF Rules:</strong> EE & ER each 5%. Min income: HK$7,100 (EE exempt below). Max: HK$30,000 (cap HK$1,500 each). Self-employed: 5% of declared income. Contributions are due by the 10th of the following month.
        </div>

        <div className="hk-grid hk-g2">
          <div>
            <div className="hk-fr hk-fr2">
              <div className="hk-fg">
                <Label htmlFor="salary">Monthly Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  min="0"
                  step="100"
                  className="hk-input"
                />
              </div>

              <div className="hk-fg">
                <Label htmlFor="employment-type">Type</Label>
                <Select
                  value={employmentType}
                  onValueChange={(value: "employed" | "self-employed" | "exempt") => setEmploymentType(value)}
                >
                  <SelectTrigger id="employment-type" className="hk-input">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self-employed">Self-Employed</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {calculation && (
              <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px", marginTop: "10px" }}>
                <table className="hk-table">
                  <tbody>
                    <tr>
                      <td>Monthly Gross Salary</td>
                      <td className="hk-nm">{formatCurrency(calculation.monthlySalary)}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--red)" }}>Employee MPF Contribution (5%)</td>
                      <td className="hk-nm" style={{ color: "var(--red)" }}>
                        {formatCurrency(calculation.employeeContribution)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--orange)" }}>Employer MPF Contribution (5%)</td>
                      <td className="hk-nm" style={{ color: "var(--orange)" }}>
                        {formatCurrency(calculation.employerContribution)}
                      </td>
                    </tr>
                    <tr style={{ borderTop: "2px solid var(--border)", fontWeight: 700 }}>
                      <td>Total Monthly Contribution</td>
                      <td className="hk-nm" style={{ color: "var(--navy)" }}>
                        {formatCurrency(calculation.totalContribution)}
                      </td>
                    </tr>
                    <tr>
                      <td>Annual Total</td>
                      <td className="hk-nm">{formatCurrency(calculation.totalContribution * 12)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex gap-2 flex-wrap mt-3">
                  {calculation.exemptBelowThreshold && (
                    <Badge className="hk-badge hk-b-orange">Employee exempt below HK$7,100</Badge>
                  )}
                  {calculation.statutoryCapApplied && (
                    <Badge className="hk-badge hk-b-green">Statutory cap HK$1,500 applied</Badge>
                  )}
                  {employmentType === "self-employed" && (
                    <Badge className="hk-badge hk-b-blue">Self-employed contribution basis</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ background: "var(--gray)", padding: "14px", borderRadius: "8px" }}>
            <h4 style={{ fontSize: ".82rem", color: "var(--navy)", marginBottom: "8px" }}>MPF Scale</h4>
            <table className="hk-table">
              <thead>
                <tr>
                  <th>Income</th>
                  <th>EE</th>
                  <th>ER</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {examples.map((example, index) => (
                  <tr key={index}>
                    <td>{formatCurrency(example.salary)}</td>
                    <td className="hk-nm">{formatCurrency(example.ee)}</td>
                    <td className="hk-nm">{formatCurrency(example.er)}</td>
                    <td className="hk-nm" style={{ fontWeight: 700 }}>{formatCurrency(example.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="hk-card">
        <div className="hk-card-h">
          <h3>📋 MPF Compliance Notes</h3>
        </div>
        <div className="hk-grid hk-g2">
          <div className="hk-notes-box">
            <h4>Key Regulations</h4>
            <ul>
              <li>Mandatory participation usually applies to employees aged 18 to 65 with 60+ days employment.</li>
              <li>Contribution period runs from the 1st to the last day of each month.</li>
              <li>Payment deadline is the 10th day of the following month.</li>
              <li>Employee mandatory contributions are tax deductible up to the statutory annual ceiling.</li>
            </ul>
          </div>
          <div className="hk-notes-box">
            <h4>Operational Reminders</h4>
            <ul>
              <li>Keep contribution and remittance records for at least 7 years.</li>
              <li>Late payment may trigger surcharge, penalties, and trustee follow-up.</li>
              <li>Exempt cases should be documented clearly in the employee file.</li>
              <li>Annual benefit statements should match payroll and trustee records.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
