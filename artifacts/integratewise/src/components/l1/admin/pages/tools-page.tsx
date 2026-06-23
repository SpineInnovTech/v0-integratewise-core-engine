"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tools = [
  {
    key: "preview_as",
    title: "Preview As",
    desc: "Preview navigation + modules as a role/world/account-role (Phase 3).",
  },
  {
    key: "policy_sim",
    title: "Policy Simulator",
    desc: "Test if a member can see/run something (Phase 3).",
  },
  {
    key: "registry_diff",
    title: "Registry Diff & Rollback",
    desc: "Diff registry versions and roll back safely (Phase 3).",
  },
  { key: "backfill", title: "Backfill Runner", desc: "Run connector backfills with guardrails." },
  {
    key: "reindex",
    title: "Reindex Runner",
    desc: "Reindex knowledge sources and rebuild summaries.",
  },
];

export function AdminToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Admin Tools</h1>
        <p className="text-sm text-slate-500 mt-1">
          Safe operational utilities (impersonation, backfills, reindexing, simulations).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((t) => (
          <Card key={t.key} className="p-4">
            <p className="text-sm font-semibold">{t.title}</p>
            <p className="text-sm text-slate-500 mt-1">{t.desc}</p>
            <div className="mt-3">
              <Button variant="outline" title={t.title} disabled>
                Open
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
