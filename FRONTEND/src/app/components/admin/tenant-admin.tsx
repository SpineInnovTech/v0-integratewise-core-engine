/**
 * Tenant Admin — Self-service administration for org admins
 *
 * Visible to: role === "admin" | "super_admin"
 * NOT visible to: members
 *
 * Tabs:
 *   General    — org identity and settings
 *   Team       — members, roles (Clerk-backed), invitations
 *   Billing    — Razorpay plan, usage, invoices, payment method
 *   Connections — API keys, MCP endpoint, webhooks
 *   Security   — SSO (Clerk), audit log, active sessions
 *   Data       — export, retention, GDPR controls, danger zone
 *
 * Industry standard: mirrors Vercel / Linear / Stripe settings UX patterns.
 * All destructive actions require explicit confirmation.
 * All forms validate before submit.
 */

import { useState } from "react";
import {
  Settings, Users, CreditCard, Link2, Shield, Database,
  Copy, Check, Trash2, Edit2,
  AlertTriangle, RefreshCw, Download,
  Mail, FileText,
  CheckCircle2, X, ExternalLink, Search,
  Key, Brain
} from "lucide-react";
import { useAuth } from "../../context/auth-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = "general" | "team" | "billing" | "connections" | "security" | "data";

type MemberRole = "admin" | "manager" | "member" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  department: string;
  initials: string;
  joinedAt: string;
  lastActive: string;
  status: "active" | "invited" | "suspended";
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  description: string;
  downloadUrl: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "Priya Sharma",   email: "priya@acmecorp.com",   role: "admin",   department: "RevOps",    initials: "PS", joinedAt: "Jan 2026",  lastActive: "Now",    status: "active" },
  { id: "2", name: "Arun Kumar",     email: "arun@acmecorp.com",    role: "manager", department: "Sales",     initials: "AK", joinedAt: "Jan 2026",  lastActive: "5m ago", status: "active" },
  { id: "3", name: "Rajesh Mehta",   email: "rajesh@acmecorp.com",  role: "member",  department: "CS",        initials: "RM", joinedAt: "Feb 2026",  lastActive: "1h ago", status: "active" },
  { id: "4", name: "Anjali Patel",   email: "anjali@acmecorp.com",  role: "member",  department: "Marketing", initials: "AP", joinedAt: "Feb 2026",  lastActive: "3h ago", status: "active" },
  { id: "5", name: "Vikram Rao",     email: "vikram@acmecorp.com",  role: "viewer",  department: "Engineering",initials:"VR", joinedAt: "Mar 2026",  lastActive: "1d ago", status: "active" },
  { id: "6", name: "neha@acmecorp.com", email: "neha@acmecorp.com", role: "member", department: "",          initials: "N",  joinedAt: "Pending",   lastActive: "—",      status: "invited" },
];

const API_KEYS: ApiKey[] = [
  { id: "k1", name: "Production",     prefix: "iw_prod_sk_••••••••••••8f2a", scopes: ["spine:read","memory:read","twin:propose"], createdAt: "Jan 15, 2026", lastUsed: "2 min ago" },
  { id: "k2", name: "Development",    prefix: "iw_dev_sk_••••••••••••3b1c",  scopes: ["spine:read","memory:read"], createdAt: "Feb 3, 2026", lastUsed: "Yesterday" },
  { id: "k3", name: "Analytics Bot",  prefix: "iw_prod_sk_••••••••••••7d4e", scopes: ["spine:read"], createdAt: "Mar 1, 2026" },
];

const INVOICES: Invoice[] = [
  { id: "inv-001", date: "Jun 1, 2026",  amount: "₹8,299", status: "paid",    description: "Growth Plan — June 2026",    downloadUrl: "#" },
  { id: "inv-002", date: "May 1, 2026",  amount: "₹8,299", status: "paid",    description: "Growth Plan — May 2026",     downloadUrl: "#" },
  { id: "inv-003", date: "Apr 1, 2026",  amount: "₹4,999", status: "paid",    description: "Starter Plan — April 2026",  downloadUrl: "#" },
];

