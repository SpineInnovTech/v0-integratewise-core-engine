"use client";

import * as React from "react";

import { AdminEditFlow } from "@/components/l1/admin/edit-flow";
import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { Tenant } from "@/types/admin";

type TenantsResponse = {
  success: boolean;
  data: { tenants: Tenant[]; total: number };
};

export function TenancyPage() {
  const { data, loading, error } = useAdminApi<TenantsResponse>("/api/admin/tenants");
  const tenants = data?.data.tenants ?? [];

  const [selected, setSelected] = React.useState<Tenant | null>(null);

  const cols: Array<DataTableColumn<Tenant>> = [
    { key: "name", header: "Tenant", render: (t) => <div className="font-medium">{t.name}</div> },
    {
      key: "plan",
      header: "Plan",
      className: "w-[120px]",
      render: (t) => <Badge variant="outline">{t.plan}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      className: "w-[120px]",
      render: (t) => (
        <Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge>
      ),
    },
    {
      key: "lastActiveAt",
      header: "Last Active",
      className: "w-[180px]",
      render: (t) => new Date(t.lastActiveAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Organization & Tenancy</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tenants, domains, plan gates, and org defaults.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Summary</p>
          <div className="mt-2 text-sm text-slate-600">
            <div>
              Total tenants: <span className="font-semibold">{loading ? "…" : tenants.length}</span>
            </div>
            <div className="mt-1">
              Active:{" "}
              <span className="font-semibold">
                {loading ? "…" : tenants.filter((t) => t.status === "active").length}
              </span>
            </div>
          </div>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">Policy defaults</p>
          <p className="text-sm text-slate-600 mt-2">
            Retention, masking, and org-wide defaults will be managed here in Phase 3.
          </p>
        </Card>
      </div>

      <DataTable
        title="Tenants"
        rows={tenants}
        columns={cols}
        searchPlaceholder="Search tenants, domains, plans…"
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.name : "Tenant"}
        description={selected ? selected.id : undefined}
      >
        {selected ? (
          <div className="space-y-6">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Overview</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-500">Domains:</span> {selected.domains.join(", ")}
                </div>
                <div>
                  <span className="text-slate-500">Plan:</span> {selected.plan}
                </div>
                <div>
                  <span className="text-slate-500">Status:</span> {selected.status}
                </div>
              </div>
            </Card>

            <AdminEditFlow
              title="Edit tenant (mock)"
              initial={selected}
              onSave={async (next, justification) => {
                const res = await fetch("/api/admin/tenants", {
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
                return { ok: true, saved: json.data?.tenant ?? next, auditId: json.auditId };
              }}
            />
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
