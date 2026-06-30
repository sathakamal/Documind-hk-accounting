"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Info, Calculator, TrendingUp } from "lucide-react";

interface TaxCalculation {
  assessableProfit: number;
  entityType: "corporation" | "unincorporated";
  taxRateTier1: number;
  taxRateTier2: number;
  threshold: number;
  taxTier1: number;
  taxTier2: number;
  totalTax: number;
  effectiveRate: number;
  provisionalTaxPaid: number;
  taxPayable: number;
  taxRefund: number;
}

export default function ProfitsTaxCalculatorPage() {
  const [assessableProfit, setAssessableProfit] = useState<number>(2500000);
  const [entityType, setEntityType] = useState<"corporation" | "unincorporated">("corporation");
  const [provisionalTaxPaid, setProvisionalTaxPaid] = useState<number>(300000);
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null);
  const [examples, setExamples] = useState<Array<{ profit: number; corpTax: number; unincTax: number }>>([]);

  // HK Profits Tax calculation with two-tiered rates
  const calculateProfitsTax = () => {
    const THRESHOLD = 2000000; // HK$2,000,000
    
    // Tax rates based on entity type
    const rates = {
      corporation: { tier1: 0.0825, tier2: 0.165 }, // 8.25% and 16.5%
      unincorporated: { tier1: 0.075, tier2: 0.15 }  // 7.5% and 15%
    };
    
    const { tier1, tier2 } = rates[entityType];
    
    let taxTier1 = 0;
    let taxTier2 = 0;
    
    if (assessableProfit <= THRESHOLD) {
      // Entire profit in tier 1
      taxTier1 = assessableProfit * tier1;
    } else {
      // First HK$2M in tier 1, remainder in tier 2
      taxTier1 = THRESHOLD * tier1;
      taxTier2 = (assessableProfit - THRESHOLD) * tier2;
    }
    
    const totalTax = taxTier1 + taxTier2;
    const effectiveRate = (totalTax / assessableProfit) * 100;
    
    const taxPayable = Math.max(0, totalTax - provisionalTaxPaid);
    const taxRefund = Math.max(0, provisionalTaxPaid - totalTax);
    
    setCalculation({
      assessableProfit,
      entityType,
      taxRateTier1: tier1 * 100,
      taxRateTier2: tier2 * 100,
      threshold: THRESHOLD,
      taxTier1,
      taxTier2,
      totalTax,
      effectiveRate,
      provisionalTaxPaid,
      taxPayable,
      taxRefund
    });
  };

  // Generate example calculations
  useEffect(() => {
    const exampleProfits = [500000, 1000000, 2000000, 3000000, 5000000, 10000000];
    const examples = exampleProfits.map(profit => {
      // Corporation tax
      let corpTax = 0;
      if (profit <= 2000000) {
        corpTax = profit * 0.0825;
      } else {
        corpTax = (2000000 * 0.0825) + ((profit - 2000000) * 0.165);
      }
      
      // Unincorporated tax
      let unincTax = 0;
      if (profit <= 2000000) {
        unincTax = profit * 0.075;
      } else {
        unincTax = (2000000 * 0.075) + ((profit - 2000000) * 0.15);
      }
      
      return {
        profit,
        corpTax: Math.round(corpTax),
        unincTax: Math.round(unincTax)
      };
    });
    
    setExamples(examples);
  }, []);

  // Recalculate when inputs change
  useEffect(() => {
    calculateProfitsTax();
  }, [assessableProfit, entityType, provisionalTaxPaid]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profits Tax Calculator</h1>
          <p className="text-muted-foreground">
            Hong Kong Two-Tiered Profits Tax Calculator
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Two-Tiered Tax System:</strong> Corporations: 8.25% on first HK$2M, 16.5% remainder. 
          Unincorporated: 7.5% / 15%. One group entity only can claim tiered rates. 
          Provisional tax based on prior year's tax payable.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Profits Tax Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profit">Assessable Profits (HK$)</Label>
                <Input
                  id="profit"
                  type="number"
                  value={assessableProfit}
                  onChange={(e) => setAssessableProfit(Number(e.target.value))}
                  min="0"
                  step="1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select
                  value={entityType}
                  onValueChange={(value: "corporation" | "unincorporated") => setEntityType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="unincorporated">Unincorporated Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provisional-tax">Provisional Tax Paid</Label>
                <Input
                  id="provisional-tax"
                  type="number"
                  value={provisionalTaxPaid}
                  onChange={(e) => setProvisionalTaxPaid(Number(e.target.value))}
                  min="0"
                  step="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Based on prior year's tax payable (usually 75% + 75%)
                </p>
              </div>
            </div>

            {calculation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Tier 1 Tax (First HK$2M)</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(calculation.taxTier1)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPercentage(calculation.taxRateTier1)} rate
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Tier 2 Tax (Remainder)</div>
                    <div className="text-2xl font-bold mt-1">{formatCurrency(calculation.taxTier2)}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPercentage(calculation.taxRateTier2)} rate
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Profits Tax</div>
                  <div className="text-3xl font-bold mt-1 text-blue-700">
                    {formatCurrency(calculation.totalTax)}
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    Effective rate: {formatPercentage(calculation.effectiveRate)}
                  </div>
                  <Progress 
                    value={calculation.effectiveRate} 
                    max={16.5}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 border rounded-lg ${calculation.taxPayable > 0 ? 'bg-red-50 border-red-200' : ''}`}>
                    <div className="text-sm text-muted-foreground">Tax Payable</div>
                    <div className={`text-2xl font-bold mt-1 ${calculation.taxPayable > 0 ? 'text-red-700' : ''}`}>
                      {formatCurrency(calculation.taxPayable)}
                    </div>
                  </div>
                  
                  <div className={`p-4 border rounded-lg ${calculation.taxRefund > 0 ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="text-sm text-muted-foreground">Tax Refund</div>
                    <div className={`text-2xl font-bold mt-1 ${calculation.taxRefund > 0 ? 'text-green-700' : ''}`}>
                      {formatCurrency(calculation.taxRefund)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tax Rate Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessable Profits</TableHead>
                    <TableHead className="text-right">Corporation Tax</TableHead>
                    <TableHead className="text-right">Unincorporated Tax</TableHead>
                    <TableHead className="text-right">Savings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examples.map((example, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{formatCurrency(example.profit)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(example.corpTax)}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(example.unincTax)}</TableCell>
                      <TableCell className="text-right font-mono">
                        <Badge className={
                          example.corpTax < example.unincTax 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }>
                          {formatCurrency(Math.abs(example.corpTax - example.unincTax))}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">HK Profits Tax Key Features:</h3>
              <ul className="text-sm space-y-2">
                <li>
                  • <strong>Territorial Source Principle:</strong> Only profits arising in or derived from HK are taxable
                </li>
                <li>
                  • <strong>No Capital Gains Tax:</strong> Capital gains are generally not taxable
                </li>
                <li>
                  • <strong>No VAT/GST:</strong> Hong Kong has no value-added tax or goods and services tax
                </li>
                <li>
                  • <strong>No Dividend Withholding Tax:</strong> Dividends paid to shareholders are not subject to withholding tax
                </li>
                <li>
                  • <strong>No Sales Tax:</strong> No general sales tax on goods or services
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profits Tax Compliance Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Filing Deadlines</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>First Return:</strong> April (Year 1 + 18 months)</li>
                  <li>• <strong>Annual Return:</strong> Within 1 month of notice</li>
                  <li>• <strong>Payment:</strong> Usually January & April</li>
                  <li>• <strong>Extension:</strong> Can apply for 1-month extension</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Penalties</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Late filing:</strong> HK$10,000 + 5% surcharge</li>
                  <li>• <strong>Under-declaration:</strong> 3x tax undercharged</li>
                  <li>• <strong>Willful evasion:</strong> Up to HK$50,000 + imprisonment</li>
                  <li>• <strong>Interest:</strong> 5% per annum on overdue tax</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Tax Incentives</h4>
                <ul className="text-sm space-y-1">
                  <li>• <strong>R&D Deduction:</strong> 300% enhanced deduction</li>
                  <li>• <strong>Qualifying Debt:</strong> Interest deduction for qualifying debt</li>
                  <li>• <strong>Reinsurance:</strong> 50% tax reduction for qualifying reinsurance</li>
                  <li>• <strong>Funds:</strong> Tax exemption for qualifying funds</li>
                  <li>• <strong>Corporate Treasury:</strong> Tax concessions for treasury activities</li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Important Notes</h4>
                <ul className="text-sm space-y-1">
                  <li>• Two-tiered rates apply to one group entity only</li>
                  <li>• Provisional tax = 100% of prior year tax (75% + 75%)</li>
                  <li>• Can apply for holdover of provisional tax</li>
                  <li>• Tax losses can be carried forward indefinitely</li>
                  <li>• Must maintain records for 7 years (Cap. 622)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold mb-2">Tax Planning Considerations:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Entity Structure:</strong> Consider corporation vs unincorporated for tax efficiency</li>
              <li>• <strong>Group Planning:</strong> Allocate profits among group entities to maximize tiered rates</li>
              <li>• <strong>Timing:</strong> Consider timing of income recognition and expense deduction</li>
              <li>• <strong>Incentives:</strong> Maximize use of R&D and other tax incentives</li>
              <li>• <strong>Transfer Pricing:</strong> Ensure related party transactions are at arm's length</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-green-50 border-green-200">
        <AlertDescription>
          <strong>Important:</strong> This calculator provides an estimate based on HK two-tiered profits tax rates. 
          Actual tax liability may vary based on specific circumstances, deductions, and exemptions. 
          Consult with a qualified tax advisor for professional advice.
        </AlertDescription>
      </Alert>
    </div>
  );
}