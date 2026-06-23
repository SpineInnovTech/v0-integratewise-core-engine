import type { ComponentType } from "react";
import { FlaskConical } from "lucide-react";
import { useSpine } from "@/spine/spine-context";
import { MODULE_REGISTRY } from "@/spine/module-registry";
import { resolveSchemaState } from "@/spine/schema-availability";
import type { ModuleId } from "@/spine/types";
import { SchemaEmptyState } from "./schema-empty-state";

/**
 * Schema-aware content host. Resolves a module's backing schema state and
 * either renders its view (live/seeded) or the graceful empty state (off).
 * Seeded modules render with a "sample data" banner so the surface is honest.
 */
export function ModuleHost({
  id,
  view: ViewOverride,
  ...props
}: {
  id: ModuleId;
  view?: ComponentType<any>;
  [key: string]: unknown;
}) {
  const { schema } = useSpine();
  const def = MODULE_REGISTRY[id];
  const View = ViewOverride ?? def?.Component;
  const state = resolveSchemaState(schema, def?.requiredSchema);

  if (!View) {
    return <SchemaEmptyState moduleLabel={def?.label ?? id} required={def?.requiredSchema} />;
  }

  if (state === "off") {
    return <SchemaEmptyState moduleLabel={def?.label ?? id} required={def?.requiredSchema} />;
  }

  const showSampleBanner = state === "seeded" && id !== "settings";

  return (
    <div className="flex h-full flex-col">
      {showSampleBanner && (
        <div
          className="flex items-center gap-2 px-4 py-1.5 text-[11px] font-medium"
          style={{ background: "var(--iw-warning-50)", color: "var(--iw-warning)" }}
        >
          <FlaskConical className="h-3.5 w-3.5 shrink-0" />
          Sample data — connect a source in Integrations to bring {def?.label ?? id} live.
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <View {...props} />
      </div>
    </div>
  );
}
