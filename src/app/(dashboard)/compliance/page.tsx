"use client";

import { useState, useEffect } from "react";

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

  const getStatusColor = (status: string) => {
    switch(status) {
      case "compliant": return "hk-badge hk-b-green";
      case "pending": return "hk-badge hk-b-gold";
      case "overdue": return "hk-badge hk-b-red";
      case "exempt": return "hk-badge hk-b-blue";
      default: return "hk-badge hk-b-gray";
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch(frequency) {
      case "monthly": return "hk-badge hk-b-purple";
      case "quarterly": return "hk-badge hk-b-blue";
      case "annually": return "hk-badge hk-b-green";
      case "one-time": return "hk-badge hk-b-orange";
      default: return "hk-badge hk-b-gray";
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
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>✅ HK Statutory Compliance Center</h3>
          <span className="hk-badge hk-b-gold">Cap. 622</span>
        </div>
        <div className="hk-grid hk-g2">
          <div>
            <h4 style={{ fontSize: ".85rem", color: "var(--navy)", marginBottom: "12px" }}>📋 Compliance Checklist</h4>
            <div className="hk-tw">
              <table className="hk-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Authority</th>
                    <th>Frequency</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div>{item.description}</div>
                        <div className="text-xs text-muted-foreground">{item.notes}</div>
                      </td>
                      <td>{item.authority}</td>
                      <td><span className={getFrequencyColor(item.frequency)}>{item.frequency}</span></td>
                      <td>{item.deadline}</td>
                      <td><span className={getStatusColor(item.status)}>{formatStatusText(item.status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: ".85rem", color: "var(--navy)", marginBottom: "12px" }}>📊 Readiness Score</h4>
            <div className="hk-stat" style={{ "--c": "var(--blue)" } as React.CSSProperties}>
              <div className="lb">Compliance Score</div>
              <div className="vl">{complianceScore}%</div>
              <div className="sub">{complianceItems.filter(item => item.status === "compliant").length} compliant / {overdueItems.length} overdue</div>
            </div>

            <h4 style={{ fontSize: ".85rem", color: "var(--navy)", marginBottom: "12px", marginTop: "20px" }}>📝 Required Reports (Your Framework)</h4>
            {frameworkRequirements.map((item, index) => (
              <div key={index} className="hk-chk">
                <div className={`hk-chk-ico ${item.sme.includes("❌") ? "hk-chk-warn" : "hk-chk-ok"}`}>
                  {item.sme.includes("❌") ? "!" : "✓"}
                </div>
                <div className="hk-chk-text">
                  <strong>{item.requirement}</strong>
                  <span>Full: {item.full} | PE: {item.pe} | SME: {item.sme}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hk-card">
        <div className="hk-card-h">
          <h3>🏛 Statutory Audit Requirements</h3>
        </div>
        <div className="hk-alert hk-a-info">
          <strong>Companies Ordinance (Cap. 622) s.405:</strong> Every company incorporated in Hong Kong must have its financial statements audited by a practising CPA, regardless of size. There is no small-company audit exemption in Hong Kong.
        </div>
        <div className="hk-grid hk-g2">
          <div className="hk-notes-box">
            <h4>Auditor Requirements</h4>
            <ul>
              <li>Must be a CPA registered with HKICPA.</li>
              <li>Must hold a practising certificate.</li>
              <li>Must be independent of the company.</li>
              <li>Appointed at each AGM.</li>
              <li>Fees should be disclosed in the accounts.</li>
            </ul>
          </div>
          <div className="hk-notes-box">
            <h4>Record Keeping (s.373-s.374)</h4>
            <ul>
              <li>Proper books of account must be kept.</li>
              <li>Records must explain transactions and financial position.</li>
              <li>Must support preparation of financial statements.</li>
              <li>Minimum retention: 7 years.</li>
              <li>Penalty for non-compliance can be up to HK$300,000.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
