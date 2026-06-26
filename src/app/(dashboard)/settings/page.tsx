"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
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
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" defaultValue="TST Gems & Jewellery Ltd" />
            </div>
            <div>
              <Label htmlFor="org-legal">Legal Name</Label>
              <Input id="org-legal" defaultValue="TST Gems & Jewellery Limited" />
            </div>
            <div>
              <Label htmlFor="org-address">Address</Label>
              <Input id="org-address" defaultValue="1 Queen's Road Central, Hong Kong" />
            </div>
            <div>
              <Label htmlFor="org-currency">Base Currency</Label>
              <Input id="org-currency" defaultValue="HKD" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user-name">Your Name</Label>
              <Input id="user-name" defaultValue="Arumugam OmSathasivam" />
            </div>
            <div>
              <Label htmlFor="user-email">Email Address</Label>
              <Input id="user-email" defaultValue="admin@tstgems.com" />
            </div>
            <Button variant="outline">Change Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
