/**
 * Admin Dashboard — super_admin surface
 *
 * Includes:
 * - Release Readiness (7 checkpoint verification)
 * - Release Gate (approve / hold / rollback)
 * - Tenant Management (all tenants, health, lifecycle)
 * - Platform Health (workers, queues, AI costs)
 * - RBAC Management (roles, capabilities, access)
 *
 * RBAC: visible only to super_admin role
 * Backend: reads from integratewise-gateway via /api/v1/...
 * Endpoints to be wired when CF gateway URL is confirmed.
 *
 * CSS: uses var(--iw-*) tokens from globals.css
 */

import { useState } from "react";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
  Users, Server, CreditCard, Lock, RefreshCw,
  ChevronRight, Activity, Zap, Database, Clock,
  GitBranch, Play, Pause, RotateCcw, ExternalLink,
  Building2, Brain, Layers, Star
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = "readiness" | "tenants" | "rbac" | "platform";

// ─── Release Readiness ────────────────────────────────────────────────────────

const READINESS_CHECKS = [
  { id: "identity",   label: "Identity & Auth",     desc: "Clerk tenant creation, JWT validation, RBAC roles",      status: "pass",    detail: "Clerk live · JWT validated · 3 roles active" },
  { id: "connectors", label: "Connector Wall",       desc: "Nango OAuth, credential isolation, webhook ingress",      status: "pass",    detail: "Nango healthy · 47 active connectors · 0 auth errors" },
  { id: "schema",     label: "Schema AI",            desc: "Schema generation, validation, harmonization groups",     status: "partial", detail: "schema_pool D1 not deployed · service/intelligence gap" },
  { id: "spine",      label: "Spine Hydration",      desc: "Entity resolution, D1 writes, KV hot cache",             status: "pass",    detail: "58.4K entities · D1 healthy · KV cache active" },
  { id: "memory",     label: "Memory Continuity",    desc: "Triage Bot, promotion queue, org memory writes",         status: "partial", detail: "Triage Bot partial · write path not fully verified" },
  { id: "twin",       label: "Twin Runtime",         desc: "iw-agent-runtime, DOs, session state, voice (Grok)",     status: "pass",    detail: "TwinAgent DO active · sessions stable · voice pending" },
  { id: "governance", label: "Governance Gate",      desc: "HARD GATE, no bypass, approval→execution chain intact",  status: "pass",    detail: "L7 gate active · 0 bypass attempts · audit clean" },
];

const STATUS_CONFIG = {
  pass:    { icon: CheckCircle2, color: "var(--iw-success)", bg: "rgba(61,139,110,0.1)",  label: "Pass" },
  partial: { icon: AlertTriangle, color: "var(--iw-warning)", bg: "rgba(212,136,62,0.1)", label: "Partial" },
  fail:    { icon: XCircle,       color: "var(--iw-danger)",  bg: "rgba(220,74,74,0.1)",  label: "Fail" },
};

