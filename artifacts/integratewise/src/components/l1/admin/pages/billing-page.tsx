"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { BillingPlan } from "@/types/admin";

type BillingResponse = {
  success: boolean;
  data: { plans: BillingPlan[]; total: number };
};

export function AdminBillingPage() {
  const { data, loading, error } = useAdminApi<BillingResponse>("/api/admin/billing");
  const plans = data?.data.plans ?? [];

  type BillingRow = BillingPlan & { id: string };
  const rows: BillingRow[] = React.useMemo(
    () => plans.map((p) => ({ ...p, id: p.tenantId })),
    [plans]
  );

  const [selected, setSelected] = React.useState<BillingRow | null>(null);

  const cols: Array<DataTableColumn<BillingRow>> = [
    {
      key: "tenantId",
      header: "Tenant",
      render: (p) => <div className="font-medium">{p.tenantId}</div>,
    },
    {
      key: "plan",
      header: "Plan",
      className: "w-[140px]",
      render: (p) => <Badge variant="outline">{p.plan}</Badge>,
    },
    {
      key: "seatsUsed",
      header: "Seats",
      className: "w-[120px]",
      render: (p) => `${p.seatsUsed}/${p.seats}`,
    },
    {
      key: "alerts",
      header: "Alerts",
      render: (p) => <span className="text-xs text-slate-600">{p.alerts.join(", ") || "—"}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Billing & Plan Enforcement</h1>
        <p className="text-sm text-slate-500 mt-1">
          Plans, metering, feature gates, invoices, and dunning workflows.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Tenants</p>
          <p className="text-lg font-semibold mt-2">{loading ? "…" : plans.length}</p>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">Controls</p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await fetch("/api/admin/billing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ operation: "recompute" }),
                });
              }}
            >
              Recompute usage
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch("/api/admin/billing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ operation: "sync_invoices" }),
                });
              }}
            >
              Sync invoices
            </Button>
          </div>
        </Card>
      </div>

      <DataTable title="Plans" rows={rows} columns={cols} onRowClick={(row) => setSelected(row)} />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? `Tenant ${selected.tenantId}` : "Tenant"}
        description={selected ? `Plan: ${selected.plan}` : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Usage</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-500">AI tokens:</span>{" "}
                  {selected.usage.aiTokens.toLocaleString()}
                </div>
                <div>
                  <span className="text-slate-500">Action runs:</span>{" "}
                  {selected.usage.actionRuns.toLocaleString()}
                </div>
                <div>
                  <span className="text-slate-500">Connector syncs:</span>{" "}
                  {selected.usage.connectorSyncs.toLocaleString()}
                </div>
                <div>
                  <span className="text-slate-500">Storage:</span> {selected.usage.storageGb} GB
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
