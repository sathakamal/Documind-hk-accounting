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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/utils";
import { Plus, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("ASSET");
  const [classification, setClassification] = useState("CURRENT_ASSET");

  const fetchAccounts = () => {
    setLoading(true);
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAccounts(data.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, type, classification }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account created successfully");
        setIsDialogOpen(false);
        // Reset form
        setCode("");
        setName("");
        fetchAccounts();
      } else {
        toast.error(data.error || "Failed to create account");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const getFilteredAccounts = (type: string) => {
    return accounts.filter((a) => a.type === type);
  };

  const types = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="View and manage your general ledger accounts"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Account Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. 1010"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. HSBC Savings Account"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select value={type} onValueChange={(val) => { setType(val); setClassification(val === "ASSET" ? "CURRENT_ASSET" : val === "LIABILITY" ? "CURRENT_LIABILITY" : val === "EXPENSE" ? "OPERATING_EXPENSE" : val); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSET">Asset</SelectItem>
                      <SelectItem value="LIABILITY">Liability</SelectItem>
                      <SelectItem value="EQUITY">Equity</SelectItem>
                      <SelectItem value="REVENUE">Revenue</SelectItem>
                      <SelectItem value="EXPENSE">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classification">Classification</Label>
                  <Select value={classification} onValueChange={setClassification}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      {type === "ASSET" && (
                        <>
                          <SelectItem value="CURRENT_ASSET">Current Asset</SelectItem>
                          <SelectItem value="FIXED_ASSET">Fixed Asset</SelectItem>
                        </>
                      )}
                      {type === "LIABILITY" && (
                        <>
                          <SelectItem value="CURRENT_LIABILITY">Current Liability</SelectItem>
                          <SelectItem value="LONG_TERM_LIABILITY">Long-Term Liability</SelectItem>
                        </>
                      )}
                      {type === "EQUITY" && <SelectItem value="EQUITY">Equity</SelectItem>}
                      {type === "REVENUE" && <SelectItem value="REVENUE">Revenue</SelectItem>}
                      {type === "EXPENSE" && (
                        <>
                          <SelectItem value="COST_OF_GOODS_SOLD">Cost of Goods Sold</SelectItem>
                          <SelectItem value="OPERATING_EXPENSE">Operating Expense</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full pt-2">Save Account</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1e2130] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
            <BookOpen className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(
                accounts
                  .filter((a) => a.type === "ASSET")
                  .reduce((sum, a) => sum + parseFloat(a.balance), 0),
                "HKD"
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2130] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
            <Layers className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(
                accounts
                  .filter((a) => a.type === "LIABILITY")
                  .reduce((sum, a) => sum + parseFloat(a.balance), 0),
                "HKD"
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1e2130] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Equity</CardTitle>
            <Layers className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(
                accounts
                  .filter((a) => a.type === "EQUITY")
                  .reduce((sum, a) => sum + parseFloat(a.balance), 0),
                "HKD"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading accounts...</div>
      ) : (
        <Tabs defaultValue="ASSET" className="w-full">
          <TabsList className="bg-[#1e2130] p-1 rounded-lg">
            {types.map((t) => (
              <TabsTrigger key={t} value={t} className="px-4 py-2">
                {t.charAt(0) + t.slice(1).toLowerCase()}s
              </TabsTrigger>
            ))}
          </TabsList>
          {types.map((t) => (
            <TabsContent key={t} value={t} className="mt-4">
              <div className="rounded-md border border-border bg-[#1e2130] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="w-[100px] text-muted-foreground">Code</TableHead>
                      <TableHead className="text-muted-foreground">Account Name</TableHead>
                      <TableHead className="text-muted-foreground">Classification</TableHead>
                      <TableHead className="text-right text-muted-foreground">Current Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredAccounts(t).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No {t.toLowerCase()} accounts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredAccounts(t).map((account) => (
                        <TableRow key={account.id} className="border-b border-border/50 hover:bg-secondary/20">
                          <TableCell className="font-mono text-primary font-semibold">{account.code}</TableCell>
                          <TableCell className="font-medium text-foreground">{account.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {account.classification.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground">
                            {formatMoney(parseFloat(account.balance), "HKD")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
