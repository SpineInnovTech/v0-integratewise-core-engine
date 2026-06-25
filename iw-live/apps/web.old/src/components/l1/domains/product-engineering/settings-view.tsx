/**
 * Product & Engineering Settings View
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, User, Lock } from "lucide-react";

export default function SettingsView() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Engineering Settings</h1>
        <p className="text-slate-400">Configure development environment preferences</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-iw-slate-mid/80" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-slate-400">Manage your developer profile and preferences</p>
              <Badge className="text-iw-slate-mid/80">Configured</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-iw-gold-light" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-slate-400">
                Configure alerts for builds, deployments, and incidents
              </p>
              <Badge className="text-iw-gold-light">Enabled</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-iw-slate-mid/80" />
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-slate-400">Manage permissions and access rights</p>
              <Badge className="text-iw-slate-mid/80">Restricted</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