const AUDIT_LOG = [
  { action: "API key created",          actor: "Priya Sharma", time: "Today 10:42 AM", target: "Production key" },
  { action: "Member invited",           actor: "Priya Sharma", time: "Today 09:15 AM", target: "neha@acmecorp.com" },
  { action: "Role changed",             actor: "Priya Sharma", time: "Yesterday 4:30 PM", target: "Arun Kumar → manager" },
  { action: "SSO configured",           actor: "Priya Sharma", time: "Jun 18, 2026",   target: "Google Workspace" },
  { action: "Connector connected",      actor: "Arun Kumar",   time: "Jun 15, 2026",   target: "HubSpot (Nango)" },
  { action: "Data export requested",    actor: "Priya Sharma", time: "Jun 10, 2026",   target: "Full Spine export" },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bg: string; desc: string }> = {
  admin:   { label: "Admin",   color: "var(--iw-danger)",  bg: "rgba(220,74,74,0.1)",  desc: "Full access · billing · RBAC" },
  manager: { label: "Manager", color: "var(--iw-blue)",    bg: "rgba(66,86,171,0.1)",  desc: "Team data · reports · approvals" },
  member:  { label: "Member",  color: "var(--iw-success)", bg: "rgba(61,139,110,0.1)", desc: "Workbench · Twin · own data" },
  viewer:  { label: "Viewer",  color: "var(--muted-foreground)", bg: "var(--secondary)", desc: "Read-only · shared reports" },
};

// ─── Reusable section wrapper ─────────────────────────────────────────────────

