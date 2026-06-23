/**
 * BizOps — Partnerships & Business Development View
 *
 * Covers: Partner relationships, co-sell motions, ecosystem mapping,
 *         partner performance tracking
 */
import { useState } from "react";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import {
  Handshake,
  Globe,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Activity,
} from "lucide-react";

const ENTITY_TYPES = [
  "partner",
  "co_sell_opportunity",
  "ecosystem_map",
  "partner_metric",
  "alliance",
] as const;

export function PartnershipsView() {
  const {
    data: batch,
    isLoading,
    refetch,
  } = useWorkspaceEntitiesBatch([...ENTITY_TYPES], {
    limit: 200,
  });

  const partners = batch.partner ?? [];
  const coSellOpps = batch.co_sell_opportunity ?? [];
  const ecosystemMaps = batch.ecosystem_map ?? [];
  const partnerMetrics = batch.partner_metric ?? [];
  const alliances = batch.alliance ?? [];

  const activePartners = partners.filter(
    (p: any) => p.status === "active" || p.status === "engaged"
  );
  const openCoSell = coSellOpps.filter(
    (o: any) => o.status === "open" || o.status === "active" || o.status === "in_progress"
  );
  const wonCoSell = coSellOpps.filter((o: any) => o.status === "won" || o.status === "closed_won");

  const totalPartnerRevenue = coSellOpps.reduce(
    (s: number, o: any) => s + (o.value || o.amount || 0),
    0
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading partnerships data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Handshake className="h-5 w-5 text-[var(--iw-purple)]" />
            Partnerships & BD
          </h2>
          <p className="text-sm text-muted-foreground">
            Partner relationships, co-sell motions, and ecosystem performance
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-lg border hover:bg-accent text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI
          label="Active Partners"
          value={activePartners.length}
          icon={<Handshake className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Open Co-Sell"
          value={openCoSell.length}
          icon={<Target className="h-4 w-4" />}
          color="text-iw-slate-mid"
        />
        <MiniKPI
          label="Co-Sell Revenue"
          value={totalPartnerRevenue > 0 ? `$${(totalPartnerRevenue / 1000).toFixed(0)}K` : "$0"}
          icon={<DollarSign className="h-4 w-4" />}
          color="text-iw-forest-mid"
        />
        <MiniKPI
          label="Alliances"
          value={alliances.length}
          icon={<Globe className="h-4 w-4" />}
          color="text-iw-slate"
        />
      </div>

      {/* Partner Relationships */}
      <CollapsibleSection
        title="Partner Relationships"
        icon={<Handshake className="h-4 w-4 text-iw-slate-mid" />}
        count={partners.length}
        countLabel="partners"
        defaultOpen
      >
        {partners.length > 0 ? (
          <div className="space-y-2">
            {partners.slice(0, 10).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b last:border-0 text-sm"
              >
                <div className="truncate mr-2">
                  <span className="font-medium">
                    {p.name || p.partner_name || p.company || "Partner"}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {[p.type, p.tier, p.territory].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.partner_manager && (
                    <span className="text-xs text-muted-foreground">PM: {p.partner_manager}</span>
                  )}
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No partner relationships tracked</p>
        )}
      </CollapsibleSection>

      {/* Co-Sell Pipeline */}
      <CollapsibleSection
        title="Co-Sell Pipeline"
        icon={<Target className="h-4 w-4 text-iw-slate-mid" />}
        count={coSellOpps.length}
        countLabel="opportunities"
        defaultOpen
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Open ({openCoSell.length})
            </h4>
            {openCoSell.length > 0 ? (
              openCoSell.slice(0, 8).map((o: any) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {o.name || o.title || o.opportunity_name || "Opportunity"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {o.partner_name || o.partner || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {o.value != null && (
                      <span className="text-xs text-muted-foreground">
                        ${(o.value / 1000).toFixed(0)}K
                      </span>
                    )}
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No open co-sell opportunities</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Won ({wonCoSell.length})
            </h4>
            {wonCoSell.length > 0 ? (
              wonCoSell.slice(0, 8).map((o: any) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm"
                >
                  <div className="truncate mr-2">
                    <span className="font-medium">
                      {o.name || o.title || o.opportunity_name || "Opportunity"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {o.partner_name || o.partner || "—"}
                    </p>
                  </div>
                  {o.value != null && (
                    <span className="text-xs font-semibold text-iw-forest-mid shrink-0">
                      ${(o.value / 1000).toFixed(0)}K
                    </span>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-2">No closed co-sell deals</p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* Ecosystem Map */}
      <CollapsibleSection
        title="Ecosystem Mapping"
        icon={<Globe className="h-4 w-4 text-iw-slate" />}
        count={ecosystemMaps.length}
        countLabel="maps"
      >
        {ecosystemMaps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ecosystemMaps.slice(0, 8).map((m: any) => (
              <div key={m.id} className="border rounded-lg p-4 bg-card">
                <h4 className="text-sm font-semibold mb-1">
                  {m.name || m.title || m.ecosystem_name || "Ecosystem"}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">{m.description || "—"}</p>
                <div className="flex items-center gap-3 text-xs">
                  {m.partner_count != null && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {m.partner_count} partners
                    </span>
                  )}
                  {m.market_coverage && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {m.market_coverage}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No ecosystem maps defined</p>
        )}
      </CollapsibleSection>

      {/* Partner Performance */}
      <CollapsibleSection
        title="Partner Performance"
        icon={<TrendingUp className="h-4 w-4 text-iw-forest-mid" />}
        count={partnerMetrics.length}
        countLabel="metrics"
      >
        {partnerMetrics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerMetrics.slice(0, 12).map((m: any) => (
              <div key={m.id} className="border rounded-lg p-4 bg-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {m.partner_name || m.partner || "Partner"}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-bold">{m.current_value ?? m.value ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {m.metric_type && (
                    <span className="text-xs text-muted-foreground">{m.metric_type}</span>
                  )}
                  {m.trend && <TrendIndicator trend={m.trend} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">No partner performance metrics</p>
        )}
      </CollapsibleSection>
    </div>
  );
}

function MiniKPI({
  label,
  value,
  icon,
  color = "text-muted-foreground",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="p-3 border rounded-lg bg-card">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  count,
  countLabel,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  countLabel: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          <span className="text-xs text-muted-foreground">
            ({count} {countLabel})
          </span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const s = status.toLowerCase();
  const color =
    s === "active" ||
    s === "running" ||
    s === "live" ||
    s === "enabled" ||
    s === "on_track" ||
    s === "engaged"
      ? "bg-iw-forest/10 text-iw-forest dark:bg-iw-forest/90/20 dark:text-iw-forest-bright/80"
      : s === "paused" || s === "pending" || s === "draft" || s === "in_progress"
        ? "bg-iw-gold/10 text-iw-gold dark:bg-iw-gold/90/20 dark:text-iw-gold-light"
        : s === "completed" || s === "done" || s === "won" || s === "closed_won"
          ? "bg-iw-slate/10 text-iw-slate dark:bg-iw-slate/90/20 dark:text-iw-slate-mid/80"
          : s === "failed" ||
              s === "lost" ||
              s === "blocked" ||
              s === "at_risk" ||
              s === "closed_lost"
            ? "bg-iw-red/10 text-iw-red dark:bg-iw-red/90/20 dark:text-iw-red/70"
            : "bg-muted text-muted-foreground";

  return <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>{status}</span>;
}

function TrendIndicator({ trend }: { trend: string }) {
  const t = trend.toLowerCase();
  if (t === "up" || t === "increasing" || t === "positive") {
    return <TrendingUp className="h-3 w-3 text-iw-forest-bright" />;
  }
  if (t === "down" || t === "decreasing" || t === "negative") {
    return <TrendingUp className="h-3 w-3 text-iw-red rotate-180" />;
  }
  return <Activity className="h-3 w-3 text-muted-foreground" />;
}

export default PartnershipsView;
