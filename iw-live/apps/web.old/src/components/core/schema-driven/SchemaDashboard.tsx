/**
 * Schema-Driven Dashboard
 *
 * Complete dashboard that renders all sections based on schema from BFF.
 *
 * Backend Schema → BFF Transform → Organic UI Labels → This Component
 *
 * NO entity_type names in props
 * NO field names in props
 * Only organic labels: "Accounts", "Health Score", etc.
 */

import React from "react";
import { SchemaSection, type UISection, type UITransformedEntity } from "./SchemaSection";
import { Skeleton } from "@/components/ui/skeleton";

// Types from BFF transform
interface UIDashboardView {
  department: string;
  industry?: string | null;
  sections: UISection[];
  entities: UITransformedEntity[];
  summary: {
    total_entities: number;
    entity_types: string[];
    last_updated: string;
  };
}

interface SchemaDashboardProps {
  /** Dashboard data from BFF */
  view: UIDashboardView;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: Error | null;
  /** Section click handler */
  onSectionClick?: (sectionId: string) => void;
  /** Entity click handler */
  onEntityClick?: (entity: { display_name: string; section_id: string }) => void;
  /** Custom empty state component */
  emptyComponent?: React.ReactNode;
  /** Grid columns (responsive) */
  columns?: 1 | 2 | 3;
}

/**
 * SchemaDashboard - Full dashboard driven by schema
 *
 * Receives fully transformed view from BFF with organic labels only.
 */
export function SchemaDashboard({
  view,
  isLoading = false,
  error = null,
  onSectionClick,
  onEntityClick,
  emptyComponent,
  columns = 2,
}: SchemaDashboardProps) {
  // Group entities by section
  const entitiesBySection = React.useMemo(() => {
    const map = new Map<string, typeof view.entities>();
    for (const entity of view.entities) {
      const list = map.get(entity.section_id) || [];
      list.push(entity);
      map.set(entity.section_id, list);
    }
    return map;
  }, [view.entities]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-destructive mb-2">Failed to load dashboard</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton columns={columns} />;
  }

  if (view.sections.length === 0) {
    return (
      <div className="p-8 text-center">
        {emptyComponent || (
          <>
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-sm text-muted-foreground">
              Connect a data source to see your {view.department.toLowerCase()} dashboard
            </p>
          </>
        )}
      </div>
    );
  }

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold capitalize">
            {view.department.toLowerCase().replace("_", " ")} Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            {view.summary.total_entities.toLocaleString()} entities across {view.sections.length}{" "}
            sections
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date(view.summary.last_updated).toLocaleTimeString()}
        </div>
      </div>

      {/* Sections Grid */}
      <div className={`grid ${gridClass} gap-4`}>
        {view.sections.map((section) => (
          <div
            key={section.id}
            onClick={() => onSectionClick?.(section.id)}
            className={onSectionClick ? "cursor-pointer" : undefined}
          >
            <SchemaSection
              section={section}
              entities={entitiesBySection.get(section.id) || []}
              onEntityClick={onEntityClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for dashboard
 */
function DashboardSkeleton({ columns }: { columns: number }) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }[columns];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      <div className={`grid ${gridClass} gap-4`}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export default SchemaDashboard;
