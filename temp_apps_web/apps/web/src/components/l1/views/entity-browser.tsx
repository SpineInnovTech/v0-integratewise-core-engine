/**
 * Entity Browser — Universal search across all entity types
 * The "Knowledge Workspace" view — find any customer, contact, deal, ticket
 * Click any row → Entity 360 detail view
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Database,
  Users,
  Building2,
  Ticket,
  DollarSign,
  RefreshCw,
  ChevronRight,
  Heart,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface EntityRow {
  id: string;
  entity_type: string;
  name?: string;
  title?: string;
  company?: string;
  email?: string;
  health_score?: number;
  arr?: number;
  status?: string;
  source?: string;
  updated_at?: string;
}

interface EntityBrowserProps {
  onSelectEntity?: (entityId: string) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  account: Building2,
  contact: Users,
  deal: DollarSign,
  opportunity: DollarSign,
  ticket: Ticket,
};

const ENTITY_TYPES = ["all", "account", "contact", "deal", "opportunity", "ticket", "task", "lead"];

export function EntityBrowser({ onSelectEntity }: EntityBrowserProps) {
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [total, setTotal] = useState(0);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (typeFilter !== "all") params.entity_type = typeFilter;
      if (search) params.search = search;
      const qs = new URLSearchParams(params).toString();
      const res = await apiFetch<{ entities?: EntityRow[]; total?: number }>(
        `/api/v1/workspace/entities?${qs}`,
        {},
        "EntityBrowser"
      );
      setEntities(res.entities || []);
      setTotal(res.total || res.entities?.length || 0);
    } catch (err) {
      console.error("[EntityBrowser] Failed:", err);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchEntities, 300);
    return () => clearTimeout(debounce);
  }, [fetchEntities]);

  const getDisplayName = (e: EntityRow) => e.name || e.title || e.company || e.email || e.id;
  const getHealthColor = (score?: number) =>
    !score
      ? "text-muted-foreground"
      : score >= 70
        ? "text-iw-forest-mid"
        : score >= 40
          ? "text-iw-gold"
          : "text-iw-red";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b px-6 py-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Database className="w-5 h-5" /> Entity Browser
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entities by name, email, company..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {ENTITY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs rounded-lg capitalize whitespace-nowrap transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? `All (${total})` : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : entities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Database className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">
              {search
                ? "No entities match your search"
                : "No entities yet. Connect a tool to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {entities.map((entity) => {
              const Icon = TYPE_ICONS[entity.entity_type] || Database;
              return (
                <button
                  key={entity.id}
                  onClick={() => onSelectEntity?.(entity.id)}
                  className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{getDisplayName(entity)}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entity.entity_type}
                      {entity.source ? ` · ${entity.source}` : ""}
                      {entity.updated_at
                        ? ` · ${new Date(entity.updated_at).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  {entity.arr != null && entity.arr > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ${(entity.arr / 1000).toFixed(0)}K
                    </span>
                  )}
                  {entity.health_score != null && (
                    <span className={`text-sm font-bold ${getHealthColor(entity.health_score)}`}>
                      {entity.health_score}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default EntityBrowser;
