"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator } from "lucide-react";

interface TaxAdjustment {
  description: string;
  amount: number;
  type: "add" | "deduct";
  category: string;
}

interface TaxComputation {
  accountingProfit: number;
  adjustments: TaxAdjustment[];
  assessableProfit: number;
  taxLossCarryForward: number;
  charitableDonations: number;
  offshoreProfits: number;
  taxPayable: number;
}

export default function TaxComputationPage() {
  const [accountingProfit, setAccountingProfit] = useState<number>(1500000);
  const [taxLossCarryForward, setTaxLossCarryForward] = useState<number>(0);
  const [charitableDonations, setCharitableDonations] = useState<number>(50000);
  const [offshoreProfits, setOffshoreProfits] = useState<number>(300000);
  const [nonDeductibleEntertainment, setNonDeductibleEntertainment] = useState<number>(20000);
  const [rdEnhancedDeduction, setRdEnhancedDeduction] = useState<number>(100000);
  
  const [computation, setComputation] = useState<TaxComputation>({
    accountingProfit: 0,
    adjustments: [],
    assessableProfit: 0,
    taxLossCarryForward: 0,
    charitableDonations: 0,
    offshoreProfits: 0,
    taxPayable: 0
  });

  // Calculate tax computation
  const calculateTaxComputation = () => {
    const adjustments: TaxAdjustment[] = [
      // Non-deductible items (add back)
      { description: "Non-deductible Entertainment", amount: nonDeductibleEntertainment, type: "add", category: "non-deductible" },
      { description: "Depreciation (Book)", amount: 120000, type: "add", category: "timing-difference" },
      { description: "Provisions (General)", amount: 50000, type: "add", category: "non-deductible" },
      
      // Deductible items
      { description: "Tax Depreciation Allowances", amount: 180000, type: "deduct", category: "timing-difference" },
      { description: "R&D Enhanced Deduction (300%)", amount: rdEnhancedDeduction * 3, type: "deduct", category: "incentive" },
      { description: "Offshore Profits (Exempt)", amount: offshoreProfits, type: "deduct", category: "exemption" },
      { description: "Tax Loss B/F", amount: taxLossCarryForward, type: "deduct", category: "loss" },
    ];

    // Calculate net adjustments
    const addBackTotal = adjustments
      .filter(adj => adj.type === "add")
      .reduce((sum, adj) => sum + adj.amount, 0);
    
    const deductionsTotal = adjustments
      .filter(adj => adj.type === "deduct")
      .reduce((sum, adj) => sum + adj.amount, 0);
    
    const netAdjustment = addBackTotal - deductionsTotal;
    const assessableProfit = accountingProfit + netAdjustment;
    
    // Calculate charitable donations limit (max 35% of assessable profit)
    const maxCharitableDonations = assessableProfit * 0.35;
    const allowableDonations = Math.min(charitableDonations, maxCharitableDonations);
    
    // Final taxable profit
    const taxableProfit = Math.max(0, assessableProfit - allowableDonations);
    
    // Calculate tax (using two-tiered corporate rates)
    let taxPayable = 0;
    if (taxableProfit > 0) {
      if (taxableProfit <= 2000000) {
        taxPayable = taxableProfit * 0.0825; // 8.25% for first HK$2M
      } else {
        taxPayable = (2000000 * 0.0825) + ((taxableProfit - 2000000) * 0.165); // 16.5% for remainder
      }
    }

    setComputation({
      accountingProfit,
      adjustments,
      assessableProfit,
      taxLossCarryForward,
      charitableDonations: allowableDonations,
      offshoreProfits,
      taxPayable
    });
  };

  // Recalculate when inputs change
  useEffect(() => {
    calculateTaxComputation();
  }, [
    accountingProfit, 
    taxLossCarryForward, 
    charitableDonations, 
    offshoreProfits, 
    nonDeductibleEntertainment,
    rdEnhancedDeduction
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAdjustmentColor = (type: string) => {
    switch(type) {
      case "add": return "text-red-600";
      case "deduct": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const getCategoryBadge = (category: string) => {
    switch(category) {
      case "non-deductible": return <Badge className="bg-red-100 text-red-800">Non-deductible</Badge>;
      case "timing-difference": return <Badge className="bg-blue-100 text-blue-800">Timing Difference</Badge>;
      case "incentive": return <Badge className="bg-green-100 text-green-800">Tax Incentive</Badge>;
      case "exemption": return <Badge className="bg-purple-100 text-purple-800">Exemption</Badge>;
      case "loss": return <Badge className="bg-orange-100 text-orange-800">Tax Loss</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Computation</h1>
          <p className="text-muted-foreground">
            Accounting Profit to Assessable Profit (BIR51 Worksheet)
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Tax Computation Purpose:</strong> Reconciles accounting profit (HKFRS) to assessable profit (IRO s.14) 
          by adding back non-deductible items and deducting tax allowances. This forms the basis for Profits Tax Return (BIR51).
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Computation Inputs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accounting-profit">Accounting Profit (HKFRS)</Label>
                  <Input
                    id="accounting-profit"
                    type="number"
                    value={accountingProfit}
                    onChange={(e) => setAccountingProfit(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-loss">Tax Loss Carry Forward</Label>
                  <Input
                    id="tax-loss"
                    type="number"
                    value={taxLossCarryForward}
                    onChange={(e) => setTaxLossCarryForward(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charitable-donations">Charitable Donations</Label>
                  <Input
                    id="charitable-donations"
                    type="number"
                    value={charitableDonations}
                    onChange={(e) => setCharitableDonations(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum deduction: 35% of assessable profit
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="offshore-profits">Offshore Profits (Exempt)</Label>
                  <Input
                    id="offshore-profits"
                    type="number"
                    value={offshoreProfits}
                    onChange={(e) => setOffshoreProfits(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entertainment">Non-deductible Entertainment</Label>
                  <Input
                    id="entertainment"
                    type="number"
                    value={nonDeductibleEntertainment}
                    onChange={(e) => setNonDeductibleEntertainment(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rd-deduction">R&D Expenditure (Base)</Label>
                  <Input
                    id="rd-deduction"
                    type="number"
                    value={rdEnhancedDeduction}
                    onChange={(e) => setRdEnhancedDeduction(Number(e.target.value))}
                    min="0"
                    step="1000"
                  />
                  <p className="text-xs text-muted-foreground">
                    300% enhanced deduction applies
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Computation Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Accounting Profit:</span>
                <span className="font-mono font-semibold">{formatCurrency(computation.accountingProfit)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Net Adjustments:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(
                    computation.adjustments
                      .filter(adj => adj.type === "add")
                      .reduce((sum, adj) => sum + adj.amount, 0) -
                    computation.adjustments
                      .filter(adj => adj.type === "deduct")
                      .reduce((sum, adj) => sum + adj.amount, 0)
                  )}
                </span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="font-semibold">Assessable Profit:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatCurrency(computation.assessableProfit)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Charitable Donations:</span>
                <span className="font-mono">-{formatCurrency(computation.charitableDonations)}</span>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="font-semibold">Tax Payable:</span>
                  <span className="font-mono font-bold text-green-700">
                    {formatCurrency(computation.taxPayable)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Tax Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {computation.adjustments.map((adjustment, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{adjustment.description}</TableCell>
                    <TableCell>{getCategoryBadge(adjustment.category)}</TableCell>
                    <TableCell className={`text-right font-mono ${getAdjustmentColor(adjustment.type)}`}>
                      {adjustment.type === "add" ? "+" : "-"}{formatCurrency(adjustment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        adjustment.type === "add" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }>
                        {adjustment.type === "add" ? "Add Back" : "Deduct"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Key Tax Adjustments Explained</h3>
              <ul className="text-sm space-y-2">
                <li>
                  <strong>Non-deductible Entertainment:</strong> Only 50% of entertainment expenses are tax deductible in HK
                </li>
                <li>
                  <strong>Depreciation Timing Differences:</strong> Book depreciation vs tax allowances create deferred tax
                </li>
                <li>
                  <strong>Offshore Profits:</strong> Profits derived outside HK are tax exempt (IRO s.14)
                </li>
                <li>
                  <strong>R&D Enhanced Deduction:</strong> 300% deduction for qualifying R&D expenditure
                </li>
                <li>
                  <strong>Tax Losses:</strong> Can be carried forward indefinitely (no time limit)
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">HK Tax Compliance Notes</h3>
              <ul className="text-sm space-y-2">
                <li>
                  • <strong>Record Keeping:</strong> Must maintain tax computation records for 7 years
                </li>
                <li>
                  • <strong>Transfer Pricing:</strong> Related party transactions must be at arm's length
                </li>
                <li>
                  • <strong>Thin Capitalization:</strong> Interest deductions limited for excessive debt
                </li>
                <li>
                  • <strong>Controlled Foreign Company:</strong> CFC rules may apply to offshore subsidiaries
                </li>
                <li>
                  • <strong>Tax Avoidance:</strong> General anti-avoidance rule (GAAR) in IRO s.61A
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Computation Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold">Start with Accounting Profit (HKFRS)</h4>
                <p className="text-sm text-muted-foreground">
                  Net profit from audited financial statements prepared under HKFRS
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold">Add Back Non-Deductible Items</h4>
                <p className="text-sm text-muted-foreground">
                  Entertainment (50% disallowance), provisions, book depreciation, etc.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold">Deduct Tax Allowances & Exemptions</h4>
                <p className="text-sm text-muted-foreground">
                  Tax depreciation, offshore profits, tax losses, R&D deductions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <div>
                <h4 className="font-semibold">Apply Charitable Donations Limit</h4>
                <p className="text-sm text-muted-foreground">
                  Maximum 35% of assessable profit, excess carried forward 5 years
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 font-bold">5</span>
              </div>
              <div>
                <h4 className="font-semibold">Calculate Tax Payable</h4>
                <p className="text-sm text-muted-foreground">
                  Apply two-tiered rates (8.25%/16.5% for corporations)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}