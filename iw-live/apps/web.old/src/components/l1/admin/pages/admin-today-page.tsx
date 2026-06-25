"use client";

import * as React from "react";

import { useAdminApi } from "@/components/l1/admin/use-admin-api";
import { Card } from "@/components/ui/card";

type AdminTodayResponse = {
  success: boolean;
  data: {
    tiles: Array<{ key: string; label: string; value: string }>;
    feed: Array<{ id: string; type: string; title: string; detail: string; ts: string }>;
  };
};

export function AdminTodayPage() {
  const { data, loading, error } = useAdminApi<AdminTodayResponse>("/api/admin/today");

  const tiles = data?.data.tiles ?? [];
  const feed = data?.data.feed ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-400">Admin</p>
        <h1 className="text-2xl font-semibold">Today</h1>
        <p className="text-sm text-slate-500 mt-1">
          Ops console across services, connectors, governance, billing, and security.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 p-4 text-iw-red/90 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(loading ? Array.from({ length: 6 }) : tiles).map((t: any, idx) => (
          <Card key={t?.key ?? idx} className="p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {t?.label ?? "Loading"}
            </p>
            <p className="text-lg font-semibold mt-2">{t?.value ?? "…"}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">What changed</p>
        <div className="mt-3 space-y-2">
          {feed.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div>
                <p className="text-sm font-semibold">{evt.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{evt.detail}</p>
              </div>
              <p className="text-xs text-slate-500 whitespace-nowrap">
                {new Date(evt.ts).toLocaleString()}
              </p>
            </div>
          ))}
          {!loading && feed.length === 0 ? (
            <p className="text-sm text-slate-500">No events.</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
