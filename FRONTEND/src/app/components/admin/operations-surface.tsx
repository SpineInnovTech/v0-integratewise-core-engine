/**
 * Operations Surface — super_admin platform operations view
 *
 * Platform reads FROM integratewise-live via GET /api/v1/* endpoints.
 * Customer Zero = IW's own tenant. It is NOT a special surface here.
 * IW's own business data lives in their tenant workbench, same as any other tenant.
 *
 * 9 operational domains:
 *   Company    — Operational metrics (from IW's own tenant Spine)
 *   Tenants    — All tenants consuming the platform
 *   Platform   — CF Worker health, queues, D1, KV
 *   Executions — Running agents, HITL queue, failures
 *   AI         — CF AI Gateway, costs, routing
 *   Connectors — Nango sync health, OAuth status
 *   Schema     — Schema pool lifecycle, entity types
 *   Governance — Platform-wide policies, approvals, audit
 *   Billing    — MRR, Razorpay subscriptions, AI costs
 *
 * CSS variables: uses --iw-* tokens from globals.css
 */

import { useState } from "react";
import {
  Building2, Users, Server, Zap, Bot, Plug,
  Database, Shield, CreditCard, Star,
  TrendingUp, AlertTriangle, CheckCircle2,
  Activity, RefreshCw, ArrowUpRight, ArrowDownRight,
  Clock, GitBranch, BarChart3, Play,
  ChevronRight, Search, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type OpsDomain =
  | "company" | "tenants" | "platform" | "executions"
  | "ai" | "connectors" | "schema" | "governance"
  | "billing";

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({ label, value, delta, up, sub, danger, warning }: {
  label: string; value: string; delta?: string;
  up?: boolean; sub?: string; danger?: boolean; warning?: boolean;
}) {
  const valueColor = danger ? "var(--iw-danger)" : warning ? "var(--iw-warning)" : "var(--foreground)";
  const deltaColor = danger ? "var(--iw-danger)" : up ? "var(--iw-success)" : "var(--iw-danger)";
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{label}</span>
      <span className="text-2xl" style={{ fontWeight: 700, color: valueColor, lineHeight: 1 }}>{value}</span>
      {delta && (
        <span className="text-[10px] flex items-center gap-0.5" style={{ color: deltaColor, fontWeight: 600 }}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{delta}
        </span>
      )}
      {sub && <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{sub}</span>}
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{title}</span>
        {action && (
          <button onClick={action.onClick} className="text-[10px]" style={{ color: "var(--iw-blue)", fontWeight: 600 }}>{action.label}</button>
        )}
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, badge, badgeColor, sub }: {
  label: string; value: string; badge?: string; badgeColor?: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div>
        <p className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{label}</p>
        {sub && <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{sub}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{value}</span>
        {badge && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: `${badgeColor || "var(--iw-blue)"}18`, color: badgeColor || "var(--iw-blue)" }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Domain views ─────────────────────────────────────────────────────────────

function CompanyView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Company Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>IntegrateWise running on IntegrateWise — CS, Sales, RevOps</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="MRR" value="₹41.5L" delta="+12.3% MoM" up />
        <StatCard label="Active Customers" value="23" delta="+3 this month" up />
        <StatCard label="Avg Health" value="76" delta="+2.1 pts" up />
        <StatCard label="Churn Risk" value="4" warning delta="↑ from 2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="At-Risk Renewals (60d)">
          {[
            { name: "FinanceFlow Solutions", arr: "₹7L", days: "29d", risk: 92 },
            { name: "TechServe Asia",        arr: "₹5.2L", days: "47d", risk: 71 },
            { name: "CloudBridge APAC",      arr: "₹3.4L", days: "58d", risk: 48 },
          ].map(r => (
            <div key={r.name} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{r.name}</p>
                <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{r.arr} ARR · {r.days} to renewal</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: r.risk > 80 ? "rgba(220,74,74,0.1)" : r.risk > 60 ? "rgba(212,136,62,0.1)" : "rgba(61,139,110,0.1)", color: r.risk > 80 ? "var(--iw-danger)" : r.risk > 60 ? "var(--iw-warning)" : "var(--iw-success)" }}>
                Risk {r.risk}
              </span>
            </div>
          ))}
        </Card>
        <Card title="Sales Pipeline">
          <Row label="Total pipeline" value="₹2.3Cr" badge="3.1x" badgeColor="var(--iw-warning)" />
          <Row label="Deals this month" value="8" />
          <Row label="Win rate (QTD)" value="34%" badge="+6% vs Q2" badgeColor="var(--iw-success)" />
          <Row label="MQLs routed" value="47" badge="12 hot" badgeColor="var(--iw-pink)" />
        </Card>
      </div>
    </div>
  );
}

