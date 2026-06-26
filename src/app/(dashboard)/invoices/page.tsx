"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CurrencyBadge } from "@/components/shared/CurrencyBadge";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, FileSpreadsheet } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    const res = await fetch("/api/export/invoices");
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices.xlsx";
      a.click();
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage your accounts receivable"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Link href="/invoices/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </>
        }
      />

      {loading ? (
        <div>Loading...</div>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.customer?.name}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatMoney(invoice.totalAmount, invoice.currency)}
                      <CurrencyBadge currency={invoice.currency} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
