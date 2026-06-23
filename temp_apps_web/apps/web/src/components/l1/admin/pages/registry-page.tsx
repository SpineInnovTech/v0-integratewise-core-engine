"use client";

import * as React from "react";

import { AdminEditFlow } from "@/components/l1/admin/edit-flow";
import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { RegistryObject } from "@/types/admin";

type RegistryResponse = {
  success: boolean;
  data: { objects: RegistryObject[]; total: number };
};

export function RegistryPage() {
  const { data, loading, error } = useAdminApi<RegistryResponse>("/api/admin/registry");
  const objects = data?.data.objects ?? [];
  const [selected, setSelected] = React.useState<RegistryObject | null>(null);

  const cols: Array<DataTableColumn<RegistryObject>> = [
    {
      key: "displayName",
      header: "Object",
      render: (o) => <div className="font-medium">{o.displayName}</div>,
    },
    {
      key: "type",
      header: "Type",
      className: "w-[100px]",
      render: (o) => <Badge variant="outline">{o.type}</Badge>,
    },
    {
      key: "worldScope",
      header: "World",
      className: "w-[120px]",
      render: (o) => <Badge variant="secondary">{o.worldScope}</Badge>,
    },
    { key: "version", header: "Ver", className: "w-[80px]" },
    {
      key: "updatedAt",
      header: "Updated",
      className: "w-[180px]",
      render: (o) => new Date(o.updatedAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">View Registry</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registry-driven composition, gates, and versioning.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Objects</p>
          <p className="text-lg font-semibold mt-2">{loading ? "…" : objects.length}</p>
          <p className="text-xs text-slate-500">views, modules, hubs, lenses, nav</p>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">Publish workflow</p>
          <p className="text-sm text-slate-600 mt-2">
            Draft → Diff preview → Justification → Confirm → Audit entry.
          </p>
        </Card>
      </div>

      <DataTable
        title="Registry objects"
        rows={objects}
        columns={cols}
        searchPlaceholder="Search registry key, world, module…"
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.displayName : "Registry"}
        description={selected ? selected.registryKey : undefined}
      >
        {selected ? (
          <div className="space-y-6">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Summary</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-500">World:</span> {selected.worldScope}
                </div>
                <div>
                  <span className="text-slate-500">Department:</span> {selected.department ?? "—"}
                </div>
                <div>
                  <span className="text-slate-500">Account role:</span>{" "}
                  {selected.accountRole ?? "—"}
                </div>
                <div>
                  <span className="text-slate-500">Enabled:</span> {String(selected.enabled)}
                </div>
              </div>
            </Card>

            <AdminEditFlow
              title="Edit registry object (mock)"
              initial={selected}
              onSave={async (next, justification) => {
                const res = await fetch("/api/admin/registry", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    operation: "update",
                    before: selected,
                    after: next,
                    justification,
                  }),
                });
                const json = await res.json();
                if (!res.ok || !json?.success) return { ok: false, error: "Save failed" };
                return { ok: true, saved: json.data?.object ?? next, auditId: json.auditId };
              }}
            />
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
