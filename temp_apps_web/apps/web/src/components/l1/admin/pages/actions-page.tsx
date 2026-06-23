"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { AdminEditFlow } from "@/components/l1/admin/edit-flow";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { ActionTemplate } from "@/types/admin";

type ActionsResponse = {
  success: boolean;
  data: { templates: ActionTemplate[]; total: number };
};

export function ActionsControlPlanePage() {
  const { data, loading, error } = useAdminApi<ActionsResponse>("/api/admin/actions");
  const templates = data?.data.templates ?? [];
  const [selected, setSelected] = React.useState<ActionTemplate | null>(null);

  const cols: Array<DataTableColumn<ActionTemplate>> = [
    { key: "key", header: "Action", render: (a) => <div className="font-medium">{a.key}</div> },
    {
      key: "category",
      header: "Category",
      className: "w-[140px]",
      render: (a) => <Badge variant="outline">{a.category}</Badge>,
    },
    { key: "riskLevel", header: "Risk", className: "w-[90px]" },
    {
      key: "approvalRequired",
      header: "Approval",
      className: "w-[110px]",
      render: (a) => <Badge variant="secondary">{a.approvalRequired ? "yes" : "no"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Actions Control Plane</h1>
        <p className="text-sm text-slate-500 mt-1">
          Templates, safety constraints, simulation, rollback, and kill switches.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Safety</p>
        <p className="text-sm text-slate-600 mt-2">
          Risk routing + approval policies are enforced in Phase 3. This page manages templates and
          constraints.
        </p>
      </Card>

      <DataTable
        title="Action templates"
        rows={templates}
        columns={cols}
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.key : "Action"}
        description={selected ? selected.id : undefined}
      >
        {selected ? (
          <div className="space-y-6">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Overview</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-500">Connectors:</span>{" "}
                  {selected.connectors.join(", ")}
                </div>
                <div>
                  <span className="text-slate-500">Evidence:</span>{" "}
                  {selected.requiredEvidenceTypes.join(", ")}
                </div>
                <div>
                  <span className="text-slate-500">Simulation:</span>{" "}
                  {String(selected.simulationSupported)}
                </div>
                <div>
                  <span className="text-slate-500">Rollback:</span>{" "}
                  {String(selected.rollbackSupported)}
                </div>
              </div>
            </Card>

            <AdminEditFlow
              title="Edit action template (mock)"
              initial={selected}
              onSave={async (next, justification) => {
                const res = await fetch("/api/admin/actions", {
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
                return { ok: true, saved: json.data?.template ?? next, auditId: json.auditId };
              }}
            />
          </div>
        ) : null}
      </DetailDrawer>

      {!loading && templates.length === 0 ? (
        <p className="text-sm text-slate-500">No templates.</p>
      ) : null}
    </div>
  );
}
