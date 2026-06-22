import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  MinusCircle,
  Lock,
  Eye,
  EyeOff,
  Users,
  X,
  Info,
  AlertTriangle,
  Download,
} from "lucide-react";
import { roles, users, auditEntries } from "./mock-data";
import type { Role, RoleId, ModulePermission, FieldAccessConfig } from "./types";
import { ApprovalWorkflows } from "./approval-workflows";

const moduleNames: Record<string, string> = {
  business_ops: "Business Ops",
  website: "Website",
  marketing: "Marketing",
  sales: "Sales",
  admin: "Admin & Governance",
};

const permLabels: Record<keyof ModulePermission, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  admin: "Admin",
};

const crossCutLabels: Record<string, string> = {
  intelligence_overlay: "Intelligence Overlay",
  integrations_manage: "Manage Integrations",
  workflows_create: "Create Workflows",
  workflows_execute: "Execute Workflows",
  agents_configure: "Configure AI Agents",
  byom_manage: "Manage BYOM",
  export_data: "Export Data",
  bulk_actions: "Bulk Actions",
  api_access: "API Access",
  webhook_manage: "Manage Webhooks",
};

const fieldLabels: Record<keyof FieldAccessConfig, string> = {
  revenue_fields: "Revenue & Financial Data",
  contact_pii: "Contact PII (Email, Phone)",
  api_keys: "API Keys & Secrets",
  audit_logs: "Audit Logs",
  billing_info: "Billing Information",
};

const fieldLevelColors: Record<string, { bg: string; text: string; label: string }> = {
  full: { bg: "rgba(0,200,83,0.15)", text: "#00C853", label: "Full" },
  masked: { bg: "rgba(255,152,0,0.15)", text: "#FF9800", label: "Masked" },
  read: { bg: "rgba(0,102,255,0.15)", text: "#0066FF", label: "Read" },
  hidden: { bg: "rgba(156,156,156,0.15)", text: "#9E9E9E", label: "Hidden" },
};

type TabType = "matrix" | "roles" | "field-access" | "approvals" | "audit";

