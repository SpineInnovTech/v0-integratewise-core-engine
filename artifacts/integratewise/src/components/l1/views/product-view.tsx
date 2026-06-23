/**
 * ProductView — Generic adaptive product renderer
 *
 * Renders any product by reading its entity types from product_schema (DB).
 * When connectors add new entity types → INSERT into product_schema → view adapts.
 *
 * Layout:
 *   1. KPI strip (counts per entity type)
 *   2. Primary entity table (the is_primary entity type)
 *   3. Supporting data sections (other entity types)
 *   4. Insights section (generated_insight, if present)
 *
 * Full Twin products with dedicated views (SuccessPilot, ChurnShield,
 * SuccessCommand, OpsCore, LifeOps) can keep their custom components.
 * This generic renderer handles the other 15 products.
 *
 * @see hooks/use-product-entities.ts
 * @see sql-migrations/071_adaptive_product_schema.sql
 */
import React, { useMemo } from "react";
import {
  useProductEntities,
  type ProductSchemaItem,
  type ProductCatalogItem,
} from "@/hooks/use-product-entities";
import {
  Database,
  FileText,
  BarChart3,
  Users,
  AlertTriangle,
  Zap,
  Package,
  Layers,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Entity type display config
// ---------------------------------------------------------------------------
const ENTITY_DISPLAY: Record<string, { label: string; icon: React.ReactNode }> = {
  account: { label: "Accounts", icon: <Users className="h-4 w-4" /> },
  account_master: { label: "Accounts", icon: <Users className="h-4 w-4" /> },
  contact: { label: "Contacts", icon: <Users className="h-4 w-4" /> },
  opportunity: { label: "Opportunities", icon: <BarChart3 className="h-4 w-4" /> },
  deal: { label: "Deals", icon: <BarChart3 className="h-4 w-4" /> },
  lead: { label: "Leads", icon: <Users className="h-4 w-4" /> },
  task: { label: "Tasks", icon: <FileText className="h-4 w-4" /> },
  task_item: { label: "Tasks", icon: <FileText className="h-4 w-4" /> },
  contract: { label: "Contracts", icon: <FileText className="h-4 w-4" /> },
  invoice: { label: "Invoices", icon: <FileText className="h-4 w-4" /> },
  payment: { label: "Payments", icon: <BarChart3 className="h-4 w-4" /> },
  expense: { label: "Expenses", icon: <BarChart3 className="h-4 w-4" /> },
  budget: { label: "Budgets", icon: <BarChart3 className="h-4 w-4" /> },
  vendor: { label: "Vendors", icon: <Users className="h-4 w-4" /> },
  employee: { label: "Employees", icon: <Users className="h-4 w-4" /> },
  campaign: { label: "Campaigns", icon: <Zap className="h-4 w-4" /> },
  workflow: { label: "Workflows", icon: <Layers className="h-4 w-4" /> },
  risk: { label: "Risks", icon: <AlertTriangle className="h-4 w-4" /> },
  risk_register: { label: "Risk Register", icon: <AlertTriangle className="h-4 w-4" /> },
  generated_insight: { label: "Insights", icon: <Zap className="h-4 w-4" /> },
  signal: { label: "Signals", icon: <Zap className="h-4 w-4" /> },
  goal: { label: "Goals", icon: <BarChart3 className="h-4 w-4" /> },
  metric: { label: "Metrics", icon: <BarChart3 className="h-4 w-4" /> },
  note: { label: "Notes", icon: <FileText className="h-4 w-4" /> },
  activity: { label: "Activities", icon: <FileText className="h-4 w-4" /> },
  course: { label: "Courses", icon: <Package className="h-4 w-4" /> },
  engagement: { label: "Engagements", icon: <Users className="h-4 w-4" /> },
};

function getEntityDisplay(entityType: string) {
  return (
    ENTITY_DISPLAY[entityType] ?? {
      label: entityType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: <Database className="h-4 w-4" />,
    }
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function KPIStrip({ schema, data }: { schema: ProductSchemaItem[]; data: Record<string, any[]> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {schema.map((item) => {
        const display = getEntityDisplay(item.entity_type);
        const count = data[item.entity_type]?.length ?? 0;
        return (
          <div key={item.entity_type} className="p-3 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground truncate">{display.label}</span>
              <span className="text-muted-foreground">{display.icon}</span>
            </div>
            <p className="text-xl font-bold">{count}</p>
          </div>
        );
      })}
    </div>
  );
}

function EntityTable({ entityType, rows }: { entityType: string; rows: any[] }) {
  const display = getEntityDisplay(entityType);

  if (rows.length === 0) {
    return (
      <div className="border rounded-lg p-6 text-center text-sm text-muted-foreground">
        No {display.label.toLowerCase()} yet. Connect a data source to populate this view.
      </div>
    );
  }

  // Auto-detect columns from the first row, excluding internal fields
  const HIDDEN_COLS = new Set([
    "id",
    "tenant_id",
    "org_id",
    "team_id",
    "created_at",
    "updated_at",
    "deleted_at",
    "scope",
    "raw_payload",
    "source_payload",
  ]);

  const columns = Object.keys(rows[0]).filter(
    (k) => !HIDDEN_COLS.has(k) && !k.endsWith("_id") && typeof rows[0][k] !== "object"
  );

  // Show max 6 columns
  const visibleCols = columns.slice(0, 6);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b flex items-center gap-2">
        {display.icon}
        <span className="font-medium text-sm">{display.label}</span>
        <span className="text-xs text-muted-foreground ml-auto">{rows.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {visibleCols.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">
                  {col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 25).map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                {visibleCols.map((col) => (
                  <td key={col} className="px-3 py-2 truncate max-w-[200px]">
                    {formatCellValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 25 && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-t">
            Showing 25 of {rows.length} records
          </div>
        )}
      </div>
    </div>
  );
}

function InsightsPanel({ insights }: { insights: any[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b flex items-center gap-2">
        <Zap className="h-4 w-4 text-iw-gold" />
        <span className="font-medium text-sm">AI Insights</span>
        <span className="text-xs text-muted-foreground ml-auto">{insights.length}</span>
      </div>
      <div className="divide-y">
        {insights.slice(0, 5).map((insight: any, i: number) => (
          <div key={i} className="p-3">
            <p className="text-sm">{insight.insight_text || insight.title || "Insight"}</p>
            {insight.recommended_action && (
              <p className="text-xs text-muted-foreground mt-1">
                Action: {insight.recommended_action}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return String(value);
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Twin tier badge
// ---------------------------------------------------------------------------
function TwinBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; className: string }> = {
    no_twin: {
      label: "Data + Dashboards",
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    basic_twin: {
      label: "Basic Twin",
      className: "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90 dark:text-iw-slate-mid/60",
    },
    full_twin: {
      label: "Full Twin + TruthLayer",
      className:
        "bg-iw-slate-mid/10 text-iw-slate dark:bg-iw-slate-mid/90 dark:text-iw-slate-mid/60",
    },
  };
  const c = config[tier] ?? config.no_twin;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.className}`}>{c.label}</span>
  );
}

// ---------------------------------------------------------------------------
// ProductView — Main export
// ---------------------------------------------------------------------------
export interface ProductViewProps {
  /** Product ID from product_catalog (e.g., "fin_pulse", "data_sentinel") */
  productId: string;
  /** Optional catalog info (avoids extra query if parent already has it) */
  catalog?: ProductCatalogItem;
  /** Override display name */
  title?: string;
  /** Override description */
  subtitle?: string;
}

export function ProductView({ productId, catalog, title, subtitle }: ProductViewProps) {
  const { data, schema, isLoading, error } = useProductEntities(productId);

  // Split schema into primary, insights, and supporting
  const { primaryItems, insightsItems, supportingItems } = useMemo(() => {
    const primary: ProductSchemaItem[] = [];
    const insights: ProductSchemaItem[] = [];
    const supporting: ProductSchemaItem[] = [];

    for (const item of schema) {
      if (item.entity_type === "generated_insight") {
        insights.push(item);
      } else if (item.is_primary) {
        primary.push(item);
      } else {
        supporting.push(item);
      }
    }

    return { primaryItems: primary, insightsItems: insights, supportingItems: supporting };
  }, [schema]);

  const displayName =
    title ??
    catalog?.display_name ??
    productId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const displaySubtitle = subtitle ?? catalog?.description ?? "";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading {displayName}...
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center h-64 text-iw-red">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{displayName}</h2>
          {displaySubtitle && (
            <p className="text-sm text-muted-foreground mt-1">{displaySubtitle}</p>
          )}
        </div>
        {catalog && <TwinBadge tier={catalog.twin_tier} />}
      </div>

      {/* KPI Strip */}
      <KPIStrip schema={schema} data={data} />

      {/* Primary entity table(s) */}
      {primaryItems.map((item) => (
        <EntityTable
          key={item.entity_type}
          entityType={item.entity_type}
          rows={data[item.entity_type] ?? []}
        />
      ))}

      {/* Supporting data tables */}
      {supportingItems.map((item) => (
        <EntityTable
          key={item.entity_type}
          entityType={item.entity_type}
          rows={data[item.entity_type] ?? []}
        />
      ))}

      {/* Insights */}
      {insightsItems.length > 0 && <InsightsPanel insights={data.generated_insight ?? []} />}

      {/* Empty state */}
      {schema.length === 0 && (
        <div className="border rounded-lg p-12 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No data schema configured</h3>
          <p className="text-sm text-muted-foreground">
            This product has no entity types mapped yet. Connect data sources to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProductView;