function TenantsView() {
  const [search, setSearch] = useState("");
  const tenants = [
    { name: "Acme Corp",         plan: "Growth",  users: 8,  entities: 12847, health: "healthy",  bridge: true  },
    { name: "Nexus Digital",     plan: "Starter", users: 3,  entities: 2341,  health: "healthy",  bridge: true  },
    { name: "Apex Ventures",     plan: "Growth",  users: 12, entities: 8920,  health: "warning",  bridge: true  },
    { name: "OrbitTech",         plan: "Starter", users: 1,  entities: 0,     health: "danger",   bridge: false },
    { name: "Meridian Partners", plan: "Scale",   users: 28, entities: 34120, health: "healthy",  bridge: true  },
  ].filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  const hColor = (h: string) => h === "healthy" ? "var(--iw-success)" : h === "warning" ? "var(--iw-warning)" : "var(--iw-danger)";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Tenant Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>All tenants reading from platform — health, usage, bridge status</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Tenants" value="23" />
        <StatCard label="Active" value="19" delta="82%" up />
        <StatCard label="Stalled" value="3" warning />
        <StatCard label="Bridge Active" value="21" delta="91%" up />
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: "var(--border)" }}>
          <Search className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tenants…"
            className="flex-1 text-xs bg-transparent outline-none" style={{ color: "var(--foreground)" }} />
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: "var(--secondary)" }}>
              {["Tenant", "Plan", "Users", "Entities", "Bridge", "Health"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{h}</th>
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
                    {t.bridge ? "Connected" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold capitalize"
                    style={{ background: `${hColor(t.health)}15`, color: hColor(t.health) }}>{t.health}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlatformView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Platform Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Live pulse — CF Workers, Queues, D1, KV · Data from integratewise-live</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Requests / 24h" value="355" sub="integratewise-gateway" />
        <StatCard label="Error Rate" value="0%" up />
        <StatCard label="P50 Latency" value="710ms" delta="-12%" up />
        <StatCard label="Workers Active" value="11 / 18" sub="Consolidating" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Core Workers">
          {[
            { name: "integratewise-gateway",      req: 355, ok: true },
            { name: "integratewise-pipeline",     req: 124, ok: true },
            { name: "integratewise-continuity",   req: 89,  ok: true },
            { name: "integratewise-knowledge",    req: 67,  ok: true },
            { name: "integratewise-mcp-connector",req: 43,  ok: true },
          ].map(w => (
            <div key={w.name} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[10px] font-mono" style={{ color: "var(--foreground)" }}>{w.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{w.req} req</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(61,139,110,0.1)", color: "var(--iw-success)" }}>Live</span>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Queue Health">
          {[
            { name: "pipeline-process",  depth: 0, throughput: "42/min" },
            { name: "knowledge-ingest",  depth: 3, throughput: "18/min" },
            { name: "memory-commit",     depth: 0, throughput: "7/min"  },
            { name: "signal-process",    depth: 1, throughput: "23/min" },
            { name: "DLQ",              depth: 0, throughput: "—"      },
          ].map(q => (
            <div key={q.name} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-[10px] font-mono" style={{ color: "var(--foreground)" }}>{q.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{q.throughput}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: q.depth > 5 ? "rgba(220,74,74,0.1)" : q.depth > 0 ? "rgba(212,136,62,0.1)" : "rgba(61,139,110,0.1)", color: q.depth > 5 ? "var(--iw-danger)" : q.depth > 0 ? "var(--iw-warning)" : "var(--iw-success)" }}>
                  Depth {q.depth}
                </span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ExecutionsView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Execution Center</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>What is running · What is blocked · What needs approval · What failed</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Running" value="3" up />
        <StatCard label="Pending HITL" value="5" warning />
        <StatCard label="Failed (24h)" value="1" danger />
        <StatCard label="Completed (24h)" value="47" up />
      </div>
      <Card title="Active Agent Runs">
        {[
          { agent: "Twin → Renewal Watchdog", tenant: "Acme Corp",     step: "Computing risk score", t: "3.2s" },
          { agent: "Twin → CRM Reconciler",   tenant: "Meridian",      step: "Fetching Salesforce",  t: "1.1s" },
          { agent: "Twin → Pipeline Scout",   tenant: "Nexus Digital",  step: "Analysing pipeline",  t: "5.7s" },
        ].map(r => (
          <div key={r.agent} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: "var(--iw-success)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{r.agent}</p>
              <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{r.tenant} · {r.step}</p>
            </div>
            <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{r.t}</span>
          </div>
        ))}
      </Card>
      <Card title="Pending HITL Approvals">
        {[
          { action: "Update HubSpot lifecycle → Customer", tenant: "Nexus Digital", age: "2h",  risk: "Low" },
          { action: "Send Slack alert to CS team",         tenant: "Acme Corp",     age: "45m", risk: "Low" },
          { action: "Merge duplicate contact records",     tenant: "Meridian",      age: "18h", risk: "Med" },
        ].map(p => (
          <div key={p.action} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-xs truncate" style={{ fontWeight: 500, color: "var(--foreground)" }}>{p.action}</p>
              <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{p.tenant} · {p.age} ago</p>
            </div>
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold ml-3 shrink-0"
              style={{ background: p.risk === "Med" ? "rgba(212,136,62,0.1)" : "rgba(61,139,110,0.1)", color: p.risk === "Med" ? "var(--iw-warning)" : "var(--iw-success)" }}>
              {p.risk}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AIView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>AI Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>CF AI Gateway usage · costs · routing · tenant policies</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="AI Calls (24h)" value="2,847" delta="+18%" up />
        <StatCard label="Cost (24h)" value="₹152" delta="-12%" up />
        <StatCard label="Cache Hit Rate" value="34%" sub="CF AI Gateway" />
        <StatCard label="Avg Latency" value="710ms" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Provider Routing (24h)">
          <Row label="CF Workers AI (free)" value="1,240" badge="44%" badgeColor="var(--iw-success)" />
          <Row label="Anthropic Claude" value="892" badge="31%" />
          <Row label="OpenAI GPT-4o" value="483" badge="17%" />
          <Row label="Google Gemini" value="232" badge="8%" />
        </Card>
        <Card title="AI Cost by Tenant">
          {[
            { name: "Acme Corp", cost: "₹48", calls: 892 },
            { name: "Meridian",  cost: "₹41", calls: 743 },
            { name: "Nexus",     cost: "₹29", calls: 521 },
            { name: "Apex",      cost: "₹22", calls: 412 },
          ].map(t => (
            <div key={t.name} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs" style={{ color: "var(--foreground)" }}>{t.name}</span>
              <div className="text-right">
                <p className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{t.cost}</p>
                <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{t.calls} calls</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ConnectorsView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Connector Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Nango sync health · OAuth status · failed syncs · webhooks</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Connectors" value="47" sub="across 23 tenants" />
        <StatCard label="Sync Failures (24h)" value="2" warning />
        <StatCard label="OAuth Errors" value="1" danger />
        <StatCard label="Webhook Success" value="99.2%" up />
      </div>
      <Card title="Connector Health by Type">
        {[
          { name: "HubSpot (Nango)",    active: 18, failed: 0, rate: "100%" },
          { name: "Salesforce (Nango)", active: 12, failed: 1, rate: "99.1%" },
          { name: "Zendesk (Nango)",    active: 9,  failed: 0, rate: "100%" },
          { name: "Jira (Nango)",       active: 8,  failed: 1, rate: "98.7%" },
          { name: "GitHub MCP",         active: 6,  failed: 0, rate: "100%" },
        ].map(c => (
          <div key={c.name} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs" style={{ fontWeight: 500, color: "var(--foreground)" }}>{c.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{c.active} active</span>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: c.failed > 0 ? "rgba(212,136,62,0.1)" : "rgba(61,139,110,0.1)", color: c.failed > 0 ? "var(--iw-warning)" : "var(--iw-success)" }}>
                {c.rate}
              </span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SchemaView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Schema & Spine Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Schema pool · entity hydration · validation · domain models</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Schemas" value="34" />
        <StatCard label="Pending Approval" value="3" warning />
        <StatCard label="Total Entities (D1)" value="58.4K" delta="+340 today" up />
        <StatCard label="Drift Alerts" value="2" warning />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Schema Pool Status">
          <Row label="Active" value="34" badge="Live" badgeColor="var(--iw-success)" />
          <Row label="Reviewed (pending approval)" value="3" badge="Action needed" badgeColor="var(--iw-warning)" />
          <Row label="Proposed" value="5" />
          <Row label="Deprecated" value="8" />
        </Card>
        <Card title="Spine Entity Distribution">
          <Row label="contact / person" value="28,410" />
          <Row label="account / company" value="12,847" />
          <Row label="deal / opportunity" value="8,932" />
          <Row label="activity" value="6,821" />
          <Row label="document" value="1,390" />
        </Card>
      </div>
    </div>
  );
}

function GovernanceView() {
  const [approved, setApproved] = useState<string[]>([]);
  const proposals = [
    { id: "p1", action: "Schema AI: Jira v1.1.0 schema activation", tenant: "All", age: "8m",  risk: "Low" },
    { id: "p2", action: "Bulk contact merge (47 records)",           tenant: "Meridian", age: "2h", risk: "Med" },
    { id: "p3", action: "CRM lifecycle auto-correction",             tenant: "Acme Corp", age: "18h", risk: "Low" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Governance Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Platform-wide policies · approvals · violations · audit</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Policies" value="34" />
        <StatCard label="Pending Approvals" value="7" warning />
        <StatCard label="Violations (7d)" value="2" danger />
        <StatCard label="Approval Rate" value="94%" up />
      </div>
      <Card title="Pending Platform Approvals">
        {proposals.map(p => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{p.action}</p>
              <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{p.tenant} · {p.age} ago</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: p.risk === "Med" ? "rgba(212,136,62,0.1)" : "rgba(61,139,110,0.1)", color: p.risk === "Med" ? "var(--iw-warning)" : "var(--iw-success)" }}>
                {p.risk}
              </span>
              {!approved.includes(p.id) ? (
                <button onClick={() => setApproved(prev => [...prev, p.id])}
                  className="text-[9px] px-2.5 py-1 rounded-lg font-bold text-white"
                  style={{ background: "var(--iw-blue)" }}>
                  Approve
                </button>
              ) : (
                <span className="text-[9px]" style={{ color: "var(--iw-success)", fontWeight: 700 }}>✓ Approved</span>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function BillingView() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-base" style={{ fontWeight: 700, color: "var(--foreground)" }}>Billing Operations</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Platform MRR · Razorpay subscriptions · AI costs · margin</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="MRR" value="₹41.5L" delta="+12.3% MoM" up />
        <StatCard label="ARR Run Rate" value="₹4.98Cr" delta="+18% YoY" up />
        <StatCard label="AI Cost (mo)" value="₹2.1L" sub="5.1% of MRR" />
        <StatCard label="Gross Margin" value="~83%" up />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Subscription Breakdown">
          <Row label="Scale · ₹18,999/mo" value="2 tenants" badge="₹37,998" badgeColor="var(--iw-success)" />
          <Row label="Growth · ₹8,299/mo" value="14 tenants" badge="₹1,16,186" badgeColor="var(--iw-blue)" />
          <Row label="Starter · ₹4,999/mo" value="7 tenants" badge="₹34,993" />
          <Row label="Total MRR" value="₹41.5L" />
        </Card>
        <Card title="Infrastructure Cost (monthly est.)">
          <Row label="CF Workers (18)" value="~₹15K" />
          <Row label="CF D1 + KV + R2" value="~₹8K" />
          <Row label="CF AI Gateway" value="~₹2.1L" />
          <Row label="Nango" value="~₹45K" />
          <Row label="Clerk" value="~₹22K" />
          <Row label="Total infra" value="~₹2.8L/mo" badge="~6.8% MRR" />
        </Card>
      </div>
    </div>
  );
}

// ─── Nav config ────────────────────────────────────────────────────────────────

const DOMAINS: { id: OpsDomain; label: string; icon: any; badge?: string; badgeColor?: string }[] = [
  { id: "company",     label: "Company",     icon: Building2 },
  { id: "tenants",     label: "Tenants",     icon: Users,       badge: "23" },
  { id: "platform",    label: "Platform",    icon: Server },
  { id: "executions",  label: "Executions",  icon: Zap,         badge: "5", badgeColor: "var(--iw-warning)" },
  { id: "ai",          label: "AI",          icon: Bot },
  { id: "connectors",  label: "Connectors",  icon: Plug },
  { id: "schema",      label: "Schema",      icon: Database,    badge: "3", badgeColor: "var(--iw-warning)" },
  { id: "governance",  label: "Governance",  icon: Shield,      badge: "7", badgeColor: "var(--iw-warning)" },
  { id: "billing",     label: "Billing",     icon: CreditCard },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export function OperationsSurface() {
  const [active, setActive] = useState<OpsDomain>("company");

  const renderContent = () => {
    switch (active) {
      case "company":     return <CompanyView />;
      case "tenants":     return <TenantsView />;
      case "platform":    return <PlatformView />;
      case "executions":  return <ExecutionsView />;
      case "ai":          return <AIView />;
      case "connectors":  return <ConnectorsView />;
      case "schema":      return <SchemaView />;
      case "governance":  return <GovernanceView />;
      case "billing":     return <BillingView />;
    }
  };

  return (
    <div className="flex h-full" style={{ background: "var(--background)" }}>
      {/* Secondary nav — 10 domains */}
      <div className="w-52 shrink-0 flex flex-col border-r overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>Operations</p>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Reading from integratewise-live
          </p>
        </div>
        <nav className="py-2 px-2 space-y-0.5">
          {DOMAINS.map(d => (
            <button key={d.id} onClick={() => setActive(d.id)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all"
              style={{
                background: active === d.id ? "var(--iw-blue-50)" : "transparent",
                color: active === d.id ? "var(--iw-blue)" : "var(--muted-foreground)",
              }}
              onMouseEnter={e => { if (active !== d.id) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
              onMouseLeave={e => { if (active !== d.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <d.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[12px] flex-1 truncate" style={{ fontWeight: active === d.id ? 600 : 400 }}>{d.label}</span>
              {d.badge && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                  style={{ background: `${d.badgeColor || "var(--iw-blue)"}20`, color: d.badgeColor || "var(--iw-blue)" }}>
                  {d.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--background)" }}>
        {renderContent()}
      </main>
    </div>
  );
}
