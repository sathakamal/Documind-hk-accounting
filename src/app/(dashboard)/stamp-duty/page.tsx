"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Info, Home, TrendingUp, FileText } from "lucide-react";

interface StampDutyCalculation {
  propertyValue: number;
  buyerType: "hk1" | "hk2" | "non";
  stampDuty: number;
  breakdown: Array<{ description: string; amount: number }>;
}

interface ShareStampDuty {
  shareValue: number;
  stampDuty: number;
}

interface LeaseStampDuty {
  monthlyRent: number;
  termMonths: number;
  premium: number;
  stampDuty: number;
}

export default function StampDutyCalculatorPage() {
  const [activeTab, setActiveTab] = useState<"property" | "shares" | "lease">("property");
  
  // Property stamp duty inputs
  const [propertyValue, setPropertyValue] = useState<number>(8000000);
  const [buyerType, setBuyerType] = useState<"hk1" | "hk2" | "non">("hk1");
  const [propertyCalculation, setPropertyCalculation] = useState<StampDutyCalculation | null>(null);
  
  // Share stamp duty inputs
  const [shareValue, setShareValue] = useState<number>(1000000);
  const [shareCalculation, setShareCalculation] = useState<ShareStampDuty | null>(null);
  
  // Lease stamp duty inputs
  const [monthlyRent, setMonthlyRent] = useState<number>(50000);
  const [termMonths, setTermMonths] = useState<number>(24);
  const [premium, setPremium] = useState<number>(0);
  const [leaseCalculation, setLeaseCalculation] = useState<LeaseStampDuty | null>(null);

  // Calculate property stamp duty based on HK rates
  const calculatePropertyStampDuty = () => {
    let stampDuty = 0;
    const breakdown: Array<{ description: string; amount: number }> = [];
    
    // Basic Stamp Duty (Ad Valorem Stamp Duty)
    if (propertyValue <= 2000000) {
      const duty = propertyValue * 0.015; // 1.5%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (1.5%)", amount: duty });
    } else if (propertyValue <= 2176470) {
      const duty = 30000 + (propertyValue - 2000000) * 0.10; // HK$30,000 + 10%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (HK$30,000 + 10%)", amount: duty });
    } else if (propertyValue <= 3000000) {
      const duty = propertyValue * 0.03; // 3%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (3%)", amount: duty });
    } else if (propertyValue <= 3290330) {
      const duty = 90000 + (propertyValue - 3000000) * 0.10; // HK$90,000 + 10%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (HK$90,000 + 10%)", amount: duty });
    } else if (propertyValue <= 4000000) {
      const duty = propertyValue * 0.045; // 4.5%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (4.5%)", amount: duty });
    } else if (propertyValue <= 4428580) {
      const duty = 180000 + (propertyValue - 4000000) * 0.10; // HK$180,000 + 10%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (HK$180,000 + 10%)", amount: duty });
    } else if (propertyValue <= 6000000) {
      const duty = propertyValue * 0.06; // 6%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (6%)", amount: duty });
    } else if (propertyValue <= 6720000) {
      const duty = 360000 + (propertyValue - 6000000) * 0.10; // HK$360,000 + 10%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (HK$360,000 + 10%)", amount: duty });
    } else if (propertyValue <= 20000000) {
      const duty = propertyValue * 0.075; // 7.5%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (7.5%)", amount: duty });
    } else if (propertyValue <= 21739130) {
      const duty = 1500000 + (propertyValue - 20000000) * 0.10; // HK$1,500,000 + 10%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (HK$1,500,000 + 10%)", amount: duty });
    } else {
      const duty = propertyValue * 0.085; // 8.5%
      stampDuty += duty;
      breakdown.push({ description: "Basic Stamp Duty (8.5%)", amount: duty });
    }
    
    // Buyer's Stamp Duty (BSD) - for non-HK residents or companies
    if (buyerType === "non") {
      const bsd = propertyValue * 0.15; // 15%
      stampDuty += bsd;
      breakdown.push({ description: "Buyer's Stamp Duty (15%)", amount: bsd });
    }
    
    // Additional Stamp Duty (ASD) - for second or subsequent properties
    if (buyerType === "hk2") {
      const asd = propertyValue * 0.15; // 15%
      stampDuty += asd;
      breakdown.push({ description: "Additional Stamp Duty (15%)", amount: asd });
    }
    
    // Special Stamp Duty (SSD) - if property sold within 3 years
    // Note: This is typically paid by seller, not buyer
    const ssd = propertyValue * 0.10; // 10% if sold within 6-12 months
    breakdown.push({ description: "Special Stamp Duty (Seller, 10% if sold within 1 year)", amount: ssd });
    
    setPropertyCalculation({
      propertyValue,
      buyerType,
      stampDuty,
      breakdown
    });
  };

  // Calculate share stamp duty
  const calculateShareStampDuty = () => {
    // Share transfer stamp duty: 0.2% of consideration or value (whichever is higher)
    const stampDuty = shareValue * 0.002; // 0.2%
    
    setShareCalculation({
      shareValue,
      stampDuty
    });
  };

  // Calculate lease stamp duty
  const calculateLeaseStampDuty = () => {
    let stampDuty = 0;
    
    // Calculate annual rent
    const annualRent = monthlyRent * 12;
    
    // Lease stamp duty calculation based on HK rates
    if (annualRent === 0) {
      stampDuty = 0;
    } else if (annualRent <= 2000) {
      stampDuty = 0;
    } else if (annualRent <= 400000) {
      stampDuty = annualRent * 0.01; // 1%
    } else if (annualRent <= 800000) {
      stampDuty = 4000 + (annualRent - 400000) * 0.02; // HK$4,000 + 2%
    } else {
      stampDuty = 12000 + (annualRent - 800000) * 0.03; // HK$12,000 + 3%
    }
    
    // Add premium/deposit duty (0.25% of premium)
    const premiumDuty = premium * 0.0025; // 0.25%
    stampDuty += premiumDuty;
    
    setLeaseCalculation({
      monthlyRent,
      termMonths,
      premium,
      stampDuty
    });
  };

  // Recalculate based on active tab
  useEffect(() => {
    if (activeTab === "property") {
      calculatePropertyStampDuty();
    } else if (activeTab === "shares") {
      calculateShareStampDuty();
    } else if (activeTab === "lease") {
      calculateLeaseStampDuty();
    }
  }, [activeTab, propertyValue, buyerType, shareValue, monthlyRent, termMonths, premium]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBuyerTypeDescription = (type: string) => {
    switch(type) {
      case "hk1": return "Hong Kong Resident (First Home)";
      case "hk2": return "Hong Kong Resident (Second or Subsequent Property)";
      case "non": return "Non-HK Resident or Company";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stamp Duty Calculator</h1>
          <p className="text-muted-foreground">
            Hong Kong Property, Share, and Lease Stamp Duty Calculator
          </p>
        </div>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Stamp Duty Regulations:</strong> Property transactions subject to Basic Stamp Duty (AVD), 
          Additional Stamp Duty (ASD) for second properties, Buyer's Stamp Duty (BSD) for non-residents. 
          Share transfers: 0.2% of consideration. Leases: progressive rates based on annual rent.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "property" | "shares" | "lease")}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="property" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Property
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Shares
          </TabsTrigger>
          <TabsTrigger value="lease" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lease
          </TabsTrigger>
        </TabsList>

        <TabsContent value="property">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Stamp Duty Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property-value">Property Value (HK$)</Label>
                    <Input
                      id="property-value"
                      type="number"
                      value={propertyValue}
                      onChange={(e) => setPropertyValue(Number(e.target.value))}
                      min="0"
                      step="1000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyer-type">Buyer Type</Label>
                    <Select
                      value={buyerType}
                      onValueChange={(value: "hk1" | "hk2" | "non") => setBuyerType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select buyer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hk1">HK Resident (First Home)</SelectItem>
                        <SelectItem value="hk2">HK Resident (Second+)</SelectItem>
                        <SelectItem value="non">Non-HK Resident / Company</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {getBuyerTypeDescription(buyerType)}
                    </p>
                  </div>
                </div>

                {propertyCalculation && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Stamp Duty Payable</div>
                      <div className="text-3xl font-bold mt-1 text-blue-700">
                        {formatCurrency(propertyCalculation.stampDuty)}
                      </div>
                      <div className="text-sm text-blue-600 mt-2">
                        {propertyCalculation.breakdown.length} component(s)
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Breakdown</h4>
                      <div className="space-y-1">
                        {propertyCalculation.breakdown.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.description}</span>
                            <span className="font-mono">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>HK Stamp Duty Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Basic Stamp Duty (AVD)</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Up to HK$2,000,000</span>
                        <span className="font-mono">1.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HK$2,000,001 - HK$3,000,000</span>
                        <span className="font-mono">3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HK$3,000,001 - HK$4,000,000</span>
                        <span className="font-mono">4.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HK$4,000,001 - HK$6,000,000</span>
                        <span className="font-mono">6%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>HK$6,000,001 - HK$20,000,000</span>
                        <span className="font-mono">7.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Over HK$20,000,000</span>
                        <span className="font-mono">8.5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Additional Duties</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Buyer's Stamp Duty (BSD)</span>
                        <Badge className="bg-red-100 text-red-800">15%</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Applies to non-HK residents and companies
                      </div>
                      <div className="flex justify-between mt-2">
                        <span>Additional Stamp Duty (ASD)</span>
                        <Badge className="bg-orange-100 text-orange-800">15%</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Applies to HK residents buying second+ property
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="shares">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Share Transfer Stamp Duty Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="share-value">Share Value / Consideration (HK$)</Label>
                    <Input
                      id="share-value"
                      type="number"
                      value={shareValue}
                      onChange={(e) => setShareValue(Number(e.target.value))}
                      min="0"
                      step="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher of actual consideration or market value
                    </p>
                  </div>
                </div>

                {shareCalculation && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-muted-foreground">Share Transfer Stamp Duty</div>
                      <div className="text-3xl font-bold mt-1 text-blue-700">
                        {formatCurrency(shareCalculation.stampDuty)}
                      </div>
                      <div className="text-sm text-blue-600 mt-2">
                        Rate: 0.2% of consideration
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Important Notes</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Stamp duty payable by both buyer and seller (0.1% each)</li>
                        <li>• Total duty: 0.2% of consideration</li>
                        <li>• Due within 30 days of agreement</li>
                        <li>• Applies to HK-listed and unlisted shares</li>
                        <li>• Exemptions may apply for certain transfers</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share Stamp Duty Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Calculation Example</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Share Consideration:</span>
                        <span className="font-mono">{formatCurrency(shareValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Buyer's Duty (0.1%):</span>
                        <span className="font-mono">{formatCurrency(shareValue * 0.001)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seller's Duty (0.1%):</span>
                        <span className="font-mono">{formatCurrency(shareValue * 0.001)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total Duty Payable:</span>
                        <span className="font-mono">{formatCurrency(shareValue * 0.002)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Compliance Requirements</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Stamp duty must be paid before share transfer can be registered</li>
                      <li>• Late payment penalty: 10x duty amount</li>
                      <li>• Must be paid within 30 days of agreement</li>
                      <li>• Penalty for evasion: up to HK$50,000 + 3x duty</li>
                      <li>• Records must be kept for 7 years</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lease">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lease Stamp Duty Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly-rent">Monthly Rent (HK$)</Label>
                      <Input
                        id="monthly-rent"
                        type="number"
                        value={monthlyRent}
                        onChange={(e) => setMonthlyRent(Number(e.target.value))}
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="term-months">Lease Term (Months)</Label>
                      <Input
                        id="term-months"
                        type="number"
                        value={termMonths}
                        onChange={(e) => setTermMonths(Number(e.target.value))}
                        min="1"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="premium">Premium / Deposit (HK$)</Label>
                    <Input
                      id="premium"
                      type="number"
                      value={premium}
                      onChange={(e) => setPremium(Number(e.target.value))}
                      min="0"
                      step="1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lump sum payment in addition to rent
                    </p>
                  </div>
                </div>

                {leaseCalculation && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Lease Stamp Duty</div>
                      <div className="text-3xl font-bold mt-1 text-blue-700">
                        {formatCurrency(leaseCalculation.stampDuty)}
                      </div>
                      <div className="text-sm text-blue-600 mt-2">
                        Based on annual rent of {formatCurrency(monthlyRent * 12)}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Lease Stamp Duty Rates</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Annual Rent ≤ HK$2,000</span>
                          <span className="font-mono">Exempt</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HK$2,001 - HK$400,000</span>
                          <span className="font-mono">1% of annual rent</span>
                        </div>
                        <div className="flex justify-between">
                          <span>HK$400,001 - HK$800,000</span>
                          <span className="font-mono">HK$4,000 + 2% of excess</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Over HK$800,000</span>
                          <span className="font-mono">HK$12,000 + 3% of excess</span>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span>Premium / Deposit</span>
                          <span className="font-mono">0.25% of premium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lease Stamp Duty Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Annual Rent Calculation</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Monthly Rent:</span>
                        <span className="font-mono">{formatCurrency(monthlyRent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Rent (×12):</span>
                        <span className="font-mono">{formatCurrency(monthlyRent * 12)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Lease Term:</span>
                        <span className="font-mono">{termMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Rent Payable:</span>
                        <span className="font-mono">{formatCurrency(monthlyRent * termMonths)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Important Compliance Notes</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Stamp duty must be paid within 30 days of lease execution</li>
                      <li>• Both landlord and tenant are jointly liable</li>
                      <li>• Late payment penalty: 10x duty amount</li>
                      <li>• Unstamped lease cannot be used as evidence in court</li>
                      <li>• Must be stamped within 30 days of execution</li>
                      <li>• Records must be kept for 7 years</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Alert className="bg-green-50 border-green-200">
        <AlertDescription>
          <strong>Important:</strong> This calculator provides estimates based on current HK stamp duty rates. 
          Actual duty payable may vary based on specific circumstances, exemptions, and reliefs. 
          Consult with a qualified professional for specific advice.
        </AlertDescription>
      </Alert>
    </div>
  );
}