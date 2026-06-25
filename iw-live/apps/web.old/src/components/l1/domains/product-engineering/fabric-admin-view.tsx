/**
 * Product & Engineering Fabric Admin View
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Database, Network } from "lucide-react";

export default function FabricAdminView() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Fabric Administration</h1>
        <p className="text-slate-400">System configuration and management</p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-iw-slate-mid/80" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Primary database connection</span>
              <Badge className="text-iw-forest-bright/80">Healthy</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-iw-forest-bright/80" />
              Network Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API gateway routing</span>
              <Badge className="text-iw-forest-bright/80">Operational</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-iw-slate-mid/80" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Authentication protocols</span>
              <Badge className="text-iw-slate-mid/80">Configured</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
