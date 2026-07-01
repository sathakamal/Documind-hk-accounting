"use client";

import { useState, useEffect } from "react";

interface FixedAsset {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  cost: number;
  usefulLife: number;
  salvageValue: number;
  depreciationMethod: string;
  pool: "A" | "B" | "C";
  status: "active" | "disposed" | "sold";
}

interface DepreciationSchedule {
  assetName: string;
  cost: number;
  usefulLife: number;
  bookDepreciationPerYear: number;
  accumulatedDepreciation: number;
  bookWDV: number;
  pool: string;
  initialAllowance: number;
  annualAllowance: number;
  taxWDV: number;
  timingDifference: number;
}

export default function DepreciationSchedulePage() {
  const [assets, setAssets] = useState<FixedAsset[]>([
    {
      id: "1",
      name: "Dell Laptop XPS 15",
      category: "Computer Equipment",
      purchaseDate: "2026-01-15",
      cost: 18000,
      usefulLife: 3,
      salvageValue: 2000,
      depreciationMethod: "straight-line",
      pool: "A",
      status: "active"
    },
    {
      id: "2",
      name: "Office Desk Set",
      category: "Furniture & Fixtures",
      purchaseDate: "2026-02-20",
      cost: 12000,
      usefulLife: 5,
      salvageValue: 1000,
      depreciationMethod: "straight-line",
      pool: "B",
      status: "active"
    },
    {
      id: "3",
      name: "Toyota Camry",
      category: "Motor Vehicle",
      purchaseDate: "2026-03-10",
      cost: 280000,
      usefulLife: 5,
      salvageValue: 50000,
      depreciationMethod: "straight-line",
      pool: "B",
      status: "active"
    },
    {
      id: "4",
      name: "Canon Printer",
      category: "Office Equipment",
      purchaseDate: "2026-04-05",
      cost: 8000,
      usefulLife: 4,
      salvageValue: 500,
      depreciationMethod: "straight-line",
      pool: "A",
      status: "active"
    }
  ]);

  const [schedule, setSchedule] = useState<DepreciationSchedule[]>([]);
  const [totalBookDepreciation, setTotalBookDepreciation] = useState(0);
  const [totalTaxAllowances, setTotalTaxAllowances] = useState(0);

  // Calculate book depreciation (straight-line method)
  const calculateBookDepreciation = (asset: FixedAsset) => {
    return (asset.cost - asset.salvageValue) / asset.usefulLife;
  };

  // Calculate IRD tax allowances
  const calculateTaxAllowances = (asset: FixedAsset) => {
    const poolRate = asset.pool === "A" ? 0.30 : asset.pool === "B" ? 0.20 : 0.10;
    
    // Initial allowance: 60% for qualifying plant/machinery purchased on or after specific dates
    // Standard initial allowance: 20% for most assets
    const initialAllowanceRate = 0.20; // Standard rate
    const initialAllowance = asset.cost * initialAllowanceRate;
    
    // Annual allowance on reducing balance
    const afterInitial = asset.cost - initialAllowance;
    const annualAllowance = afterInitial * poolRate;
    
    // Tax written down value
    const taxWDV = afterInitial - annualAllowance;
    
    return {
      initialAllowance,
      annualAllowance,
      taxWDV
    };
  };

  // Generate depreciation schedule
  useEffect(() => {
    const newSchedule: DepreciationSchedule[] = assets.map(asset => {
      const bookDepreciationPerYear = calculateBookDepreciation(asset);
      const accumulatedDepreciation = bookDepreciationPerYear * 0.5; // Assuming half year for demo
      const bookWDV = asset.cost - accumulatedDepreciation;
      
      const taxAllowances = calculateTaxAllowances(asset);
      const timingDifference = bookDepreciationPerYear - taxAllowances.annualAllowance;
      
      return {
        assetName: asset.name,
        cost: asset.cost,
        usefulLife: asset.usefulLife,
        bookDepreciationPerYear,
        accumulatedDepreciation,
        bookWDV,
        pool: asset.pool,
        initialAllowance: taxAllowances.initialAllowance,
        annualAllowance: taxAllowances.annualAllowance,
        taxWDV: taxAllowances.taxWDV,
        timingDifference
      };
    });
    
    setSchedule(newSchedule);
    
    // Calculate totals
    const totalBook = newSchedule.reduce((sum, item) => sum + item.bookDepreciationPerYear, 0);
    const totalTax = newSchedule.reduce((sum, item) => sum + item.annualAllowance, 0);
    
    setTotalBookDepreciation(totalBook);
    setTotalTaxAllowances(totalTax);
  }, [assets]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPoolColor = (pool: string) => {
    switch(pool) {
      case "A": return "bg-blue-100 text-blue-800";
      case "B": return "bg-green-100 text-green-800";
      case "C": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="hk-page">
      <div className="hk-card">
        <div className="hk-card-h">
          <h3>📉 Depreciation: Book vs Tax</h3>
        </div>

        <div className="hk-alert hk-a-info">
          HK IRD Pooling Rules: Pool A (30% - computers/electronics), Pool B (20% - vehicles/furniture), Pool C (10% - buildings). Timing differences between book depreciation and tax allowances may create deferred tax balances.
        </div>

        <div className="hk-grid hk-g2" style={{ marginBottom: "14px" }}>
          <div className="hk-stat" style={{ "--c": "var(--blue)" } as React.CSSProperties}>
            <div className="lb">Book Depreciation/yr</div>
            <div className="vl">{formatCurrency(totalBookDepreciation)}</div>
          </div>
          <div className="hk-stat" style={{ "--c": "var(--purple)" } as React.CSSProperties}>
            <div className="lb">IRD Tax Allowances/yr</div>
            <div className="vl">{formatCurrency(totalTaxAllowances)}</div>
          </div>
        </div>

        <div className="hk-tw">
          <table className="hk-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th className="hk-nm">Cost</th>
                <th className="hk-nm">Life</th>
                <th className="hk-nm">Book Depr/yr</th>
                <th className="hk-nm">Acc.Depr</th>
                <th className="hk-nm">Book WDV</th>
                <th>Pool</th>
                <th className="hk-nm">Init.Allow</th>
                <th className="hk-nm">Ann.Allow</th>
                <th className="hk-nm">Tax WDV</th>
                <th className="hk-nm">Timing Diff</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, index) => (
                <tr key={index}>
                  <td>{item.assetName}</td>
                  <td className="hk-nm">{formatCurrency(item.cost)}</td>
                  <td className="hk-nm">{item.usefulLife}</td>
                  <td className="hk-nm">{formatCurrency(item.bookDepreciationPerYear)}</td>
                  <td className="hk-nm">{formatCurrency(item.accumulatedDepreciation)}</td>
                  <td className="hk-nm">{formatCurrency(item.bookWDV)}</td>
                  <td>
                    <span className={`hk-badge ${
                      item.pool === "A" ? "hk-b-blue" :
                      item.pool === "B" ? "hk-b-green" :
                      "hk-b-purple"
                    }`}>
                      Pool {item.pool} ({item.pool === "A" ? "30%" : item.pool === "B" ? "20%" : "10%"})
                    </span>
                  </td>
                  <td className="hk-nm">{formatCurrency(item.initialAllowance)}</td>
                  <td className="hk-nm">{formatCurrency(item.annualAllowance)}</td>
                  <td className="hk-nm">{formatCurrency(item.taxWDV)}</td>
                  <td className="hk-nm" style={{ color: item.timingDifference > 0 ? "var(--green)" : "var(--red)" }}>
                    {formatCurrency(item.timingDifference)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hk-grid hk-g3">
        <div className="hk-notes-box">
          <h4>Pool A (30%)</h4>
          <ul>
            <li>Computers, printers, software, telecommunications equipment.</li>
            <li>{formatCurrency(schedule.filter(s => s.pool === "A").reduce((sum, s) => sum + s.cost, 0))}</li>
          </ul>
        </div>
        <div className="hk-notes-box">
          <h4>Pool B (20%)</h4>
          <ul>
            <li>Motor vehicles, furniture, fixtures, plant & machinery.</li>
            <li>{formatCurrency(schedule.filter(s => s.pool === "B").reduce((sum, s) => sum + s.cost, 0))}</li>
          </ul>
        </div>
        <div className="hk-notes-box">
          <h4>Pool C (10%)</h4>
          <ul>
            <li>Buildings, structural improvements, leasehold improvements.</li>
            <li>{formatCurrency(schedule.filter(s => s.pool === "C").reduce((sum, s) => sum + s.cost, 0))}</li>
          </ul>
        </div>
      </div>

      <div className="hk-notes-box">
        <h4>HK Accounting Implications</h4>
        <ul>
          <li>Timing differences arise when book depreciation does not match tax allowances.</li>
          <li>Deferred tax is measured using the relevant profits tax rate.</li>
          <li>Tax WDV is the basis for future tax allowance calculations.</li>
          <li>Separate book and tax records should be retained for at least 7 years.</li>
        </ul>
      </div>
    </div>
  );
}
