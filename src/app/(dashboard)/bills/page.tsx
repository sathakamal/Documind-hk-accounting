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
import { Bill } from "@prisma/client";
import { formatMoney, formatDate } from "@/lib/utils";
import { Plus, FileSpreadsheet } from "lucide-react";

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bills")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBills(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    const res = await fetch("/api/export/bills");
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bills.xlsx";
      a.click();
    }
  };

  return (
    <div>
      <PageHeader
        title="Bills"
        description="Manage your accounts payable"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Link href="/bills/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Bill
              </Button>
            </Link>
          </>
        }
      />

      {loading ? (
        <div>Loading...</div>
      ) : bills.length === 0 ? (
        <EmptyState
          title="No bills yet"
          description="Upload a document or create a bill manually"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill: any) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>{bill.vendor?.name}</TableCell>
                  <TableCell>{formatDate(bill.issueDate)}</TableCell>
                  <TableCell>{formatDate(bill.dueDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatMoney(bill.totalAmount, bill.currency)}
                      <CurrencyBadge currency={bill.currency} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={bill.status} />
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