function Section({ title, description, children, action }: {
  title: string; description?: string; children: React.ReactNode;
  action?: { label: string; onClick: () => void; variant?: "primary" | "danger" };
}) {
  return (
    <div className="border-b pb-8 mb-8 last:border-0 last:mb-0 last:pb-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{title}</h3>
          {description && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{description}</p>}
        </div>
        {action && (
          <button onClick={action.onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: action.variant === "danger" ? "rgba(220,74,74,0.1)" : "var(--iw-blue-50)",
              color: action.variant === "danger" ? "var(--iw-danger)" : "var(--iw-blue)",
              border: `1px solid ${action.variant === "danger" ? "rgba(220,74,74,0.25)" : "rgba(66,86,171,0.2)"}`,
              fontWeight: 600,
            }}>
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, hint, children, required }: {
  label: string; hint?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs mb-1.5" style={{ fontWeight: 600, color: "var(--foreground)" }}>
        {label}{required && <span style={{ color: "var(--iw-danger)" }}> *</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
      style={{
        background: "var(--card)", border: "1px solid var(--border)",
        color: "var(--foreground)",
      }}
      onFocus={e => { (e.target as HTMLElement).style.borderColor = "var(--iw-blue)"; }}
      onBlur={e => { (e.target as HTMLElement).style.borderColor = "var(--border)"; }}
    />
  );
}

// ─── Tab: General ─────────────────────────────────────────────────────────────

function GeneralTab() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState("Acme Corp");
  const [domain, setDomain] = useState("acmecorp.com");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <Section title="Organisation Identity" description="How your workspace appears across IntegrateWise.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField label="Organisation Name" required>
            <TextInput value={orgName} onChange={setOrgName} placeholder="Acme Corp" />
          </FormField>
          <FormField label="Primary Domain" hint="Used for SSO and teammate verification">
            <TextInput value={domain} onChange={setDomain} placeholder="acmecorp.com" />
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-white transition-all"
            style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
            {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> : "Save Changes"}
          </button>
          {saved && <p className="text-xs" style={{ color: "var(--iw-success)" }}>Changes saved.</p>}
        </div>
      </Section>

      <Section title="Workspace Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Industry">
            <select className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              <option>Technology / SaaS</option>
              <option>Professional Services</option>
              <option>Financial Services</option>
              <option>Healthcare</option>
              <option>Other</option>
            </select>
          </FormField>
          <FormField label="Company Size">
            <select className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
              <option>51-200 people</option>
              <option>11-50 people</option>
              <option>201-500 people</option>
              <option>500+ people</option>
            </select>
          </FormField>
        </div>
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Tenant ID:</span>{" "}
            <span className="font-mono">{user?.tenantId || "tenant_demo"}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Team ────────────────────────────────────────────────────────────────

function TeamTab() {
  const [members, setMembers] = useState(TEAM_MEMBERS);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteError, setInviteError] = useState("");
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleInvite = () => {
    if (!inviteEmail) { setInviteError("Email is required"); return; }
    if (!validateEmail(inviteEmail)) { setInviteError("Enter a valid email address"); return; }
    setInviteError("");
    setInviteEmail("");
  };

  const handleRemove = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setConfirmRemove(null);
  };

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Section title="Invite Team Member" description="Invite colleagues to your workspace. They'll receive an email to join.">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <TextInput value={inviteEmail} onChange={v => { setInviteEmail(v); setInviteError(""); }}
              placeholder="colleague@company.com" type="email" />
            {inviteError && <p className="text-[10px] mt-1" style={{ color: "var(--iw-danger)" }}>{inviteError}</p>}
          </div>
          <select value={inviteRole} onChange={e => setInviteRole(e.target.value as MemberRole)}
            className="px-3 py-2 rounded-lg text-sm outline-none shrink-0"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
            {(Object.keys(ROLE_CONFIG) as MemberRole[]).filter(r => r !== "admin").map(r => (
              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
            ))}
          </select>
          <button onClick={handleInvite}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs text-white shrink-0"
            style={{ background: "var(--iw-blue)", fontWeight: 700 }}>
            <Mail className="w-3.5 h-3.5" /> Send Invite
          </button>
        </div>
      </Section>

      <Section title={`Team · ${members.length} members`}>
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <div className="space-y-1.5">
          {filtered.map(member => {
            const rc = ROLE_CONFIG[member.role];
            return (
              <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: member.status === "invited" ? "var(--secondary)" : "var(--card)", border: "1px solid var(--border)", opacity: member.status === "suspended" ? 0.5 : 1 }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] shrink-0"
                  style={{ background: member.status === "invited" ? "var(--muted-foreground)" : "var(--iw-blue)", fontWeight: 700 }}>
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>
                      {member.status === "invited" ? member.email : member.name}
                    </span>
                    {member.status === "invited" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(212,136,62,0.1)", color: "var(--iw-warning)" }}>Invited</span>
                    )}
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {member.status !== "invited" && <>{member.email} · </>}{member.department || "—"} · {member.lastActive}
                  </p>
                </div>

                {/* Role selector */}
                {editingRole === member.id ? (
                  <div className="flex items-center gap-1">
                    {(Object.keys(ROLE_CONFIG) as MemberRole[]).map(r => (
                      <button key={r} onClick={() => {
                        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: r } : m));
                        setEditingRole(null);
                      }}
                        className="text-[9px] px-2 py-1 rounded-lg transition-all"
                        style={{ background: `${ROLE_CONFIG[r].bg}`, color: ROLE_CONFIG[r].color, fontWeight: 700 }}>
                        {ROLE_CONFIG[r].label}
                      </button>
                    ))}
                    <button onClick={() => setEditingRole(null)} className="p-1">
                      <X className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingRole(member.id)}
                    className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-lg"
                    style={{ background: rc.bg, color: rc.color, fontWeight: 700 }}>
                    {rc.label} <Edit2 className="w-2.5 h-2.5 opacity-60" />
                  </button>
                )}

                {/* Remove */}
                {confirmRemove === member.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleRemove(member.id)}
                      className="text-[9px] px-2 py-1 rounded-lg font-bold"
                      style={{ background: "var(--iw-danger)", color: "white" }}>Confirm</button>
                    <button onClick={() => setConfirmRemove(null)}
                      className="text-[9px] px-2 py-1 rounded-lg"
                      style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontWeight: 600 }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmRemove(member.id)} className="p-1.5 rounded-lg transition-all"
                    style={{ color: "var(--muted-foreground)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-danger)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Role guide */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][]).map(([role, cfg]) => (
            <div key={role} className="flex items-start gap-2 px-3 py-2 rounded-lg"
              style={{ background: cfg.bg }}>
              <div className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                style={{ background: "white", color: cfg.color, fontWeight: 700 }}>{cfg.label}</div>
              <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>{cfg.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Billing ─────────────────────────────────────────────────────────────

function BillingTab() {
  const PLANS = [
    { id: "starter", name: "Starter", price: "₹4,999/mo", features: ["5 users", "3 connectors", "Basic Twin", "7-day memory"], current: false },
    { id: "growth",  name: "Growth",  price: "₹8,299/mo", features: ["25 users", "15 connectors", "Full Twin + Voice", "90-day memory", "Governance"], current: true },
    { id: "scale",   name: "Scale",   price: "₹18,999/mo", features: ["Unlimited users", "Unlimited connectors", "Full platform", "Custom retention", "SSO + SLA"], current: false },
  ];

  return (
    <div>
      <Section title="Current Plan" description="Billed monthly via Razorpay. Cancel anytime.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {PLANS.map(plan => (
            <div key={plan.id} className="p-4 rounded-xl transition-all"
              style={{
                border: plan.current ? "2px solid var(--iw-blue)" : "1px solid var(--border)",
                background: plan.current ? "var(--iw-blue-50)" : "var(--card)",
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>{plan.name}</span>
                {plan.current && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: "var(--iw-blue)", color: "white" }}>Current</span>
                )}
              </div>
              <div className="text-lg mb-3" style={{ fontWeight: 700, color: plan.current ? "var(--iw-blue)" : "var(--foreground)" }}>
                {plan.price}
              </div>
              <ul className="space-y-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: plan.current ? "var(--iw-blue)" : "var(--iw-success)" }} />
                    {f}
                  </li>
                ))}
              </ul>
              {!plan.current && (
                <button className="w-full mt-3 py-1.5 rounded-lg text-[10px] transition-all"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                  {plan.id === "scale" ? "Contact Sales" : "Upgrade"}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <div className="flex-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span style={{ fontWeight: 600, color: "var(--foreground)" }}>Next billing date:</span> July 1, 2026 · ₹8,299
          </div>
          <button className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
            <ExternalLink className="w-3 h-3" /> Manage in Razorpay
          </button>
        </div>
      </Section>

      <Section title="Usage this month">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Active Users", value: "8", limit: "25", color: "var(--iw-success)" },
            { label: "Connectors", value: "6", limit: "15", color: "var(--iw-blue)" },
            { label: "AI Calls (Twin)", value: "2,847", limit: "10,000", color: "var(--iw-purple)" },
            { label: "Memory Ops", value: "312", limit: "∞", color: "var(--iw-warning)" },
          ].map((u, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-1" style={{ fontWeight: 700, color: "var(--foreground)" }}>{u.value}</div>
              <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>{u.label}</div>
              <div className="h-1 rounded-full" style={{ background: "var(--secondary)" }}>
                <div className="h-full rounded-full" style={{
                  width: u.limit === "∞" ? "30%" : `${(parseInt(u.value.replace(",","")) / parseInt(u.limit.replace(",",""))) * 100}%`,
                  background: u.color,
                }} />
              </div>
              <div className="text-[9px] mt-1" style={{ color: "var(--muted-foreground)" }}>of {u.limit}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Invoices">
        <div className="space-y-2">
          {INVOICES.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{inv.description}</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{inv.date} · {inv.id}</p>
              </div>
              <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{inv.amount}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(61,139,110,0.1)", color: "var(--iw-success)" }}>
                {inv.status}
              </span>
              <button className="p-1.5 rounded-lg transition-all"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Connections ─────────────────────────────────────────────────────────

function ConnectionsTab() {
  const [keys, setKeys] = useState(API_KEYS);
  const [showNew, setShowNew] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [newKeyError, setNewKeyError] = useState("");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = () => {
    if (!newKeyName.trim()) { setNewKeyError("Key name is required"); return; }
    setNewKeyName("");
    setShowNew(false);
    setNewKeyError("");
  };

  const handleRevoke = (id: string) => {
    setKeys(prev => prev.filter(k => k.id !== id));
    setConfirmRevoke(null);
  };

  return (
    <div>
      <Section title="MCP Endpoint" description="Your IntegrateWise MCP server — connect any MCP-compatible surface.">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
          style={{ background: "var(--iw-blue-900)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>MCP Endpoint</p>
            <p className="text-sm font-mono text-white">https://mcp.integratewise.ai/api/v1/mcp</p>
          </div>
          <button onClick={() => handleCopy("https://mcp.integratewise.ai/api/v1/mcp", "mcp")}
            className="ml-auto p-2 rounded-lg shrink-0 transition-all"
            style={{ background: "rgba(255,255,255,0.1)" }}>
            {copied === "mcp" ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          Compatible with Claude MCP, any MCP client. Authenticate using an API key below. Transport: HTTPS / SSE.
        </p>
      </Section>

      <Section title="API Keys" description="Scoped keys for programmatic access. Never share secret keys — rotate if compromised."
        action={{ label: "+ New Key", onClick: () => setShowNew(true) }}>

        {showNew && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-3" style={{ fontWeight: 700, color: "var(--foreground)" }}>Create API Key</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <TextInput value={newKeyName} onChange={v => { setNewKeyName(v); setNewKeyError(""); }} placeholder="e.g. Production, Analytics Bot" />
                {newKeyError && <p className="text-[10px] mt-1" style={{ color: "var(--iw-danger)" }}>{newKeyError}</p>}
              </div>
              <button onClick={handleCreate}
                className="px-4 py-2 rounded-lg text-xs text-white shrink-0"
                style={{ background: "var(--iw-blue)", fontWeight: 700 }}>Create</button>
              <button onClick={() => { setShowNew(false); setNewKeyError(""); }}
                className="px-3 py-2 rounded-lg text-xs shrink-0"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {keys.map(key => (
            <div key={key.id} className="px-4 py-3 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-3">
                <Key className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--iw-purple)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs" style={{ fontWeight: 700, color: "var(--foreground)" }}>{key.name}</span>
                  </div>
                  <p className="text-[10px] font-mono mb-1" style={{ color: "var(--muted-foreground)" }}>{key.prefix}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {key.scopes.map(s => (
                      <span key={s} className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{s}</span>
                    ))}
                  </div>
                  <p className="text-[9px] mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                    Created {key.createdAt}{key.lastUsed ? ` · Last used ${key.lastUsed}` : " · Never used"}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleCopy(key.prefix, key.id)}
                    className="p-1.5 rounded-lg transition-all" style={{ color: "var(--muted-foreground)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-blue)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                    {copied === key.id ? <Check className="w-3.5 h-3.5" style={{ color: "var(--iw-success)" }} /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {confirmRevoke === key.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleRevoke(key.id)}
                        className="text-[9px] px-2 py-1 rounded-lg font-bold"
                        style={{ background: "var(--iw-danger)", color: "white" }}>Revoke</button>
                      <button onClick={() => setConfirmRevoke(null)}
                        className="text-[9px] px-2 py-1 rounded-lg"
                        style={{ background: "var(--secondary)", color: "var(--muted-foreground)", fontWeight: 600 }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRevoke(key.id)}
                      className="p-1.5 rounded-lg transition-all" style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--iw-danger)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)"; }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────

function SecurityTab() {
  return (
    <div>
      <Section title="Single Sign-On (SSO)" description="Managed by Clerk. Enforce SSO to require all members to use your identity provider.">
        <div className="space-y-3">
          {[
            { provider: "Google Workspace", status: "configured", icon: "🔵", domain: "acmecorp.com" },
            { provider: "Microsoft Azure AD", status: "available", icon: "🟦" },
            { provider: "Okta", status: "available", icon: "⚪" },
            { provider: "SAML 2.0", status: "available", icon: "🔐" },
          ].map((sso, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "var(--card)", border: `1px solid ${sso.status === "configured" ? "rgba(61,139,110,0.3)" : "var(--border)"}` }}>
              <span className="text-lg">{sso.icon}</span>
              <div className="flex-1">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{sso.provider}</p>
                {sso.domain && <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Configured for {sso.domain}</p>}
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: sso.status === "configured" ? "rgba(61,139,110,0.1)" : "var(--secondary)",
                  color: sso.status === "configured" ? "var(--iw-success)" : "var(--muted-foreground)",
                }}>
                {sso.status === "configured" ? "Active" : "Configure"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Audit Log" description="Every admin action, role change, and security event — immutable.">
        <div className="space-y-1.5">
          {AUDIT_LOG.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg"
              style={{ background: "var(--secondary)" }}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--iw-blue)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "var(--foreground)", fontWeight: 500 }}>{entry.action}</p>
                <p className="text-[9px]" style={{ color: "var(--muted-foreground)" }}>
                  {entry.actor} · {entry.target} · {entry.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Active Sessions">
        <div className="space-y-2">
          {[
            { device: "Chrome · macOS", location: "Mumbai, IN", current: true, lastSeen: "Now" },
            { device: "Safari · iPhone", location: "Mumbai, IN", current: false, lastSeen: "2h ago" },
          ].map((session, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex-1">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>
                  {session.device} {session.current && <span className="ml-1 text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(61,139,110,0.1)", color: "var(--iw-success)" }}>This session</span>}
                </p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{session.location} · {session.lastSeen}</p>
              </div>
              {!session.current && (
                <button className="text-[10px] px-2 py-1 rounded-lg"
                  style={{ color: "var(--iw-danger)", background: "rgba(220,74,74,0.08)", fontWeight: 600 }}>Revoke</button>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Tab: Data ────────────────────────────────────────────────────────────────

function DataTab() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const ORG_NAME = "Acme Corp";

  return (
    <div>
      <Section title="Export Your Data" description="Download a complete export of your Spine entities, memory, and configurations.">
        <div className="space-y-2">
          {[
            { label: "Full Spine Export", desc: "All entities, relationships, events — JSON format", icon: Database },
            { label: "Memory Export",     desc: "Org memory, personal memory, knowledge base — JSONL", icon: Brain },
            { label: "Audit Log Export",  desc: "Complete governance and admin audit trail — CSV", icon: FileText },
          ].map(({ label, desc, icon: Icon }, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--iw-blue)" }} />
              <div className="flex-1">
                <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>{label}</p>
                <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </div>
              <button className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                <Download className="w-3 h-3" /> Request Export
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-3" style={{ color: "var(--muted-foreground)" }}>
          Exports are prepared asynchronously. You'll receive an email when ready. Exports expire after 7 days.
        </p>
      </Section>

      <Section title="Data Retention" description="Configure how long your Spine and memory data is retained.">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Spine entity data", value: "Permanent (append-only)" },
            { label: "Conversational memory", value: "90 days" },
            { label: "Agent logs", value: "30 days" },
            { label: "Audit trail", value: "7 years (compliance)" },
          ].map((r, i) => (
            <div key={i} className="flex justify-between px-3 py-2 rounded-lg"
              style={{ background: "var(--secondary)" }}>
              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{r.label}</span>
              <span className="text-[10px]" style={{ fontWeight: 600, color: "var(--foreground)" }}>{r.value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(220,74,74,0.3)" }}>
        <div className="px-5 py-3" style={{ background: "rgba(220,74,74,0.05)", borderBottom: "1px solid rgba(220,74,74,0.2)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "var(--iw-danger)" }} />
            <h3 className="text-sm" style={{ fontWeight: 700, color: "var(--iw-danger)" }}>Danger Zone</h3>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4" style={{ background: "var(--card)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs" style={{ fontWeight: 600, color: "var(--foreground)" }}>Delete Organisation</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Permanently delete this workspace, all Spine data, memory, and team access. This cannot be undone.
              </p>
            </div>
            <button onClick={() => setConfirmDelete(true)}
              className="text-[10px] px-3 py-1.5 rounded-lg shrink-0"
              style={{ background: "rgba(220,74,74,0.1)", color: "var(--iw-danger)", border: "1px solid rgba(220,74,74,0.25)", fontWeight: 700 }}>
              Delete Organisation
            </button>
          </div>

          {confirmDelete && (
            <div className="px-4 py-4 rounded-xl" style={{ background: "rgba(220,74,74,0.06)", border: "1px solid rgba(220,74,74,0.2)" }}>
              <p className="text-xs mb-3" style={{ color: "var(--foreground)" }}>
                Type <strong>{ORG_NAME}</strong> to confirm deletion. This action is permanent and cannot be reversed.
              </p>
              <div className="flex gap-2">
                <TextInput value={deleteInput} onChange={setDeleteInput} placeholder={ORG_NAME} />
                <button
                  disabled={deleteInput !== ORG_NAME}
                  className="px-4 py-2 rounded-lg text-xs text-white shrink-0 transition-all"
                  style={{ background: deleteInput === ORG_NAME ? "var(--iw-danger)" : "var(--muted)", fontWeight: 700, cursor: deleteInput !== ORG_NAME ? "not-allowed" : "pointer" }}>
                  Delete
                </button>
                <button onClick={() => { setConfirmDelete(false); setDeleteInput(""); }}
                  className="px-3 py-2 rounded-lg text-xs shrink-0"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontWeight: 600 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: AdminTab; label: string; icon: any }[] = [
  { id: "general",     label: "General",     icon: Settings },
  { id: "team",        label: "Team",        icon: Users },
  { id: "billing",     label: "Billing",     icon: CreditCard },
  { id: "connections", label: "Connections", icon: Link2 },
  { id: "security",    label: "Security",    icon: Shield },
  { id: "data",        label: "Data",        icon: Database },
];

export function TenantAdmin() {
  const [tab, setTab] = useState<AdminTab>("general");

  return (
    <div className="flex h-full" style={{ background: "var(--background)" }}>
      {/* Left nav — Vercel-style settings sidebar */}
      <div className="w-52 shrink-0 border-r py-6 px-3" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="px-3 mb-5">
          <h1 className="text-sm" style={{ fontWeight: 700, color: "var(--foreground)" }}>Settings</h1>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>Manage your workspace</p>
        </div>
        <nav className="space-y-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left"
              style={{
                background: tab === t.id ? "var(--secondary)" : "transparent",
                color: tab === t.id ? "var(--foreground)" : "var(--muted-foreground)",
                fontWeight: tab === t.id ? 600 : 400,
              }}
              onMouseEnter={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.background = "var(--secondary)"; }}
              onMouseLeave={e => { if (tab !== t.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <t.icon className="w-3.5 h-3.5 shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          {tab === "general"     && <GeneralTab />}
          {tab === "team"        && <TeamTab />}
          {tab === "billing"     && <BillingTab />}
          {tab === "connections" && <ConnectionsTab />}
          {tab === "security"    && <SecurityTab />}
          {tab === "data"        && <DataTab />}
        </div>
      </div>
    </div>
  );
}
