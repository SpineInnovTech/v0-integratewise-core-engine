import { useState } from "react";
import {
  Building2,
  Globe,
  Shield,
  Users,
  Plug,
  Plus,
  Settings,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Lock,
  Layers,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Database,
  Server,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";
import { tenants, users } from "./mock-data";
import type { Tenant } from "./types";

const planColors: Record<string, { bg: string; text: string }> = {
  starter: { bg: "rgba(158,158,158,0.15)", text: "#9E9E9E" },
  professional: { bg: "rgba(0,102,255,0.15)", text: "#0066FF" },
  enterprise: { bg: "rgba(124,77,255,0.15)", text: "#7C4DFF" },
  custom: { bg: "rgba(255,152,0,0.15)", text: "#FF9800" },
};

const regionFlags: Record<string, string> = {
  india: "🇮🇳",
  singapore: "🇸🇬",
  australia: "🇦🇺",
  global: "🌐",
};

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(0,200,83,0.15)", text: "#00C853" },
  suspended: { bg: "rgba(244,67,54,0.15)", text: "#F44336" },
  trial: { bg: "rgba(255,152,0,0.15)", text: "#FF9800" },
};

export function TenantManager() {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Multi-Tenant Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage workspaces, data residency, and cross-tenant governance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          <Plus className="w-4 h-4" /> New Workspace
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Total Workspaces</div>
          <div className="text-xl" style={{ fontWeight: 600 }}>{tenants.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Total Users</div>
          <div className="text-xl" style={{ fontWeight: 600 }}>{users.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">APAC Regions</div>
          <div className="text-xl" style={{ fontWeight: 600 }}>3</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[10px] text-muted-foreground mb-1">Compliance Certs</div>
          <div className="text-xl" style={{ fontWeight: 600 }}>6</div>
        </div>
      </div>

      {/* Data Isolation Banner */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--iw-purple)]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[var(--iw-purple)]" />
          </div>
          <div>
            <div className="text-sm" style={{ fontWeight: 600 }}>Data Isolation Architecture</div>
            <div className="text-[11px] text-muted-foreground">Each tenant has complete data isolation with dedicated encryption keys</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["Personal", "Work", "Business", "CS Intelligence"].map((mode, i) => (
            <div key={mode} className="p-2 rounded-md bg-secondary/50 border border-border text-center">
              <div className="text-[10px] text-muted-foreground mb-1">{mode}</div>
              <div className="flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-[var(--iw-purple)]" />
                <span className="text-[10px]" style={{ fontWeight: 500 }}>Isolated</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[var(--iw-success)]" /> No cross-tenant data leakage</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[var(--iw-success)]" /> Per-tenant encryption at rest</span>
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[var(--iw-success)]" /> View mode boundaries enforced</span>
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            isSelected={selectedTenant?.id === tenant.id}
            onClick={() => setSelectedTenant(selectedTenant?.id === tenant.id ? null : tenant)}
          />
        ))}
      </div>

      {/* Selected Tenant Detail */}
      {selectedTenant && (
        <TenantDetailPanel tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTenantModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function TenantCard({ tenant, isSelected, onClick }: { tenant: Tenant; isSelected: boolean; onClick: () => void }) {
  const tenantUsers = users.filter((u) => u.tenants.includes(tenant.id));
  const planCfg = planColors[tenant.plan];
  const statusCfg = statusColors[tenant.status];

  return (
    <div
      className={`bg-card border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tenant.logo}</span>
          <div>
            <div className="text-sm" style={{ fontWeight: 600 }}>{tenant.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{tenant.slug}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full capitalize"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.text, fontWeight: 500 }}
          >
            {tenant.status}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2 rounded-md bg-secondary/50">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <Users className="w-3 h-3" /> Members
          </div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{tenant.memberCount}</div>
        </div>
        <div className="p-2 rounded-md bg-secondary/50">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <Plug className="w-3 h-3" /> Integrations
          </div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{tenant.integrationCount}</div>
        </div>
        <div className="p-2 rounded-md bg-secondary/50">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
            <Layers className="w-3 h-3" /> Maturity
          </div>
          <div className="text-sm" style={{ fontWeight: 600 }}>Level {tenant.maturityLevel}</div>
        </div>
      </div>

      {/* Region & Plan */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs">{regionFlags[tenant.region]}</span>
          <span className="text-[11px] text-muted-foreground capitalize">{tenant.region.replace("-", " ")}</span>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full capitalize"
          style={{ backgroundColor: planCfg.bg, color: planCfg.text, fontWeight: 500 }}
        >
          {tenant.plan}
        </span>
      </div>

      {/* Compliance Badges */}
      {tenant.compliance.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {tenant.compliance.map((cert) => (
            <span key={cert} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>
              {cert}
            </span>
          ))}
        </div>
      )}

      {/* Member Avatars */}
      <div className="flex items-center mt-3 pt-3 border-t border-border">
        <div className="flex -space-x-2">
          {tenantUsers.slice(0, 4).map((u) => (
            <div
              key={u.id}
              className="w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-white text-[8px]"
              style={{ backgroundColor: "var(--iw-blue)", fontWeight: 600 }}
              title={u.name}
            >
              {u.initials}
            </div>
          ))}
          {tenantUsers.length > 4 && (
            <div className="w-6 h-6 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[8px] text-muted-foreground" style={{ fontWeight: 600 }}>
              +{tenantUsers.length - 4}
            </div>
          )}
        </div>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Owner: {tenant.owner}
        </span>
      </div>
    </div>
  );
}

function TenantDetailPanel({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const tenantUsers = users.filter((u) => u.tenants.includes(tenant.id));

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/20">
        <div className="flex items-center gap-3">
          <span className="text-xl">{tenant.logo}</span>
          <div>
            <div style={{ fontWeight: 600 }}>{tenant.name}</div>
            <div className="text-[11px] text-muted-foreground">Workspace Details & Configuration</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Details */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Workspace Info</div>
          <div className="space-y-2">
            <InfoRow label="Slug" value={tenant.slug} mono />
            <InfoRow label="Plan" value={tenant.plan} capitalize />
            <InfoRow label="Region" value={`${regionFlags[tenant.region]} ${tenant.region}`} capitalize />
            <InfoRow label="Data Residency" value={tenant.dataResidency} />
            <InfoRow label="Created" value={tenant.createdAt} />
            <InfoRow label="Owner" value={tenant.owner} />
            <InfoRow label="Maturity Level" value={`Level ${tenant.maturityLevel} of 5`} />
          </div>
        </div>

        {/* Column 2: Compliance & Security */}
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Compliance & Security</div>

          <div className="space-y-2">
            {tenant.compliance.length > 0 ? (
              tenant.compliance.map((cert) => (
                <div key={cert} className="flex items-center gap-2 p-2 rounded-md bg-[var(--iw-success)]/5 border border-[var(--iw-success)]/20">
                  <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" />
                  <span className="text-xs" style={{ fontWeight: 500 }}>{cert}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">Active</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-md bg-secondary/50 border border-border">
                <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)]" />
                <span className="text-xs text-muted-foreground">No compliance certifications configured</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Data Residency</div>
            <div className="p-3 rounded-md bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs" style={{ fontWeight: 500 }}>{tenant.dataResidency}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">All data stored within this region. APAC data never leaves designated zone.</div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Security Settings</div>
            {[
              { label: "Encryption at Rest", enabled: true },
              { label: "Encryption in Transit (TLS 1.3)", enabled: true },
              { label: "MFA Required", enabled: tenant.plan === "enterprise" },
              { label: "SSO Enforced", enabled: tenant.plan === "enterprise" },
              { label: "IP Allowlisting", enabled: false },
              { label: "Session Timeout (30 min)", enabled: true },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between px-2 py-1.5 rounded bg-secondary/50">
                <span className="text-[11px]">{setting.label}</span>
                {setting.enabled ? (
                  <CheckCircle className="w-3 h-3 text-[var(--iw-success)]" />
                ) : (
                  <span className="text-[10px] text-muted-foreground/50">Off</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Members */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Members ({tenantUsers.length})</div>
            <button className="text-[10px] text-primary hover:underline">Manage</button>
          </div>
          <div className="space-y-1.5">
            {tenantUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary transition-colors">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0"
                  style={{ backgroundColor: "var(--iw-blue)", fontWeight: 600 }}
                >
                  {u.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ fontWeight: 500 }}>{u.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize" style={{ fontWeight: 500 }}>
                  {u.role.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-border space-y-1.5">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Quick Actions</div>
            <button className="w-full flex items-center gap-2 p-2 rounded-md bg-secondary text-xs hover:bg-accent transition-colors">
              <Settings className="w-3.5 h-3.5 text-muted-foreground" /> Workspace Settings
            </button>
            <button className="w-full flex items-center gap-2 p-2 rounded-md bg-secondary text-xs hover:bg-accent transition-colors">
              <Database className="w-3.5 h-3.5 text-muted-foreground" /> Data Export (Right to Erasure)
            </button>
            <button className="w-full flex items-center gap-2 p-2 rounded-md bg-secondary text-xs hover:bg-accent transition-colors">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" /> Clone Workspace
            </button>
            {tenant.status === "active" && (
              <button className="w-full flex items-center gap-2 p-2 rounded-md text-xs text-destructive hover:bg-destructive/10 transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" /> Suspend Workspace
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, capitalize: cap }: { label: string; value: string; mono?: boolean; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded bg-secondary/50">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] ${mono ? "font-mono" : ""} ${cap ? "capitalize" : ""}`} style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function CreateTenantModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[520px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3>Create New Workspace</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Workspace Name</label>
            <input
              type="text"
              placeholder="My APAC Workspace"
              className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL Slug</label>
            <input
              type="text"
              placeholder="my-apac-workspace"
              className="w-full px-3 py-2 bg-secondary rounded-md text-sm font-mono border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data Residency Region</label>
            <select className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer">
              <option value="india">🇮🇳 India (Mumbai, ap-south-1)</option>
              <option value="singapore">🇸🇬 Singapore (ap-southeast-1)</option>
              <option value="australia">🇦🇺 Australia (Sydney, ap-southeast-2)</option>
              <option value="global">🌐 Global (US East, us-east-1)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {["Starter", "Professional", "Enterprise"].map((plan) => (
                <button
                  key={plan}
                  className={`p-3 rounded-md border text-center transition-colors ${
                    plan === "Professional" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                  }`}
                >
                  <div className="text-xs" style={{ fontWeight: 500 }}>{plan}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {plan === "Starter" ? "Free" : plan === "Professional" ? "$99/mo" : "Custom"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-[var(--iw-blue)]/10 border border-[var(--iw-blue)]/20">
            <Shield className="w-4 h-4 text-[var(--iw-blue)] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground">
              All data will be stored exclusively in the selected region. Workspace will start at Integration Maturity Level 0 with full data isolation from other workspaces.
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 rounded-md bg-secondary text-sm hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={onClose} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
            Create Workspace
          </button>
        </div>
      </div>
    </>
  );
}
