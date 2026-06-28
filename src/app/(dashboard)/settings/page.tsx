"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Organization {
  name: string;
  legalName: string | null;
  brNumber: string | null;
  address: string | null;
  baseCurrency: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
}

export default function SettingsPage() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    brNumber: "",
    address: "",
    baseCurrency: "HKD",
    financialYearStartMonth: "4",
    financialYearStartDay: "1",
  });

  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleSave = async () => {
    try {
      // TODO: Implement API call to update organization
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" description="Manage your account and preferences" />
        <div className="text-center py-20 text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="bg-[#1e2130] border-border">
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-legal">Legal Name</Label>
              <Input
                id="org-legal"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="br-number">Business Registration Number</Label>
              <Input
                id="br-number"
                value={formData.brNumber}
                onChange={(e) => setFormData({ ...formData, brNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-address">Address</Label>
              <Input
                id="org-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="org-currency">Base Currency</Label>
              <Input
                id="org-currency"
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e2130] border-border">
          <CardHeader>
            <CardTitle>Financial Year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fy-month">Financial Year Starts</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    value={formData.financialYearStartMonth}
                    onValueChange={(val) => setFormData({ ...formData, financialYearStartMonth: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={formData.financialYearStartDay}
                    onValueChange={(val) => setFormData({ ...formData, financialYearStartDay: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (i + 1).toString()).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Current financial year: {months.find(m => m.value === formData.financialYearStartMonth)?.label} {formData.financialYearStartDay}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