export function RBACManager() {
  const [activeTab, setActiveTab] = useState<TabType>("matrix");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(["business_ops", "sales"]));

  const toggleModule = (mod: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>Roles & Permissions (RBAC)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Define roles, manage permission matrices, and control field-level access
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors">
            <Download className="w-3 h-3" /> Export Matrix
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
            <Plus className="w-4 h-4" /> Create Role
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {[
          { id: "matrix" as TabType, label: "Permission Matrix" },
          { id: "roles" as TabType, label: "Role Templates" },
          { id: "field-access" as TabType, label: "Field-Level Access" },
          { id: "approvals" as TabType, label: "Approval Workflows" },
          { id: "audit" as TabType, label: "RBAC Audit Trail" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontWeight: activeTab === tab.id ? 500 : 400 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "matrix" && (
        <PermissionMatrix expandedModules={expandedModules} toggleModule={toggleModule} />
      )}
      {activeTab === "roles" && (
        <RoleTemplates selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      )}
      {activeTab === "field-access" && <FieldAccessView />}
      {activeTab === "approvals" && <ApprovalWorkflows />}
      {activeTab === "audit" && <AuditTrailView />}
    </div>
  );
}

// ========================================
// Permission Matrix
// ========================================
function PermissionMatrix({ expandedModules, toggleModule }: { expandedModules: Set<string>; toggleModule: (mod: string) => void }) {
  const displayRoles = roles.filter((r) => r.id !== "custom");

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="text-left py-2.5 px-3 text-xs text-muted-foreground sticky left-0 bg-secondary/30 min-w-[200px]" style={{ fontWeight: 500 }}>
                Permission
              </th>
              {displayRoles.map((role) => (
                <th key={role.id} className="py-2.5 px-2 text-center min-w-[80px]" style={{ fontWeight: 500 }}>
                  <div
                    className="text-[10px] px-1.5 py-0.5 rounded-full mx-auto w-fit"
                    style={{ backgroundColor: `${role.color}15`, color: role.color, fontWeight: 500 }}
                  >
                    {role.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{role.userCount} user{role.userCount > 1 ? "s" : ""}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Module Permissions */}
            {Object.entries(moduleNames).map(([modKey, modName]) => (
              <React.Fragment key={modKey}>
                <tr
                  key={`header-${modKey}`}
                  className="border-b border-border bg-secondary/10 cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => toggleModule(modKey)}
                >
                  <td className="py-2 px-3 sticky left-0 bg-secondary/10" style={{ fontWeight: 600 }}>
                    <span className="flex items-center gap-1">
                      {expandedModules.has(modKey) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      {modName}
                    </span>
                  </td>
                  {displayRoles.map((role) => {
                    const modPerms = (role.permissions as any)[modKey] as ModulePermission | undefined;
                    const allGranted = modPerms && Object.values(modPerms).every(Boolean);
                    const noneGranted = modPerms && Object.values(modPerms).every((v) => !v);
                    return (
                      <td key={`${modKey}-${role.id}-summary`} className="py-2 px-2 text-center">
                        {allGranted ? (
                          <CheckCircle className="w-4 h-4 text-[var(--iw-success)] mx-auto" />
                        ) : noneGranted ? (
                          <XCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                        ) : (
                          <MinusCircle className="w-4 h-4 text-[var(--iw-warning)] mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
                {expandedModules.has(modKey) &&
                  Object.entries(permLabels).map(([permKey, permLabel]) => (
                    <tr key={`${modKey}-${permKey}`} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                      <td className="py-1.5 px-3 pl-8 sticky left-0 bg-card text-muted-foreground">{permLabel}</td>
                      {displayRoles.map((role) => {
                        const modPerms = (role.permissions as any)[modKey] as ModulePermission | undefined;
                        const granted = modPerms ? (modPerms as any)[permKey] : false;
                        return (
                          <td key={`${modKey}-${permKey}-${role.id}`} className="py-1.5 px-2 text-center">
                            <button className="mx-auto block p-0.5 rounded hover:bg-secondary transition-colors">
                              {granted ? (
                                <CheckCircle className="w-3.5 h-3.5 text-[var(--iw-success)]" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-muted-foreground/20" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </React.Fragment>
            ))}

            {/* Cross-cutting Permissions */}
            <tr className="border-b border-border bg-secondary/10">
              <td className="py-2 px-3 sticky left-0 bg-secondary/10" style={{ fontWeight: 600 }}>
                <span className="flex items-center gap-1">Cross-Cutting Capabilities</span>
              </td>
              {displayRoles.map((role) => (
                <td key={`cross-${role.id}`} className="py-2 px-2" />
              ))}
            </tr>
            {Object.entries(crossCutLabels).map(([key, label]) => (
              <tr key={key} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                <td className="py-1.5 px-3 pl-8 sticky left-0 bg-card text-muted-foreground">{label}</td>
                {displayRoles.map((role) => {
                  const val = (role.permissions as any)[key];
                  const granted = typeof val === "boolean" ? val : val === "full" || val === "read";
                  const isPartial = val === "read";
                  return (
                    <td key={`${key}-${role.id}`} className="py-1.5 px-2 text-center">
                      <button className="mx-auto block p-0.5 rounded hover:bg-secondary transition-colors">
                        {granted ? (
                          isPartial ? (
                            <Eye className="w-3.5 h-3.5 text-[var(--iw-blue)]" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-[var(--iw-success)]" />
                          )
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-muted-foreground/20" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Maturity Access */}
            <tr className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
              <td className="py-1.5 px-3 pl-8 sticky left-0 bg-card text-muted-foreground">Max Maturity Level</td>
              {displayRoles.map((role) => (
                <td key={`maturity-${role.id}`} className="py-1.5 px-2 text-center">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary" style={{ fontWeight: 500 }}>L{role.maxMaturityAccess}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-secondary/20 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[var(--iw-success)]" /> Granted</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-[var(--iw-blue)]" /> Read Only</span>
        <span className="flex items-center gap-1"><MinusCircle className="w-3 h-3 text-[var(--iw-warning)]" /> Partial</span>
        <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-muted-foreground/30" /> Denied</span>
        <span className="ml-auto text-[10px]">Click any cell to toggle (requires Admin)</span>
      </div>
    </div>
  );
}

// ========================================
// Role Templates
// ========================================
function RoleTemplates({ selectedRole, setSelectedRole }: { selectedRole: Role | null; setSelectedRole: (r: Role | null) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((role) => (
        <div
          key={role.id}
          className={`bg-card border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
            selectedRole?.id === role.id ? "border-primary ring-2 ring-primary/20" : "border-border"
          }`}
          onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${role.color}15` }}
              >
                <Shield className="w-4 h-4" style={{ color: role.color }} />
              </div>
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>{role.name}</div>
                {role.isSystem && (
                  <span className="text-[9px] px-1 py-0.5 rounded bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>
                    System Role
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button className="p-1 rounded hover:bg-secondary transition-colors" onClick={(e) => e.stopPropagation()}>
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
              {!role.isSystem && (
                <button className="p-1 rounded hover:bg-secondary transition-colors" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-[11px] text-muted-foreground mb-3">{role.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-3 mb-3">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="w-3 h-3" /> {role.userCount} user{role.userCount > 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" /> Level {role.maxMaturityAccess}
            </span>
          </div>

          {/* Module Access Indicators */}
          <div className="flex gap-1 flex-wrap">
            {Object.entries(moduleNames).map(([modKey, modName]) => {
              const modPerms = (role.permissions as any)[modKey] as ModulePermission | undefined;
              const hasAccess = modPerms && modPerms.view;
              return (
                <span
                  key={modKey}
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: hasAccess ? `${role.color}10` : "var(--secondary)",
                    color: hasAccess ? role.color : "var(--muted-foreground)",
                    opacity: hasAccess ? 1 : 0.4,
                    fontWeight: 500,
                  }}
                >
                  {modName.split(" ")[0]}
                </span>
              );
            })}
          </div>

          {/* Expanded details */}
          {selectedRole?.id === role.id && (
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>Key Permissions</div>
              {Object.entries(crossCutLabels).map(([key, label]) => {
                const val = (role.permissions as any)[key];
                const granted = typeof val === "boolean" ? val : val !== "none";
                return (
                  <div key={key} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{label}</span>
                    {granted ? (
                      <CheckCircle className="w-3 h-3 text-[var(--iw-success)]" />
                    ) : (
                      <XCircle className="w-3 h-3 text-muted-foreground/30" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// Field-Level Access
// ========================================
function FieldAccessView() {
  const displayRoles = roles.filter((r) => r.id !== "custom");

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-md bg-[var(--iw-blue)]/10 border border-[var(--iw-blue)]/20">
        <Info className="w-4 h-4 text-[var(--iw-blue)] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          Field-level access controls determine how sensitive data is displayed to each role. <span style={{ fontWeight: 500 }}>"Full"</span> shows all data,{" "}
          <span style={{ fontWeight: 500 }}>"Masked"</span> shows partial data (e.g., $***,***), <span style={{ fontWeight: 500 }}>"Read"</span> allows viewing audit records only,{" "}
          and <span style={{ fontWeight: 500 }}>"Hidden"</span> completely removes the field from view.
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-4 text-xs text-muted-foreground sticky left-0 bg-secondary/30 min-w-[180px]" style={{ fontWeight: 500 }}>
                  Data Field
                </th>
                {displayRoles.map((role) => (
                  <th key={role.id} className="py-2.5 px-2 text-center min-w-[90px]">
                    <div
                      className="text-[10px] px-1.5 py-0.5 rounded-full mx-auto w-fit"
                      style={{ backgroundColor: `${role.color}15`, color: role.color, fontWeight: 500 }}
                    >
                      {role.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.entries(fieldLabels) as [keyof FieldAccessConfig, string][]).map(([fieldKey, fieldLabel]) => (
                <tr key={fieldKey} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                  <td className="py-2.5 px-4 sticky left-0 bg-card" style={{ fontWeight: 500 }}>
                    <div className="flex items-center gap-2">
                      {fieldKey === "api_keys" || fieldKey === "billing_info" ? (
                        <Lock className="w-3 h-3 text-[var(--iw-warning)]" />
                      ) : fieldKey === "contact_pii" ? (
                        <ShieldAlert className="w-3 h-3 text-[var(--iw-danger)]" />
                      ) : (
                        <Eye className="w-3 h-3 text-muted-foreground" />
                      )}
                      {fieldLabel}
                    </div>
                  </td>
                  {displayRoles.map((role) => {
                    const level = role.fieldAccess[fieldKey];
                    const cfg = fieldLevelColors[level];
                    return (
                      <td key={`${fieldKey}-${role.id}`} className="py-2.5 px-2 text-center">
                        <button
                          className="mx-auto text-[10px] px-2 py-0.5 rounded transition-colors hover:opacity-80"
                          style={{ backgroundColor: cfg.bg, color: cfg.text, fontWeight: 500 }}
                        >
                          {cfg.label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Masked Data Preview */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider" style={{ fontWeight: 600 }}>
          Masked Data Preview (As seen by Analyst role)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-md bg-secondary/50 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Revenue (Masked)</div>
            <div className="text-sm font-mono" style={{ fontWeight: 500 }}>$•••,•••</div>
          </div>
          <div className="p-3 rounded-md bg-secondary/50 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Contact Email (Masked)</div>
            <div className="text-sm font-mono" style={{ fontWeight: 500 }}>r•••@company.com</div>
          </div>
          <div className="p-3 rounded-md bg-secondary/50 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">API Key (Hidden)</div>
            <div className="text-sm text-muted-foreground/40 italic">Field not visible</div>
          </div>
          <div className="p-3 rounded-md bg-secondary/50 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Billing Info (Hidden)</div>
            <div className="text-sm text-muted-foreground/40 italic">Field not visible</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Audit Trail
// ========================================
function AuditTrailView() {
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredAudit = auditEntries.filter((e) => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    return true;
  });

  const severityColors: Record<string, string> = {
    info: "var(--iw-blue)",
    warning: "var(--iw-warning)",
    critical: "var(--iw-danger)",
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 p-0.5 bg-secondary rounded-md">
          {["all", "info", "warning", "critical"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded text-[11px] capitalize transition-all ${
                severityFilter === sev ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontWeight: severityFilter === sev ? 500 : 400 }}
            >
              {sev}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-secondary rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors">
          <Download className="w-3 h-3" /> Export for Compliance
        </button>
      </div>

      {/* Audit Log */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="space-y-0">
          {filteredAudit.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
              <div
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: severityColors[entry.severity] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm" style={{ fontWeight: 500 }}>{entry.user}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded capitalize"
                    style={{
                      backgroundColor: `${severityColors[entry.severity]}15`,
                      color: severityColors[entry.severity],
                      fontWeight: 500,
                    }}
                  >
                    {entry.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-muted-foreground">{entry.target}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{entry.details}</div>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <div className="text-[10px] text-muted-foreground">{entry.timestamp}</div>
                <div className="text-[10px] text-muted-foreground/60 font-mono">{entry.ipAddress}</div>
                <div className="text-[10px] text-muted-foreground/40">{entry.tenant}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}