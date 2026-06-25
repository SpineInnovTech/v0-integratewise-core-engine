"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import { UsageMeter } from "@/components/billing/paywall/UsageMeter";
import { FeatureGate } from "@/components/billing/paywall/FeatureGate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/tenant-context";

type UsageMetric = {
  key: string;
  label: string;
  current: number;
  limit: number | null;
  trend: number; // percentage change from last period
  unit?: string;
};

type UsageHistoryRow = {
  id: string;
  date: string;
  aiSessions: number;
  apiCalls: number;
  storageDelta: number;
};

type UsageAlert = {
  id: string;
  metric: string;
  message: string;
  severity: "warning" | "critical";
  timestamp: string;
};

type UsageResponse = {
  success: boolean;
  data: {
    period: string;
    metrics: UsageMetric[];
    history: UsageHistoryRow[];
    alerts: UsageAlert[];
  };
};

export function AdminUsagePage() {
  const { plan } = useTenant();
  const [selectedPeriod, setSelectedPeriod] = React.useState("current");

  const { data, loading, error } = useAdminApi<UsageResponse>("/api/v1/workspace/admin/usage");
  const usageData = data?.data ?? { period: "", metrics: [], history: [], alerts: [] };

  const historyColumns: DataTableColumn<UsageHistoryRow>[] = [
    { key: "date", header: "Date", render: (row) => row.date },
    { key: "aiSessions", header: "AI Sessions", render: (row) => row.aiSessions.toLocaleString() },
    { key: "apiCalls", header: "API Calls", render: (row) => row.apiCalls.toLocaleString() },
    {
      key: "storageDelta",
      header: "Storage Δ",
      render: (row) => (
        <span className={cn(row.storageDelta >= 0 ? "text-iw-forest-mid" : "text-iw-red")}>
          {row.storageDelta >= 0 ? "+" : ""}
          {row.storageDelta.toFixed(2)} GB
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
          <h1 className="text-2xl font-semibold">Usage & Metering</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor resource consumption and manage limits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Month</SelectItem>
              <SelectItem value="last">Last Month</SelectItem>
              <SelectItem value="last3">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {usageData.metrics.map((metric) => {
          const percentage = metric.limit ? (metric.current / metric.limit) * 100 : 0;

          return (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span>{metric.label}</span>
                  {metric.trend !== 0 && (
                    <span
                      className={cn(
                        "flex items-center text-xs",
                        metric.trend > 0 ? "text-iw-forest-mid" : "text-iw-red"
                      )}
                    >
                      {metric.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(metric.trend)}%
                    </span>
                  )}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {metric.current.toLocaleString()}
                  {metric.unit && (
                    <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UsageMeter metricKey={metric.key} label="" compact />
                <p className="text-xs text-muted-foreground mt-2">
                  {metric.limit ? `${metric.limit.toLocaleString()} limit` : "Unlimited"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usage History</CardTitle>
              <CardDescription>Daily usage breakdown for the selected period</CardDescription>
            </div>
            <FeatureGate featureKey="surfaces.audit" variant="inline">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </FeatureGate>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable title="" rows={usageData.history} columns={historyColumns} />
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <FeatureGate featureKey="surfaces.audit" variant="inline">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-iw-gold" />
              Usage Alerts
            </CardTitle>
            <CardDescription>Notifications about usage thresholds</CardDescription>
          </CardHeader>
          <CardContent>
            {usageData.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts</p>
            ) : (
              <div className="space-y-3">
                {usageData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3",
                      alert.severity === "critical"
                        ? "border-iw-red/20 bg-iw-red/5"
                        : "border-iw-gold/20 bg-iw-gold/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                        {alert.severity}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{alert.metric}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  );
}
