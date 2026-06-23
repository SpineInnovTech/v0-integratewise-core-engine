"use client";

import * as React from "react";

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function changedKeys(before: any, after: any) {
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changes: string[] = [];
  keys.forEach((k) => {
    const b = before?.[k];
    const a = after?.[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) changes.push(k);
  });
  return changes.sort();
}

export function DiffViewer(props: { before: unknown; after: unknown }) {
  const beforeText = React.useMemo(() => prettyJson(props.before), [props.before]);
  const afterText = React.useMemo(() => prettyJson(props.after), [props.after]);
  const keys = React.useMemo(
    () => changedKeys(props.before, props.after),
    [props.before, props.after]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Diff Preview
        </p>
        <p className="text-xs text-slate-500">Changed: {keys.length ? keys.join(", ") : "none"}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold border-b border-slate-200">Before</div>
          <pre className="p-3 text-xs overflow-auto max-h-[360px]">{beforeText}</pre>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold border-b border-slate-200">After</div>
          <pre className="p-3 text-xs overflow-auto max-h-[360px]">{afterText}</pre>
        </div>
      </div>
    </div>
  );
}
