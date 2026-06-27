"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LineItem {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  category: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("HKD");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [taxStatus, setTaxStatus] = useState("ONSHORE");
  const [lines, setLines] = useState<LineItem[]>([
    { id: 1, description: "", quantity: "1", unitPrice: "", amount: "", category: "Sales" }
  ]);
  const [subtotal, setSubtotal] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [totalAmount, setTotalAmount] = useState("0");

  // Calculate totals
  useEffect(() => {
    const newSubtotal = lines.reduce((sum, line) => {
      const amount = parseFloat(line.amount) || 0;
      return sum + amount;
    }, 0);
    const newTax = 0; // For simplicity, 0 tax for now
    const newTotal = newSubtotal + newTax;
    
    setSubtotal(newSubtotal.toFixed(2));
    setTaxAmount(newTax.toFixed(2));
    setTotalAmount(newTotal.toFixed(2));
  }, [lines]);

  // Fetch customers on mount
  useEffect(() => {
    fetch("/api/customers")
      .then(res => res.json())
      .then(data => {
        if (data.success) setCustomers(data.data);
      });
  }, []);

  const addLine = () => {
    setLines([...lines, { 
      id: Date.now(), 
      description: "", 
      quantity: "1", 
      unitPrice: "", 
      amount: "", 
      category: "Sales" 
    }]);
  };

  const removeLine = (id: number) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: number, field: keyof LineItem, value: string) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value };
        // Auto-calculate amount
        if (field === "quantity" || field === "unitPrice") {
          const qty = parseFloat(updated.quantity) || 0;
          const price = parseFloat(updated.unitPrice) || 0;
          updated.amount = (qty * price).toFixed(2);
        }
        return updated;
      }
      return line;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          customerId,
          issueDate,
          dueDate,
          currency,
          exchangeRate: parseFloat(exchangeRate),
          subtotal: parseFloat(subtotal),
          taxAmount: parseFloat(taxAmount),
          totalAmount: parseFloat(totalAmount),
          taxStatus,
          lines: lines.map(line => ({
            description: line.description,
            quantity: parseFloat(line.quantity),
            unitPrice: parseFloat(line.unitPrice),
            amount: parseFloat(line.amount),
            category: line.category
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice created successfully!");
        router.push("/invoices");
      } else {
        toast.error(data.error || "Failed to create invoice");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <PageHeader
          title="New Invoice"
          description="Create a new invoice"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[#1e2130] p-6 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              placeholder="INV-2025-001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.code} - {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HKD">HKD</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="CNY">CNY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exchangeRate">Exchange Rate</Label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.0001"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxStatus">Tax Status</Label>
            <Select value={taxStatus} onValueChange={setTaxStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONSHORE">Onshore</SelectItem>
                <SelectItem value="OFFSHORE">Offshore</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Line Items</h3>
            <Button type="button" onClick={addLine} variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((line, index) => (
              <div key={line.id} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5 space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Item description"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, "description", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Qty</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, "quantity", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.id, "unitPrice", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.amount}
                    onChange={(e) => updateLine(line.id, "amount", e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex flex-col items-end gap-2 max-w-xs ml-auto">
            <div className="flex justify-between w-full">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{subtotal} {currency}</span>
            </div>
            <div className="flex justify-between w-full">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-mono">{taxAmount} {currency}</span>
            </div>
            <div className="flex justify-between w-full text-lg font-bold border-t border-border pt-2">
              <span>Total</span>
              <span className="font-mono">{totalAmount} {currency}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link href="/invoices">
            <Button variant="secondary" type="button">Cancel</Button>
          </Link>
          <Button type="submit">Create Invoice</Button>
        </div>
      </form>
    </div>
  );
}
