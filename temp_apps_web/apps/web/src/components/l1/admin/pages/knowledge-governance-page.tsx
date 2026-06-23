"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";

type KnowledgeResponse = {
  success: boolean;
  data: {
    sources: Array<{
      id: string;
      name: string;
      status: string;
      indexedDocs: number;
      lastIndexAt: string;
    }>;
    total: number;
  };
};

export function KnowledgeGovernancePage() {
  const { data, loading, error } = useAdminApi<KnowledgeResponse>("/api/admin/knowledge");
  const sources = data?.data.sources ?? [];

  const cols: Array<DataTableColumn<any>> = [
    { key: "name", header: "Source", render: (s) => <div className="font-medium">{s.name}</div> },
    {
      key: "status",
      header: "Status",
      className: "w-[140px]",
      render: (s) => <Badge variant="secondary">{s.status}</Badge>,
    },
    { key: "indexedDocs", header: "Indexed", className: "w-[120px]" },
    {
      key: "lastIndexAt",
      header: "Last index",
      className: "w-[180px]",
      render: (s) => new Date(s.lastIndexAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Knowledge Governance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Index health, allowed sources, PII scrubbing, retention, and deletion workflows.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Controls</p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/admin/knowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ operation: "reindex" }),
              });
            }}
          >
            Reindex
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/admin/knowledge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ operation: "rebuild_summaries" }),
              });
            }}
          >
            Rebuild summaries
          </Button>
        </div>
      </Card>

      <DataTable title="Sources" rows={sources} columns={cols} />

      {!loading && sources.length === 0 ? (
        <p className="text-sm text-slate-500">No sources.</p>
      ) : null}
    </div>
  );
}