function ReadinessView() {
  const passCount = READINESS_CHECKS.filter(c => c.status === "pass").length;
  const partialCount = READINESS_CHECKS.filter(c => c.status === "partial").length;
  const failCount = READINESS_CHECKS.filter(c => c.status === "fail").length;
  const isReleaseReady = failCount === 0 && partialCount === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Release Readiness</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            7 checkpoints · {passCount} pass · {partialCount} partial · {failCount} fail
          </p>
        </div>

        {/* Release Gate */}
        <div className="rounded-xl p-4 text-right shrink-0" style={{ background: isReleaseReady ? "rgba(61,139,110,0.08)" : "rgba(212,136,62,0.08)", border: `1px solid ${isReleaseReady ? "rgba(61,139,110,0.25)" : "rgba(212,136,62,0.25)"}` }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: isReleaseReady ? "var(--iw-success)" : "var(--iw-warning)", fontWeight: 700 }}>
            Release Gate
          </p>
          <p className="text-sm" style={{ fontWeight: 700, color: isReleaseReady ? "var(--iw-success)" : "var(--iw-warning)" }}>
            {isReleaseReady ? "✓ Ready to ship" : "⚠ Gaps to resolve"}
          </p>
          <div className="flex gap-2 mt-2 justify-end">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all"
              style={{ background: isReleaseReady ? "var(--iw-success)" : "var(--muted)" }}>
              <Play className="w-3 h-3" /> {isReleaseReady ? "Ship" : "Ship anyway"}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
              style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
              <Pause className="w-3 h-3" /> Hold
            </button>
          </div>
        </div>
      </div>

      {/* Checkpoint list */}
      <div className="space-y-2">
        {READINESS_CHECKS.map(check => {
          const sc = STATUS_CONFIG[check.status as keyof typeof STATUS_CONFIG];
          const StatusIcon = sc.icon;
          return (
            <div key={check.id} className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: sc.bg }}>
                <StatusIcon className="w-4 h-4" style={{ color: sc.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{check.label}</p>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
                <p className="text-[10px] mb-1" style={{ color: "var(--muted-foreground)" }}>{check.desc}</p>
                <p className="text-[10px] font-mono" style={{ color: check.status === "pass" ? "var(--iw-success)" : check.status === "partial" ? "var(--iw-warning)" : "var(--iw-danger)" }}>
                  {check.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Doctrine reminder */}
      <div className="px-4 py-3 rounded-xl" style={{ background: "var(--iw-blue-900)" }}>
        <p className="text-xs text-white" style={{ fontWeight: 600 }}>Doctrine</p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
          No write without active schema · No action without governance approval · No auto-dispatch · Credentials never touch application code
        </p>
      </div>
    </div>
  );
}

// ─── Tenant Management ────────────────────────────────────────────────────────

function TenantsView() {
  const tenants = [
    { name: "Acme Corp",          plan: "Growth",  users: 8,  entities: 12847, health: "healthy",  stage: "active",   bridge: true,  mrr: "₹8,299" },
    { name: "Nexus Digital",      plan: "Starter", users: 3,  entities: 2341,  health: "healthy",  stage: "active",   bridge: true,  mrr: "₹4,999" },
    { name: "Apex Ventures",      plan: "Growth",  users: 12, entities: 8920,  health: "warning",  stage: "active",   bridge: true,  mrr: "₹8,299" },
    { name: "OrbitTech",          plan: "Starter", users: 1,  entities: 0,     health: "danger",   stage: "stalled",  bridge: false, mrr: "₹4,999" },
    { name: "Meridian Partners",  plan: "Scale",   users: 28, entities: 34120, health: "healthy",  stage: "active",   bridge: true,  mrr: "₹18,999" },
    { name: "FinTech Co (trial)", plan: "Trial",   users: 2,  entities: 142,   health: "healthy",  stage: "onboarding",bridge: false,mrr: "₹0" },
  ];

  const hColor = (h: string) => h === "healthy" ? "var(--iw-success)" : h === "warning" ? "var(--iw-warning)" : "var(--iw-danger)";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Tenant Registry</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          All customer tenants — managed via integratewise-gateway · /api/v1/tenants
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: "23", color: "var(--iw-blue)" },
          { label: "Active", value: "19", color: "var(--iw-success)" },
          { label: "Bridge Connected", value: "21", color: "var(--iw-purple)" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-xl" style={{ fontWeight: 700, color: s.color }}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--secondary)" }}>
              {["Tenant", "Plan", "Users", "Entities", "Bridge", "Stage", "MRR"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest"
                  style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.name} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2.5 text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{t.name}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{t.plan}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "var(--foreground)" }}>{t.users}</td>
                <td className="px-4 py-2.5 text-xs" style={{ color: "var(--foreground)" }}>{t.entities.toLocaleString()}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: t.bridge ? "rgba(61,139,110,0.1)" : "rgba(212,136,62,0.1)", color: t.bridge ? "var(--iw-success)" : "var(--iw-warning)" }}>
                    {t.bridge ? "Live" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold capitalize"
                    style={{ background: `${hColor(t.health)}15`, color: hColor(t.health) }}>{t.stage}</span>
                </td>
                <td className="px-4 py-2.5 text-xs font-mono" style={{ color: "var(--foreground)", fontWeight: 600 }}>{t.mrr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

function RBACView() {
  const roles = [
    {
      role: "super_admin",
      color: "var(--iw-danger)",
      desc: "IntegrateWise operators only. Full platform access.",
      capabilities: ["All workbench domains", "Twin (all sections)", "Continuity · Governance · Ingress", "Operations (platform ops)", "Admin Dashboard", "Release Gate", "All tenants read/write"],
    },
    {
      role: "admin",
      color: "var(--iw-warning)",
      desc: "Tenant administrators. Manage their own org.",
      capabilities: ["All workbench domains", "Twin (all sections)", "Continuity · Governance · Ingress", "Settings (tenant self-service)", "Billing · Users · API Keys"],
    },
    {
      role: "member",
      color: "var(--iw-blue)",
      desc: "Standard users. Their workbench + Twin + framework.",
      capabilities: ["Workbench (their domain)", "Twin (Chat, Memory, Task Bench, Agents, Workflows)", "Continuity (their memory)", "Governance (their own Twin)", "Ingress (their connectors)"],
    },
    {
      role: "viewer",
      color: "var(--muted-foreground)",
      desc: "Read-only access to shared surfaces.",
      capabilities: ["Workbench (read-only)", "Shared dashboards", "Intelligence signals"],
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>RBAC — Role Capabilities</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          Managed via Clerk orgs · Capability gating is frontend + backend · Endpoints to be wired via /api/v1/rbac
        </p>
      </div>
      <div className="space-y-3">
        {roles.map(r => (
          <div key={r.role} className="p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-1 rounded-lg font-mono font-bold"
                style={{ background: `${r.color}15`, color: r.color, border: `1px solid ${r.color}30` }}>
                {r.role}
              </span>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{r.desc}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {r.capabilities.map(c => (
                <span key={c} className="text-[9px] px-2 py-0.5 rounded-lg"
                  style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(212,136,62,0.06)", border: "1px solid rgba(212,136,62,0.2)" }}>
        <p className="text-[10px]" style={{ color: "var(--iw-warning)", fontWeight: 600 }}>
          ⚠ Pending: Backend RBAC enforcement via gateway JWT claims. Frontend gating is active. Backend endpoint wiring awaiting CF gateway URL.
        </p>
      </div>
    </div>
  );
}

// ─── Platform Health ──────────────────────────────────────────────────────────

function PlatformView() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Platform Health</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          CF Workers · Queues · D1 · AI Gateway · Razorpay
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Requests / 24h", value: "355", color: "var(--iw-blue)" },
          { label: "Error Rate", value: "0%", color: "var(--iw-success)" },
          { label: "P50 Latency", value: "710ms", color: "var(--iw-blue)" },
          { label: "AI Cost (day)", value: "₹152", color: "var(--iw-purple)" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-xl" style={{ fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div className="text-[9px] uppercase tracking-wider mt-1" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Worker Registry (18 canonical)</p>
        </div>
        {[
          { name: "integratewise-gateway",      status: "live", req: 355 },
          { name: "integratewise-pipeline",     status: "live", req: 124 },
          { name: "integratewise-continuity",   status: "live", req: 89  },
          { name: "integratewise-knowledge",    status: "live", req: 67  },
          { name: "integratewise-mcp-connector",status: "live", req: 43  },
          { name: "integratewise-tenants",      status: "live", req: 28  },
          { name: "integratewise-governance",   status: "live", req: 19  },
          { name: "integratewise-billing",      status: "live", req: 12  },
        ].map(w => (
          <div key={w.name} className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-[10px] font-mono" style={{ color: "var(--foreground)" }}>{w.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{w.req} req/24h</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(61,139,110,0.1)", color: "var(--iw-success)" }}>Live</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: any; badge?: string }[] = [
  { id: "readiness", label: "Release Gate",       icon: ShieldCheck, badge: "2 gaps" },
  { id: "tenants",   label: "Tenants",            icon: Building2,   badge: "23" },
  { id: "rbac",      label: "RBAC",               icon: Lock },
  { id: "platform",  label: "Platform Health",    icon: Activity },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("readiness");

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--background)" }}>
      <div className="px-6 pt-5 pb-0 shrink-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(30,42,74,0.12)", border: "1px solid rgba(30,42,74,0.2)" }}>
            <Star className="w-4 h-4" style={{ color: "var(--iw-blue-900)" }} />
          </div>
          <div>
            <h1 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Admin Dashboard</h1>
            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              super_admin · Release readiness · Tenant registry · RBAC · Platform health
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold"
            style={{ background: "rgba(220,74,74,0.08)", color: "var(--iw-danger)", border: "1px solid rgba(220,74,74,0.2)" }}>
            <Lock className="w-3 h-3" /> super_admin only
          </div>
        </div>
        <div className="flex gap-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs border-b-2 transition-all"
              style={{
                fontWeight: tab === t.id ? 700 : 500,
                borderColor: tab === t.id ? "var(--iw-blue)" : "transparent",
                color: tab === t.id ? "var(--iw-blue)" : "var(--muted-foreground)",
              }}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.badge && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: tab === t.id ? "var(--iw-blue)" : "var(--secondary)", color: tab === t.id ? "white" : "var(--muted-foreground)" }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === "readiness" && <ReadinessView />}
        {tab === "tenants"   && <TenantsView />}
        {tab === "rbac"      && <RBACView />}
        {tab === "platform"  && <PlatformView />}
      </div>
    </div>
  );
}
