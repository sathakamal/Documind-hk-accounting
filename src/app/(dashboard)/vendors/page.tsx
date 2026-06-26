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
import { CurrencyBadge } from "@/components/shared/CurrencyBadge";
import { formatMoney } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVendors(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Manage your suppliers"
        actions={
          <Link href="/vendors/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Vendor
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div>Loading...</div>
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No vendors yet"
          description="Add your first supplier"
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor: any) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.code}</TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.country}</TableCell>
                  <TableCell>
                    <CurrencyBadge currency={vendor.currency} />
                  </TableCell>
                  <TableCell>{formatMoney(vendor.balance, vendor.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
