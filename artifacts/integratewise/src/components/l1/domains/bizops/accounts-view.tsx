/**
 * BizOps — Accounts view
 * Migrated from l1/business-ops/accounts.tsx
 */
import { useState } from "react";
import {
  Search,
  Grid3x3,
  List,
  KanbanSquare,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import { ProvenanceBadge } from "@/components/l2/spine/readiness-bar";

interface Account {
  id: string;
  name: string;
  logo: string;
  arr: number;
  arrGrowth: number;
  healthScore: number;
  tier: "enterprise" | "mid-market" | "smb";
  region: string;
  industry: string;
  renewalDate: string;
  renewalDays: number;
  owner: { name: string; initials: string };
  integrationCompleteness: number;
  lastTouchpoint: string;
  provenance?: any[];
  sources?: string[];
}

function getHealthColor(score: number): string {
  if (score >= 80) return "var(--iw-success)";
  if (score >= 60) return "var(--iw-warning)";
  return "var(--iw-danger)";
}

function getHealthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At-Risk";
  return "Critical";
}

export function AccountsView() {
  const [viewType, setViewType] = useState<"grid" | "list" | "kanban">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const { data: spineAccounts, isLoading: spineLoading } = useWorkspaceEntities<Account>("account");
  const accounts: Account[] = spineAccounts || [];

  const filtered = accounts.filter((a) => {
    if (searchQuery && !(a.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
      return false;
    if (tierFilter !== "all" && a.tier !== tierFilter) return false;
    return true;
  });

  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);

  if (spineLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Accounts & Revenue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total ARR:{" "}
            <span style={{ fontWeight: 600, color: "var(--iw-forest-mid)" }}>
              ${(totalARR / 1000000).toFixed(2)}M
            </span>{" "}
            across {accounts.length} accounts
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
          >
            <option value="all">All Tiers</option>
            <option value="enterprise">Enterprise</option>
            <option value="mid-market">Mid-Market</option>
            <option value="smb">SMB</option>
          </select>
          <div className="flex bg-secondary rounded-md p-0.5">
            {(
              [
                { id: "grid" as const, icon: Grid3x3 },
                { id: "list" as const, icon: List },
                { id: "kanban" as const, icon: KanbanSquare },
              ] as const
            ).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewType(id)}
                className={`p-1.5 rounded transition-colors ${
                  viewType === id
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={
          viewType === "list"
            ? "space-y-2"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        }
      >
        {filtered.map((account) =>
          viewType === "list" ? (
            <AccountListItem key={account.id} account={account} />
          ) : (
            <AccountCard key={account.id} account={account} />
          )
        )}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
            No accounts yet. Connect your CRM to populate.
          </div>
        )}
      </div>
    </div>
  );
}

function AccountCard({ account }: { account: Account }) {
  const healthColor = getHealthColor(account.healthScore);
  const healthLabel = getHealthLabel(account.healthScore);

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{account.logo}</span>
          <div>
            <div className="text-sm" style={{ fontWeight: 500 }}>
              {account.name}
            </div>
            <div className="text-[10px] text-muted-foreground capitalize">
              {account.tier} · {account.industry}
            </div>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary">
          <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg" style={{ fontWeight: 600 }}>
            ${(account.arr / 1000).toFixed(0)}K
          </div>
          <div className="text-[10px] text-muted-foreground">ARR</div>
        </div>
        <span
          className="text-xs flex items-center gap-0.5"
          style={{
            fontWeight: 500,
            color: account.arrGrowth >= 0 ? "var(--iw-success)" : "var(--iw-danger)",
          }}
        >
          {account.arrGrowth >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {account.arrGrowth >= 0 ? "+" : ""}
          {account.arrGrowth}%
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground">Health Score</span>
          <span className="text-xs" style={{ fontWeight: 500, color: healthColor }}>
            {account.healthScore}/100 - {healthLabel}
          </span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${account.healthScore}%`, backgroundColor: healthColor }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Renewal in{" "}
          <span
            style={{
              fontWeight: 500,
              color:
                account.renewalDays <= 30
                  ? "var(--iw-danger)"
                  : account.renewalDays <= 90
                    ? "var(--iw-warning)"
                    : "var(--foreground)",
            }}
          >
            {account.renewalDays}d
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${account.integrationCompleteness}%`,
              backgroundColor: "var(--iw-forest-mid)",
            }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {account.integrationCompleteness}%
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]"
            style={{ backgroundColor: "var(--iw-gold)", fontWeight: 600 }}
          >
            {account.owner.initials}
          </div>
          <span className="text-[10px] text-muted-foreground">{account.owner.name}</span>
        </div>
        <div className="flex gap-1">
          {account.provenance && account.provenance.length > 0 ? (
            <ProvenanceBadge provenance={account.provenance} />
          ) : (
            (account.sources || []).map((src) => (
              <span
                key={src}
                className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground font-mono"
              >
                {src}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AccountListItem({ account }: { account: Account }) {
  const healthColor = getHealthColor(account.healthScore);

  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4">
      <span className="text-lg shrink-0">{account.logo}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm" style={{ fontWeight: 500 }}>
          {account.name}
        </div>
        <div className="text-[11px] text-muted-foreground capitalize">
          {account.tier} · {account.region}
        </div>
      </div>
      <div className="hidden sm:block text-right">
        <div className="text-sm" style={{ fontWeight: 600 }}>
          ${(account.arr / 1000).toFixed(0)}K
        </div>
        <span
          className="text-[10px]"
          style={{ color: account.arrGrowth >= 0 ? "var(--iw-success)" : "var(--iw-danger)" }}
        >
          {account.arrGrowth >= 0 ? "+" : ""}
          {account.arrGrowth}%
        </span>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px]"
          style={{ backgroundColor: healthColor, fontWeight: 600 }}
        >
          {account.healthScore}
        </div>
      </div>
      <div className="hidden lg:block text-xs text-muted-foreground">
        <span
          style={{
            fontWeight: 500,
            color: account.renewalDays <= 30 ? "var(--iw-danger)" : undefined,
          }}
        >
          {account.renewalDays}d
        </span>{" "}
        to renewal
      </div>
      <div className="flex items-center gap-1">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]"
          style={{ backgroundColor: "var(--iw-gold)", fontWeight: 600 }}
        >
          {account.owner.initials}
        </div>
      </div>
    </div>
  );
}

export default AccountsView;
