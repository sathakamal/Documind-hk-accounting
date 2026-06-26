"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatMoney, formatDate } from "@/lib/utils";
import { CheckCircle, AlertCircle, RefreshCw, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

export default function ReconciliationPage() {
  const [bankTxs, setBankTxs] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Bank Transaction for matching
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [matchType, setMatchType] = useState<"INVOICE" | "BILL" | "DIRECT_EXPENSE">("DIRECT_EXPENSE");
  const [matchId, setMatchId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txsRes, invoicesRes, billsRes, accountsRes] = await Promise.all([
        fetch("/api/bank-reconciliation"),
        fetch("/api/invoices"),
        fetch("/api/bills"),
        fetch("/api/accounts"),
      ]);

      const txsData = await txsRes.json();
      const invoicesData = await invoicesRes.json();
      const billsData = await billsRes.json();
      const accountsData = await accountsRes.json();

      if (txsData.success) {
        setBankTxs(txsData.data);
        // Default to select first unreconciled transaction
        const firstUnrec = txsData.data.find((tx: any) => tx.status === "UNRECONCILED");
        setSelectedTx(firstUnrec || null);
        if (firstUnrec) {
          // Adjust default matchType based on amount direction
          setMatchType(parseFloat(firstUnrec.amount) > 0 ? "INVOICE" : "BILL");
        }
      }

      if (invoicesData.success) {
        // filter unpaid/partially paid
        setInvoices(invoicesData.data.filter((i: any) => i.status !== "PAID"));
      }
      if (billsData.success) {
        // filter unpaid/partially paid
        setBills(billsData.data.filter((b: any) => b.status !== "PAID"));
      }
      if (accountsData.success) {
        // filter expense accounts
        setAccounts(accountsData.data.filter((a: any) => a.type === "EXPENSE"));
      }
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTx = (tx: any) => {
    setSelectedTx(tx);
    setMatchId("");
    setExpenseAccountId("");
    setMatchType(parseFloat(tx.amount) > 0 ? "INVOICE" : "BILL");
  };

  const handleReconcile = async () => {
    if (!selectedTx) return;
    setSubmitting(true);

    const payload = {
      bankTransactionId: selectedTx.id,
      matchType,
      matchId: matchType === "DIRECT_EXPENSE" ? undefined : matchId,
      accountId: matchType === "DIRECT_EXPENSE" ? expenseAccountId : undefined,
    };

    try {
      const res = await fetch("/api/bank-reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Transaction reconciled successfully!");
        fetchData();
      } else {
        toast.error(data.error || "Failed to reconcile");
      }
    } catch (err) {
      toast.error("Error reconciling transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Reconciliation"
        description="Match bank statements against invoices and bills to reconcile cash balances"
        actions={
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bank Statement Transactions */}
        <Card className="bg-[#1e2130] border-border lg:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" /> Bank Statement Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading bank ledger...</div>
            ) : bankTxs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No bank statements uploaded.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="pl-6 text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-right text-muted-foreground">Amount (HKD)</TableHead>
                    <TableHead className="text-center text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankTxs.map((tx) => (
                    <TableRow
                      key={tx.id}
                      onClick={() => handleSelectTx(tx)}
                      className={`border-b border-border/20 cursor-pointer transition-colors hover:bg-secondary/20 ${
                        selectedTx?.id === tx.id ? "bg-primary/10 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <TableCell className="font-mono text-xs pl-6">{formatDate(tx.date)}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {tx.description}
                        {tx.reference && <span className="block text-xs font-mono text-primary mt-1">Ref: {tx.reference}</span>}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold ${
                        parseFloat(tx.amount) > 0 ? "text-emerald-500" : "text-foreground"
                      }`}>
                        {parseFloat(tx.amount) > 0 ? "+" : ""}{formatMoney(parseFloat(tx.amount), "HKD")}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={tx.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Reconciliation Match Panel */}
        <div className="space-y-6">
          <Card className="bg-[#1e2130] border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {selectedTx ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-primary" /> Reconcile Transaction
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Fully Reconciled
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTx ? (
                <>
                  <div className="p-4 rounded-lg bg-secondary/30 space-y-2 border border-border">
                    <div className="text-xs text-muted-foreground">SELECTED BANK STATEMENT LINE</div>
                    <div className="font-bold text-foreground text-sm">{selectedTx.description}</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono">{formatDate(selectedTx.date)}</span>
                      <span className={`font-mono font-bold text-sm ${parseFloat(selectedTx.amount) > 0 ? "text-emerald-500" : "text-foreground"}`}>
                        {parseFloat(selectedTx.amount) > 0 ? "+" : ""}{formatMoney(parseFloat(selectedTx.amount), "HKD")}
                      </span>
                    </div>
                  </div>

                  {selectedTx.status === "RECONCILED" ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-emerald-500">
                      <CheckCircle className="w-12 h-12 mb-2 animate-bounce" />
                      <div className="font-bold">Transaction Reconciled</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Matched to ledger reference: <span className="font-mono text-primary font-semibold">{selectedTx.reference}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Reconciliation Mode</label>
                        <Select
                          value={matchType}
                          onValueChange={(val: any) => { setMatchType(val); setMatchId(""); }}
                        >
                          <SelectTrigger className="bg-[#1e2130]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {parseFloat(selectedTx.amount) > 0 ? (
                              <SelectItem value="INVOICE">Match to Customer Invoice (AR)</SelectItem>
                            ) : (
                              <SelectItem value="BILL">Match to Supplier Bill (AP)</SelectItem>
                            )}
                            <SelectItem value="DIRECT_EXPENSE">Direct Operating Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {matchType === "INVOICE" && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Select Customer Invoice</label>
                          <Select value={matchId} onValueChange={setMatchId}>
                            <SelectTrigger className="bg-[#1e2130]">
                              <SelectValue placeholder="Choose Invoice..." />
                            </SelectTrigger>
                            <SelectContent>
                              {invoices.length === 0 ? (
                                <SelectItem value="none" disabled>No pending invoices</SelectItem>
                              ) : (
                                invoices.map((inv) => (
                                  <SelectItem key={inv.id} value={inv.id}>
                                    {inv.invoiceNumber} - {inv.customer?.name} ({formatMoney(parseFloat(inv.balanceDue), inv.currency)})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {matchType === "BILL" && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Select Supplier Bill</label>
                          <Select value={matchId} onValueChange={setMatchId}>
                            <SelectTrigger className="bg-[#1e2130]">
                              <SelectValue placeholder="Choose Bill..." />
                            </SelectTrigger>
                            <SelectContent>
                              {bills.length === 0 ? (
                                <SelectItem value="none" disabled>No pending bills</SelectItem>
                              ) : (
                                bills.map((bill) => (
                                  <SelectItem key={bill.id} value={bill.id}>
                                    {bill.billNumber} - {bill.vendor?.name} ({formatMoney(parseFloat(bill.balanceDue), bill.currency)})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {matchType === "DIRECT_EXPENSE" && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Expense Account (Debit)</label>
                          <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                            <SelectTrigger className="bg-[#1e2130]">
                              <SelectValue placeholder="Select Category..." />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.code} - {acc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        className="w-full mt-4"
                        onClick={handleReconcile}
                        disabled={submitting || (matchType !== "DIRECT_EXPENSE" && !matchId) || (matchType === "DIRECT_EXPENSE" && !expenseAccountId)}
                      >
                        Reconcile & Match
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Choose an unreconciled line on the left to begin mapping.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
