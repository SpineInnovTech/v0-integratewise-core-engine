"use client";

import { Card } from "@/components/ui/card";

export function SchemaPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Data Planes & Schema</h1>
        <p className="text-sm text-slate-500 mt-1">
          Canonical entities, traits, event mappings, validation, classification, retention.
        </p>
      </div>

      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
        <p className="text-sm text-slate-600 mt-2">
          UI wiring for canonical schema registry lands in Phase 3. This route is now live in the
          AdminShell.
        </p>
      </Card>
    </div>
  );
}
