import { Database, Plug, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { SCHEMA_GROUP_LABEL } from "@/spine/schema-availability";
import type { SchemaGroup } from "@/spine/types";

/**
 * Graceful degradation surface — shown when a module's backing schema is
 * entirely off. Explicit and actionable rather than fake data or a crash.
 */
export function SchemaEmptyState({
  moduleLabel,
  required = [],
}: {
  moduleLabel: string;
  required?: SchemaGroup[];
}) {
  const groups = required.map((g) => SCHEMA_GROUP_LABEL[g]).join(", ");
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)" }}
        >
          <Database className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{moduleLabel} isn't connected yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          This workspace needs {groups ? <span className="font-medium text-foreground">{groups}</span> : "backing"} schema
          before {moduleLabel} can show real data. Connect a source or seed sample
          data to bring it online.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href="/integrations"
            className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-colors"
            style={{ background: "var(--iw-blue)" }}
          >
            <Plug className="h-4 w-4" /> Connect a source
          </Link>
          <Link
            href="/data-sources"
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            style={{ borderColor: "var(--border)" }}
          >
            <Sparkles className="h-4 w-4" /> Seed sample data
          </Link>
        </div>
      </div>
    </div>
  );
}
