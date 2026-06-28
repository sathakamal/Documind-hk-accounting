"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface OrganizationData {
  id: string;
  name: string;
  legalName: string | null;
  brNumber: string | null;
  address: string | null;
  baseCurrency: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const fetchOrganization = async () => {
    try {
      const res = await fetch("/api/organization");
      const data = await res.json();
      if (data.success) {
        setFormData({
          name: data.data.name,
          legalName: data.data.legalName || "",
          brNumber: data.data.brNumber || "",
          address: data.data.address || "",
          baseCurrency: data.data.baseCurrency,
          financialYearStartMonth: data.data.financialYearStartMonth.toString(),
          financialYearStartDay: data.data.financialYearStartDay.toString(),
        });
      }
    } catch (error) {
      toast.error("Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          financialYearStartMonth: parseInt(formData.financialYearStartMonth),
          financialYearStartDay: parseInt(formData.financialYearStartDay),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
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
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="legalName">Legal Name</Label>
              <Input
                id="legalName"
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="brNumber">Business Registration Number (BRN)</Label>
              <Input
                id="brNumber"
                value={formData.brNumber}
                onChange={(e) => setFormData({ ...formData, brNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="baseCurrency">Base Currency</Label>
              <Input
                id="baseCurrency"
                value={formData.baseCurrency}
                onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="financialYearStartMonth">Financial Year Starts</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Select
                    value={formData.financialYearStartMonth}
                    onValueChange={(value) => setFormData({ ...formData, financialYearStartMonth: value })}
                  >
                    <SelectTrigger id="financialYearStartMonth">
                      <SelectValue placeholder="Select month" />
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
                    onValueChange={(value) => setFormData({ ...formData, financialYearStartDay: value })}
                  >
                    <SelectTrigger id="financialYearStartDay">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((d) => (
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
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}