"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { AuditLogEntry } from "@/types/admin";

type AuditResponse = {
  success: boolean;
  data: { entries: AuditLogEntry[]; total: number };
};

export function AdminAuditPage() {
  const { data, loading, error } = useAdminApi<AuditResponse>("/api/admin/audit");
  const entries = data?.data.entries ?? [];
  const [selected, setSelected] = React.useState<AuditLogEntry | null>(null);

  const cols: Array<DataTableColumn<AuditLogEntry>> = [
    {
      key: "timestamp",
      header: "Time",
      className: "w-[180px]",
      render: (e) => new Date(e.timestamp).toLocaleString(),
    },
    {
      key: "action",
      header: "Action",
      render: (e) => <div className="font-medium">{e.action}</div>,
    },
    { key: "actor", header: "Actor", className: "w-[140px]" },
    {
      key: "objectType",
      header: "Type",
      className: "w-[120px]",
      render: (e) => <Badge variant="outline">{e.objectType}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Audit</h1>
        <p className="text-sm text-slate-500 mt-1">
          Immutable traceability for registry, IAM, connectors, billing, and actions.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Entries</p>
          <p className="text-lg font-semibold mt-2">{loading ? "…" : entries.length}</p>
        </Card>
        <Card className="p-4 lg:col-span-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">Filters</p>
          <p className="text-sm text-slate-600 mt-2">
            Advanced filtering + pagination wiring lands in Phase 3.
          </p>
        </Card>
      </div>

      <DataTable
        title="Audit log"
        rows={entries}
        columns={cols}
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.action : "Audit"}
        description={selected ? selected.id : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Record</p>
              <div className="mt-2 text-sm text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-500">Actor:</span> {selected.actor}
                </div>
                <div>
                  <span className="text-slate-500">Target:</span> {selected.target}
                </div>
                <div>
                  <span className="text-slate-500">Object:</span> {selected.objectType} /{" "}
                  {selected.objectId}
                </div>
                <div>
                  <span className="text-slate-500">Justification:</span>{" "}
                  {selected.justification ?? "—"}
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Before / After</p>
              <pre className="mt-2 text-xs rounded-lg border border-slate-200 bg-slate-50 p-3 overflow-auto max-h-[320px]">
                {JSON.stringify({ before: selected.before, after: selected.after }, null, 2)}
              </pre>
            </Card>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
