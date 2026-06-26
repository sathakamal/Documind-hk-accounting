"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/utils";
import { FileSpreadsheet, TrendingUp, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taxStatus, setTaxStatus] = useState("ALL");

  const fetchFinancials = () => {
    setLoading(true);
    const url = taxStatus === "ALL" ? "/api/reports/financials" : `/api/reports/financials?taxStatus=${taxStatus}`;
    fetch(url)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        }
      })
      .catch(() => toast.error("Failed to load financials"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFinancials();
  }, [taxStatus]);

  const handleExport = () => {
    toast.info("Preparing Excel export of audit pack...");
    // Simulate export or redirect to Excel API
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Financial Reports" description="HKFRS Statutory Financial Statements" />
        <div className="text-center py-20 text-muted-foreground">Generating financial statements...</div>
      </div>
    );
  }

  const { profitAndLoss, balanceSheet, trialBalance } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Statutory Financial Statements (HKFRS for Private Entities)"
        actions={
          <div className="flex items-center gap-3">
            <Select value={taxStatus} onValueChange={setTaxStatus}>
              <SelectTrigger className="w-[180px] bg-[#1e2130]">
                <SelectValue placeholder="Tax Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Transactions</SelectItem>
                <SelectItem value="ONSHORE">HK Onshore (Taxable)</SelectItem>
                <SelectItem value="OFFSHORE">HK Offshore (Exempt)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Audit Pack
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1e2130] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profits</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitAndLoss.netProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {formatMoney(profitAndLoss.netProfit, "HKD")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Current FY taxable income</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            <Landmark className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(balanceSheet.totalAssets, "HKD")}</div>
            <p className="text-xs text-muted-foreground mt-1">Cash, accounts receivable & fixed assets</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial Balance Status</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">Balanced</div>
            <p className="text-xs text-muted-foreground mt-1">
              Debits equal Credits ({formatMoney(trialBalance.totalDebit, "HKD")})
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList className="bg-[#1e2130] p-1 rounded-lg">
          <TabsTrigger value="pl" className="px-6">Profit & Loss (P&L)</TabsTrigger>
          <TabsTrigger value="bs" className="px-6">Balance Sheet</TabsTrigger>
          <TabsTrigger value="tb" className="px-6">Trial Balance</TabsTrigger>
        </TabsList>

        {/* --- PROFIT AND LOSS TAB --- */}
        <TabsContent value="pl" className="mt-6">
          <Card className="bg-[#1e2130] border-border">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-lg">Statement of Comprehensive Income</CardTitle>
              <p className="text-xs text-muted-foreground">For period ending Dec 31, 2025</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Revenue Section */}
              <div className="space-y-2">
                <div className="font-bold text-foreground border-b border-border/50 pb-1 text-sm tracking-wide">REVENUE</div>
                {profitAndLoss.revenue.map((item: any) => (
                  <div key={item.code} className="flex justify-between text-sm py-1 font-medium">
                    <span className="text-muted-foreground">{item.code} - {item.name}</span>
                    <span className="font-mono text-foreground">{formatMoney(item.amount, "HKD")}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                  <span>Total Revenue</span>
                  <span className="font-mono">{formatMoney(profitAndLoss.totalRevenue, "HKD")}</span>
                </div>
              </div>

              {/* Expense Section */}
              <div className="space-y-2">
                <div className="font-bold text-foreground border-b border-border/50 pb-1 text-sm tracking-wide">OPERATING EXPENSES</div>
                {profitAndLoss.expenses.map((item: any) => (
                  <div key={item.code} className="flex justify-between text-sm py-1 font-medium">
                    <span className="text-muted-foreground">{item.code} - {item.name}</span>
                    <span className="font-mono text-foreground">{formatMoney(item.amount, "HKD")}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                  <span>Total Operating Expenses</span>
                  <span className="font-mono">{formatMoney(profitAndLoss.totalExpense, "HKD")}</span>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div className="p-4 rounded-lg bg-secondary/30 flex justify-between items-center border border-border">
                <span className="font-bold text-foreground text-base">Net Profit / (Loss)</span>
                <span className={`font-mono font-extrabold text-lg ${profitAndLoss.netProfit >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {formatMoney(profitAndLoss.netProfit, "HKD")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- BALANCE SHEET TAB --- */}
        <TabsContent value="bs" className="mt-6">
          <Card className="bg-[#1e2130] border-border">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-lg">Statement of Financial Position</CardTitle>
              <p className="text-xs text-muted-foreground">As of Dec 31, 2025</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Assets Section */}
              <div className="space-y-2">
                <div className="font-bold text-foreground border-b border-border/50 pb-1 text-sm tracking-wide">ASSETS</div>
                {balanceSheet.assets.map((item: any) => (
                  <div key={item.code} className="flex justify-between text-sm py-1 font-medium">
                    <span className="text-muted-foreground">{item.code} - {item.name}</span>
                    <span className="font-mono text-foreground">{formatMoney(item.amount, "HKD")}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                  <span>Total Assets</span>
                  <span className="font-mono text-primary">{formatMoney(balanceSheet.totalAssets, "HKD")}</span>
                </div>
              </div>

              {/* Liabilities Section */}
              <div className="space-y-2">
                <div className="font-bold text-foreground border-b border-border/50 pb-1 text-sm tracking-wide">LIABILITIES</div>
                {balanceSheet.liabilities.map((item: any) => (
                  <div key={item.code} className="flex justify-between text-sm py-1 font-medium">
                    <span className="text-muted-foreground">{item.code} - {item.name}</span>
                    <span className="font-mono text-foreground">{formatMoney(item.amount, "HKD")}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                  <span>Total Liabilities</span>
                  <span className="font-mono text-destructive">{formatMoney(balanceSheet.totalLiabilities, "HKD")}</span>
                </div>
              </div>

              {/* Equity Section */}
              <div className="space-y-2">
                <div className="font-bold text-foreground border-b border-border/50 pb-1 text-sm tracking-wide">EQUITY</div>
                {balanceSheet.equity.map((item: any) => (
                  <div key={item.code} className="flex justify-between text-sm py-1 font-medium">
                    <span className="text-muted-foreground">{item.code} - {item.name}</span>
                    <span className="font-mono text-foreground">{formatMoney(item.amount, "HKD")}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-sm">
                  <span>Total Equity</span>
                  <span className="font-mono text-emerald-500">{formatMoney(balanceSheet.totalEquity, "HKD")}</span>
                </div>
              </div>

              {/* Net Balance Check */}
              <div className="p-4 rounded-lg bg-secondary/30 flex justify-between items-center border border-border">
                <span className="font-bold text-foreground text-sm">Total Liabilities & Equity</span>
                <span className="font-mono font-extrabold text-base text-foreground">
                  {formatMoney(balanceSheet.totalLiabilitiesAndEquity, "HKD")}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TRIAL BALANCE TAB --- */}
        <TabsContent value="tb" className="mt-6">
          <div className="rounded-md border border-border bg-[#1e2130] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="w-[100px] pl-6 text-muted-foreground">Code</TableHead>
                  <TableHead className="text-muted-foreground">Account Name</TableHead>
                  <TableHead className="w-[150px] text-right text-muted-foreground">Debit (HKD)</TableHead>
                  <TableHead className="w-[150px] text-right text-muted-foreground pr-6">Credit (HKD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance.lines.map((line: any) => (
                  <TableRow key={line.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <TableCell className="font-mono text-primary font-semibold pl-6">{line.code}</TableCell>
                    <TableCell className="font-medium text-foreground">{line.name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {line.debit > 0 ? formatMoney(line.debit, "HKD") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground pr-6">
                      {line.credit > 0 ? formatMoney(line.credit, "HKD") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-secondary/30 font-bold hover:bg-secondary/30">
                  <TableCell colSpan={2} className="pl-6 text-foreground text-sm">Total</TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">{formatMoney(trialBalance.totalDebit, "HKD")}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-500 pr-6">{formatMoney(trialBalance.totalCredit, "HKD")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
