"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Depreciation Schedule</h1>
          <p className="text-muted-foreground">
            Book vs Tax Depreciation Comparison
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>HK IRD Pooling Rules:</strong> Pool A (30% – computers/electronics), Pool B (20% – vehicles/furniture), Pool C (10% – buildings). 
          Initial allowance = 60% for qualifying plant/machinery purchased on or after specific dates (standard 20%). 
          Timing differences create deferred tax assets/liabilities.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-blue-600">📊</span>
              Book Depreciation (Annual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalBookDepreciation)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Straight-line method over useful life
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-purple-600">🧾</span>
              IRD Tax Allowances (Annual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalTaxAllowances)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Reducing balance method per IRD pools
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Depreciation Schedule: Book vs Tax Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Life (yrs)</TableHead>
                  <TableHead className="text-right">Book Depr/yr</TableHead>
                  <TableHead className="text-right">Acc. Depr</TableHead>
                  <TableHead className="text-right">Book WDV</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead className="text-right">Init. Allow</TableHead>
                  <TableHead className="text-right">Ann. Allow</TableHead>
                  <TableHead className="text-right">Tax WDV</TableHead>
                  <TableHead className="text-right">Timing Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.assetName}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.cost)}</TableCell>
                    <TableCell className="text-right">{item.usefulLife}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.bookDepreciationPerYear)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.accumulatedDepreciation)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.bookWDV)}</TableCell>
                    <TableCell>
                      <Badge className={getPoolColor(item.pool)}>
                        Pool {item.pool} ({item.pool === "A" ? "30%" : item.pool === "B" ? "20%" : "10%"})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.initialAllowance)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.annualAllowance)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(item.taxWDV)}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={item.timingDifference > 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(item.timingDifference)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">HK Accounting Implications:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Timing Differences:</strong> When book depreciation ≠ tax allowances, deferred tax assets/liabilities arise</li>
              <li>• <strong>Deferred Tax:</strong> Timing differences multiplied by tax rate (16.5% for corporations)</li>
              <li>• <strong>Tax Base:</strong> Tax WDV is used for future tax allowance calculations</li>
              <li>• <strong>Disposal:</strong> Balancing charge/allowance on disposal when proceeds ≠ tax WDV</li>
              <li>• <strong>Compliance:</strong> Must maintain separate book and tax records for 7 years (Cap. 622)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IRD Pool Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Pool A (30%)</h3>
                <Badge className="bg-blue-100 text-blue-800">Computers & Electronics</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Computers, printers, software, telecommunications equipment
              </p>
              <div className="mt-2 text-lg font-semibold">
                {formatCurrency(schedule.filter(s => s.pool === "A").reduce((sum, s) => sum + s.cost, 0))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Pool B (20%)</h3>
                <Badge className="bg-green-100 text-green-800">Vehicles & Furniture</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Motor vehicles, furniture, fixtures, plant & machinery
              </p>
              <div className="mt-2 text-lg font-semibold">
                {formatCurrency(schedule.filter(s => s.pool === "B").reduce((sum, s) => sum + s.cost, 0))}
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Pool C (10%)</h3>
                <Badge className="bg-purple-100 text-purple-800">Buildings</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Buildings, structural improvements, leasehold improvements
              </p>
              <div className="mt-2 text-lg font-semibold">
                {formatCurrency(schedule.filter(s => s.pool === "C").reduce((sum, s) => sum + s.cost, 0))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}