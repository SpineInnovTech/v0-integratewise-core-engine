import { useEffect, useState } from "react";
import { api, type WorkspaceDashboardResponse } from "../lib/api";
import { Database, Activity, CheckSquare, Plug, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState<WorkspaceDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = () => {
    api
      .getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-shimmer relative overflow-hidden">
        {/* Shimmer line */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        <div className="h-8 w-48 bg-iw-rule-light rounded-md mb-6" />

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 bg-iw-paper-warm/60 border border-iw-rule-light rounded-xl h-24 flex flex-col justify-between"
            />
          ))}
        </div>

        {/* Signals Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-32 bg-iw-rule-light rounded-md" />
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 bg-iw-paper-warm/60 border border-iw-rule-light rounded-xl h-16"
              />
            ))}
          </div>
        </div>

        {/* Connected Tools Skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-40 bg-iw-rule-light rounded-md" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-iw-paper-warm/60 border border-iw-rule-light rounded-xl h-14"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-20 text-center">
        <div className="glass-card inline-flex flex-col items-center justify-center p-8 space-y-4 rounded-xl border border-iw-red/20 bg-iw-red/5">
          <div className="p-3 bg-iw-red/10 rounded-full text-iw-red">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-iw-ink">Failed to load dashboard</h2>
          <p className="text-sm text-iw-slate-mid">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchDashboard();
            }}
            className="btn-primary mt-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const activeSignals = data.active_signals ?? 0;
  const pendingApprovals = data.pending_approvals ?? 0;
  const connectors = data.connectors ?? [];
  const signals = data.signals ?? [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-iw-ink tracking-tight font-sans">Workspace</h1>
        <div className="flex items-center gap-2 text-2xs text-iw-slate opacity-75 font-mono uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-iw-forest opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-iw-forest"></span>
          </span>
          Live spine connected
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Entities"
          value={data.entity_count}
          icon={Database}
          colorClass="bg-iw-forest/10 text-iw-forest"
        />
        <StatCard
          label="Active Signals"
          value={activeSignals}
          icon={Activity}
          colorClass={
            activeSignals > 0 ? "bg-iw-gold/15 text-iw-gold" : "bg-green-100 text-green-700"
          }
          pulse={activeSignals > 0}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
          icon={CheckSquare}
          colorClass={
            pendingApprovals > 0 ? "bg-iw-red/15 text-iw-red" : "bg-green-100 text-green-700"
          }
          pulse={pendingApprovals > 0}
        />
        <StatCard
          label="Connected Tools"
          value={connectors.length}
          icon={Plug}
          colorClass="bg-iw-forest/10 text-iw-forest"
        />
      </div>

      {/* Signals Feed */}
      {signals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-iw-forest rounded-full" />
            <h2 className="text-xl font-bold text-iw-ink tracking-tight font-sans">
              Active Signals
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((signal) => {
              const severityStyles: Record<string, string> = {
                critical: "border-l-4 border-iw-red bg-iw-red/5",
                high: "border-l-4 border-iw-gold bg-iw-gold/5",
                medium: "border-l-4 border-iw-forest bg-iw-forest/5",
              };
              return (
                <div
                  key={signal.id}
                  className={`p-5 rounded-xl border border-iw-rule bg-iw-paper-warm transition-all hover:shadow-md duration-300 ${
                    severityStyles[signal.severity] || "border-l-4 border-iw-slate"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-iw-ink">{signal.title}</span>
                    <span
                      className={`text-2xs uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                        signal.severity === "critical"
                          ? "bg-iw-red/10 text-iw-red"
                          : signal.severity === "high"
                            ? "bg-iw-gold/10 text-iw-gold"
                            : "bg-iw-forest/10 text-iw-forest"
                      }`}
                    >
                      {signal.severity}
                    </span>
                  </div>
                  {signal.description && (
                    <p className="text-sm text-iw-slate-mid">{signal.description}</p>
                  )}
                  <div className="text-3xs text-iw-slate mt-3 opacity-60">
                    Detected: {new Date(signal.created_at).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connected Tools */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-iw-forest rounded-full" />
          <h2 className="text-xl font-bold text-iw-ink tracking-tight font-sans">
            Connected Tools
          </h2>
        </div>
        {connectors.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-iw-rule rounded-xl text-center text-iw-slate bg-iw-paper-warm/50">
            No tools connected yet. Connect your first tool to start flowing data.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectors.map((c, i) => (
              <div
                key={i}
                className="p-4 border border-iw-rule bg-iw-paper-warm rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-iw-forest/10 rounded-lg text-iw-forest">
                    <Plug className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold capitalize text-iw-ink">{c.tool_name}</span>
                    <span
                      className={`ml-2 text-2xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        c.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-iw-paper-deep text-iw-slate"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-iw-slate text-right">
                  <div className="font-semibold text-iw-ink">{c.entity_count} entities</div>
                  <div className="text-3xs opacity-60 mt-0.5">
                    Last sync:{" "}
                    {c.last_sync_at ? new Date(c.last_sync_at).toLocaleDateString() : "never"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state with data density message */}
      {data.entity_count === 0 && (
        <div className="p-8 bg-gradient-to-br from-[var(--iw-forest)]/10 to-[var(--iw-gold)]/5 rounded-xl border border-iw-rule text-center">
          <h3 className="text-lg font-semibold mb-2 text-iw-ink">Your workspace is ready</h3>
          <p className="text-iw-slate mb-4 text-sm max-w-xl mx-auto">
            Connect a tool or paste some data to see your first entities, signals, and intelligence.
          </p>
          <p className="text-xs text-iw-slate-mid">
            Modules appear as data flows in. No empty tiles. No noise.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  pulse?: boolean;
}) {
  return (
    <div className="relative p-5 rounded-xl border border-iw-rule bg-iw-paper-warm shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold font-sans tracking-tight text-iw-ink">{value}</div>
          <div className="text-xs text-iw-slate mt-1 uppercase tracking-wider font-semibold opacity-70">
            {label}
          </div>
        </div>
        <div
          className={`p-3 rounded-lg ${colorClass} transition-colors group-hover:scale-110 duration-300 relative`}
        >
          <Icon className="w-5 h-5" />
          {pulse && (
            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-iw-gold ring-2 ring-iw-paper-warm animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
