"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { ConnectorInstance } from "@/types/admin";

type ConnectorsResponse = {
  success: boolean;
  data: { connectors: ConnectorInstance[]; total: number };
};

export function ConnectorsPage() {
  const { data, loading, error } = useAdminApi<ConnectorsResponse>("/api/admin/connectors");
  const connectors = data?.data.connectors ?? [];
  const [selected, setSelected] = React.useState<ConnectorInstance | null>(null);

  const cols: Array<DataTableColumn<ConnectorInstance>> = [
    {
      key: "system",
      header: "System",
      render: (c) => <div className="font-medium">{c.system}</div>,
    },
    { key: "tenantId", header: "Tenant", className: "w-[140px]" },
    {
      key: "status",
      header: "Status",
      className: "w-[120px]",
      render: (c) => (
        <Badge
          variant={
            c.status === "healthy"
              ? "default"
              : c.status === "warning"
                ? "secondary"
                : "destructive"
          }
        >
          {c.status}
        </Badge>
      ),
    },
    {
      key: "lastSyncAt",
      header: "Last Sync",
      className: "w-[180px]",
      render: (c) => new Date(c.lastSyncAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Connectors & Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connection lifecycle, sync scope, mapping, DLQ, and webhooks.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Actions</p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/admin/connectors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ operation: "test" }),
              });
            }}
          >
            Test connection
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/admin/connectors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ operation: "rotate" }),
              });
            }}
          >
            Rotate credentials
          </Button>
        </div>
      </Card>

      <DataTable
        title="Connector instances"
        rows={connectors}
        columns={cols}
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.system : "Connector"}
        description={selected ? selected.id : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Overview</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-500">Tenant:</span> {selected.tenantId}
                </div>
                <div>
                  <span className="text-slate-500">Status:</span> {selected.status}
                </div>
                <div>
                  <span className="text-slate-500">Error rate:</span>{" "}
                  {(selected.errorRate * 100).toFixed(1)}%
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </DetailDrawer>

      {!loading && connectors.length === 0 ? (
        <p className="text-sm text-slate-500">No connectors.</p>
      ) : null}
    </div>
  );
}
