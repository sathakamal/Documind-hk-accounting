"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, Trash2, Scale, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for manual journal entry
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState<any[]>([
    { accountId: "", debit: 0, credit: 0 },
    { accountId: "", debit: 0, credit: 0 },
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [entriesRes, accountsRes] = await Promise.all([
        fetch("/api/journal-entries"),
        fetch("/api/accounts"),
      ]);
      const entriesData = await entriesRes.json();
      const accountsData = await accountsRes.json();

      if (entriesData.success) setEntries(entriesData.data);
      if (accountsData.success) setAccounts(accountsData.data);
    } catch (err) {
      toast.error("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportLedger = async () => {
    try {
      toast.info("Preparing General Ledger export...");
      const response = await fetch("/api/export/general-ledger");
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "general-ledger.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("General Ledger exported successfully!");
    } catch (error) {
      toast.error("Failed to export General Ledger");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { accountId: "", debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      toast.error("A journal entry requires at least 2 lines");
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...lines];
    if (field === "debit") {
      updated[idx].debit = parseFloat(value) || 0;
      if (updated[idx].debit > 0) updated[idx].credit = 0; // mutually exclusive
    } else if (field === "credit") {
      updated[idx].credit = parseFloat(value) || 0;
      if (updated[idx].credit > 0) updated[idx].debit = 0; // mutually exclusive
    } else {
      updated[idx][field] = value;
    }
    setLines(updated);
  };

  const totalDebits = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredits = lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error(`Out of balance! Debits (${formatMoney(totalDebits, "HKD")}) must equal Credits (${formatMoney(totalCredits, "HKD")})`);
      return;
    }

    try {
      const res = await fetch("/api/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          reference,
          date,
          lines: lines.filter((l) => l.accountId && (l.debit > 0 || l.credit > 0)),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Journal Entry posted successfully");
        setIsDialogOpen(false);
        setDescription("");
        setReference("");
        setLines([
          { accountId: "", debit: 0, credit: 0 },
          { accountId: "", debit: 0, credit: 0 },
        ]);
        fetchData();
      } else {
        toast.error(data.error || "Failed to post entry");
      }
    } catch (err) {
      toast.error("Failed to post entry");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="General Ledger"
        description="View individual journal transactions and general ledger logs"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportLedger}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export General Ledger
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Journal Entry
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  New Manual Journal Entry
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description / Narration</Label>
                    <Input
                      id="description"
                      placeholder="e.g. Month-end depreciation adjustment"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reference">Reference / Memo</Label>
                    <Input
                      id="reference"
                      placeholder="e.g. ADJ-01"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden mt-4">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Account</TableHead>
                        <TableHead className="w-[120px]">Debit (HKD)</TableHead>
                        <TableHead className="w-[120px]">Credit (HKD)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <TableRow key={idx} className="hover:bg-transparent">
                          <TableCell>
                            <Select
                              value={line.accountId}
                              onValueChange={(val) => handleLineChange(idx, "accountId", val)}
                            >
                              <SelectTrigger className="bg-[#1e2130]">
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.code} - {a.name} ({a.type})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0.00"
                              disabled={line.credit > 0}
                              value={line.debit || ""}
                              onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder="0.00"
                              disabled={line.debit > 0}
                              value={line.credit || ""}
                              onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveLine(idx)}
                              className="text-destructive hover:bg-destructive/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                  <Button type="button" variant="outline" onClick={handleAddLine}>
                    <Plus className="w-4 h-4 mr-2" /> Add Line
                  </Button>
                  <div className="flex gap-4 font-mono text-sm">
                    <div>Debits: <span className="font-bold text-primary">{formatMoney(totalDebits, "HKD")}</span></div>
                    <div>Credits: <span className="font-bold text-emerald-500">{formatMoney(totalCredits, "HKD")}</span></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <div className="mr-auto text-xs flex items-center">
                    {isBalanced ? (
                      <span className="text-emerald-500 font-semibold">✓ Double-entry is balanced</span>
                    ) : (
                      <span className="text-destructive font-semibold">✗ Out of balance (Difference: {formatMoney(Math.abs(totalDebits - totalCredits), "HKD")})</span>
                    )}
                  </div>
                  <Button type="submit" disabled={!isBalanced}>
                    Post Journal Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading General Ledger...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-[#1e2130]">No journal entries found.</div>
      ) : (
        <div className="space-y-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-[#1e2130] border-border overflow-hidden">
              <CardHeader className="bg-secondary/20 py-3 flex flex-row items-center justify-between border-b border-border">
                <div className="space-y-1">
                  <div className="font-bold text-foreground">{entry.description}</div>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Date: {formatDate(entry.date)}</span>
                    {entry.reference && <span>Reference: <span className="font-mono text-primary">{entry.reference}</span></span>}
                  </div>
                </div>
                <div className="text-sm font-mono text-muted-foreground font-semibold">
                  ID: {entry.id.substring(0, 8)}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground pl-6">Account Code</TableHead>
                      <TableHead className="text-muted-foreground">Account Name</TableHead>
                      <TableHead className="w-[150px] text-right text-muted-foreground">Debit (HKD)</TableHead>
                      <TableHead className="w-[150px] text-right text-muted-foreground pr-6">Credit (HKD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line: any) => (
                      <TableRow key={line.id} className="border-b border-border/20 hover:bg-transparent">
                        <TableCell className="font-mono text-primary pl-6">{line.account?.code}</TableCell>
                        <TableCell className="font-medium text-foreground">{line.account?.name}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground">
                          {parseFloat(line.debit) > 0 ? formatMoney(parseFloat(line.debit), "HKD") : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-foreground pr-6">
                          {parseFloat(line.credit) > 0 ? formatMoney(parseFloat(line.credit), "HKD") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
