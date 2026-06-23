import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Calendar, HeartPulse, AlertTriangle, CheckCircle2, TrendingUp,
  FileText, Users, Zap, BarChart3, Briefcase, Database, Activity, GitBranch,
  Plus, Clock, Shield, Brain, RotateCcw, User, Play, ChevronRight, ArrowUpRight,
  ArrowDownRight, Compass, Plug, type LucideIcon,
} from "lucide-react";
import { useSpine } from "@/spine/spine-context";
import { CTX_CONFIG } from "@/spine/role-registry";
import { SCHEMA_GROUP_LABEL } from "@/spine/schema-availability";
import type { RoleProfile, IndustryProfile } from "@/spine/types";

const ICONS: Record<string, LucideIcon> = {
  MessageSquare, Calendar, HeartPulse, AlertTriangle, CheckCircle2, TrendingUp,
  FileText, Users, Zap, BarChart3, Briefcase, Database, Activity, GitBranch,
  Plus, Clock, Shield, Brain,
};

const PRIORITY_CONFIG: Record<string, { dot: string; badge: string }> = {
  critical: { dot: "var(--iw-danger)", badge: "var(--iw-danger)" },
  high: { dot: "var(--iw-warning)", badge: "var(--iw-warning)" },
  medium: { dot: "var(--iw-blue)", badge: "var(--iw-blue)" },
  low: { dot: "var(--muted-foreground)", badge: "var(--muted-foreground)" },
};

function SectionRow({
  icon: Icon, label, badge, badgeColor, children, defaultOpen = false,
}: {
  icon: LucideIcon; label: string; badge?: string; badgeColor?: string;
  children: ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-all"
        style={{ background: open ? "var(--secondary)" : "var(--card)" }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--iw-blue)" }} />
        <span className="flex-1 text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{label}</span>
        {badge && (
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold"
            style={{ background: badgeColor ? `${badgeColor}18` : "var(--secondary)", color: badgeColor || "var(--muted-foreground)" }}
          >
            {badge}
          </span>
        )}
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 transition-transform"
          style={{ color: "var(--muted-foreground)", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function KpiCard({ kpi, index }: { kpi: RoleProfile["kpis"][number]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{kpi.label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{kpi.value}</span>
        {kpi.up ? (
          <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "var(--iw-success)" }} />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5" style={{ color: "var(--iw-danger)" }} />
        )}
      </div>
      <p className="mt-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>{kpi.sub}</p>
      <div className="mt-2 h-1 rounded-full" style={{ background: kpi.color, opacity: 0.85 }} />
    </motion.div>
  );
}

function IndustryLens({ industry }: { industry: IndustryProfile }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="mb-3 flex items-center gap-2">
        <Compass className="h-3.5 w-3.5" style={{ color: "var(--iw-purple)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{industry.label} focus</span>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: "var(--iw-purple-50)", color: "var(--iw-purple)" }}>
          {industry.orgType}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {industry.topics.map((t) => (
          <span
            key={t}
            className="rounded-lg px-2 py-1 text-[10px] font-medium"
            style={{ background: "var(--secondary)", color: "var(--foreground)" }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RoleDashboard() {
  const { workspace } = useSpine();
  const { profile, industryProfile, role, schemaSummary } = useDashboardModel();
  const ctx = CTX_CONFIG[role];
  const criticalCount = profile.todayFocus.filter((t) => t.priority === "critical").length;

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              {workspace.profile.role}
            </h1>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
              {ctx.label} workspace · {industryProfile.label} lens
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {profile.connectors.map((c) => (
              <span key={c} className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ background: "var(--iw-blue-50)", color: "var(--iw-blue)" }}>
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {profile.kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} kpi={kpi} index={i} />
          ))}
        </div>

        {/* Industry lens */}
        <IndustryLens industry={industryProfile} />

        {/* Schema coverage — graceful, data-driven */}
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-3.5 w-3.5" style={{ color: "var(--iw-blue)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Data this role relies on</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {schemaSummary.map((s) => (
              <span
                key={s.group}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-medium"
                style={{
                  background: s.state === "live" ? "var(--iw-success-50)" : s.state === "seeded" ? "var(--iw-warning-50)" : "var(--secondary)",
                  color: s.state === "live" ? "var(--iw-success)" : s.state === "seeded" ? "var(--iw-warning)" : "var(--muted-foreground)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
                {SCHEMA_GROUP_LABEL[s.group]} · {s.state}
              </span>
            ))}
          </div>
        </div>

        {/* What changed */}
        <SectionRow icon={RotateCcw} label="What changed" badge={`${profile.signals.length} signals`} defaultOpen>
          <div className="space-y-1.5 pt-1">
            {profile.signals.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg p-2" style={{ background: "var(--secondary)" }}>
                <div
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: item.type === "success" ? "var(--iw-success)" : item.type === "warning" ? "var(--iw-warning)" : "var(--iw-blue)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--foreground)" }}>{item.text}</p>
                  <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{item.time} ago</span>
                </div>
              </div>
            ))}
          </div>
        </SectionRow>

        {/* Needs you */}
        <SectionRow icon={User} label="Needs you" badge={`${criticalCount} critical`} badgeColor="var(--iw-danger)" defaultOpen={criticalCount > 0}>
          <div className="space-y-1.5 pt-1">
            {profile.todayFocus.map((t, i) => {
              const pc = PRIORITY_CONFIG[t.priority];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border p-2.5"
                  style={{
                    borderColor: t.priority === "critical" ? "rgba(220,74,74,0.2)" : "var(--border)",
                    background: t.priority === "critical" ? "rgba(220,74,74,0.03)" : "var(--background)",
                  }}
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: pc.dot }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-snug" style={{ fontWeight: 500, color: "var(--foreground)" }}>{t.task}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded border px-1 py-0.5 text-[9px] font-bold uppercase" style={{ color: pc.badge, borderColor: pc.badge }}>{t.priority}</span>
                      <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{t.context}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionRow>

        {/* Act */}
        <SectionRow icon={Play} label="Act">
          <div className="grid grid-cols-3 gap-1.5 pt-1 sm:grid-cols-5">
            {profile.quickActions.map((a, i) => {
              const Icon = ICONS[a.icon] ?? Plus;
              return (
                <button
                  key={i}
                  className="flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all"
                  style={{ borderColor: "var(--border)", background: "var(--background)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "var(--iw-blue)" }} />
                  <span className="text-center text-[9px] leading-tight" style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>{a.label}</span>
                </button>
              );
            })}
          </div>
        </SectionRow>
      </div>
    </div>
  );
}

function useDashboardModel() {
  const { workspace, schema } = useSpine();
  const schemaSummary = workspace.profile.schemaGroups.map((group) => ({ group, state: schema[group] }));
  return {
    profile: workspace.profile,
    industryProfile: workspace.industryProfile,
    role: workspace.role,
    schemaSummary,
  };
}
