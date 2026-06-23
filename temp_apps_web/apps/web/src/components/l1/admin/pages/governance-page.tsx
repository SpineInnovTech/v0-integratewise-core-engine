"use client";

import * as React from "react";

import { DataTable, type DataTableColumn } from "@/components/l1/admin/data-table";
import { DetailDrawer } from "@/components/l1/admin/detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import type { GovernanceRequest } from "@/types/admin";

type GovernanceResponse = {
  success: boolean;
  data: { requests: GovernanceRequest[]; total: number };
};

export function GovernancePage() {
  const { data, loading, error } = useAdminApi<GovernanceResponse>("/api/admin/governance");
  const requests = data?.data.requests ?? [];
  const [selected, setSelected] = React.useState<GovernanceRequest | null>(null);

  const cols: Array<DataTableColumn<GovernanceRequest>> = [
    {
      key: "actionKey",
      header: "Action",
      render: (r) => <div className="font-medium">{r.actionKey}</div>,
    },
    { key: "tenantId", header: "Tenant", className: "w-[140px]" },
    { key: "riskScore", header: "Risk", className: "w-[90px]" },
    { key: "blastRadius", header: "Blast", className: "w-[90px]" },
    {
      key: "status",
      header: "Status",
      className: "w-[120px]",
      render: (r) => <Badge variant="secondary">{r.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Governance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Approvals, guardrails, and policy breach workflows.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Queue</p>
        <p className="text-sm text-slate-600 mt-2">
          Pending approvals are routed by risk and blast radius (Phase 3 adds policy editor).
        </p>
      </Card>

      <DataTable
        title="Requests"
        rows={requests}
        columns={cols}
        onRowClick={(row) => setSelected(row)}
      />

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? selected.actionKey : "Request"}
        description={selected ? selected.id : undefined}
      >
        {selected ? (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Decision</p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={async () => {
                    await fetch("/api/admin/governance", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: selected.id, decision: "approve" }),
                    });
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await fetch("/api/admin/governance", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: selected.id, decision: "reject" }),
                    });
                  }}
                >
                  Reject
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </DetailDrawer>

      {!loading && requests.length === 0 ? (
        <p className="text-sm text-slate-500">No governance requests.</p>
      ) : null}
    </div>
  );
}
