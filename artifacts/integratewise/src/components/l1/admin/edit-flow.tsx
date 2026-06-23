"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffViewer } from "@/components/l1/admin/diff-viewer";

export type EditFlowResult<T> = {
  ok: boolean;
  saved?: T;
  auditId?: string;
  error?: string;
};

export function AdminEditFlow<T extends Record<string, any>>(props: {
  initial: T;
  title?: string;
  onSave: (next: T, justification: string) => Promise<EditFlowResult<T>>;
}) {
  const [draft, setDraft] = React.useState<T>(props.initial);
  const [justification, setJustification] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<EditFlowResult<T> | null>(null);

  const canSave = justification.trim().length >= 5;

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await props.onSave(draft, justification);
      setResult(res);
    } catch (e: any) {
      setResult({ ok: false, error: e?.message ?? "Failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {props.title ? <p className="text-sm font-semibold">{props.title}</p> : null}

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="diff">Diff</TabsTrigger>
          <TabsTrigger value="confirm">Confirm</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">JSON</p>
            <textarea
              className="mt-2 w-full h-56 text-xs font-mono rounded-lg border border-slate-200 p-3"
              title="JSON editor"
              placeholder="Edit JSON…"
              value={JSON.stringify(draft, null, 2)}
              onChange={(e) => {
                try {
                  setDraft(JSON.parse(e.target.value));
                } catch {
                  // ignore parse errors while typing
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="diff">
          <DiffViewer before={props.initial} after={draft} />
        </TabsContent>

        <TabsContent value="confirm" className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Justification
            </p>
            <Input
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Why are you making this change? (min 5 chars)"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Creates an audit entry on save.</p>
              <Button onClick={handleSave} disabled={!canSave || saving}>
                {saving ? "Saving…" : "Confirm & Save"}
              </Button>
            </div>
            {result ? (
              <div
                className={`text-xs rounded-lg border p-3 ${
                  result.ok
                    ? "border-iw-forest/20 bg-iw-forest/5 text-emerald-900"
                    : "border-iw-red/20 bg-iw-red/5 text-iw-red/90"
                }`}
              >
                {result.ok ? "Saved" : "Failed"}
                {result.auditId ? ` · Audit: ${result.auditId}` : ""}
                {result.error ? ` · ${result.error}` : ""}
              </div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
