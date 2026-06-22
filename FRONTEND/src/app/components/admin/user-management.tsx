import { useState } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Users,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Building2,
  Globe,
  Megaphone,
  DollarSign,
} from "lucide-react";
import { users, roles, pendingInvites } from "./mock-data";
import type { User, RoleId, InvitePending } from "./types";

const roleColors: Record<RoleId, string> = {
  super_admin: "#F44336",
  admin: "#FF9800",
  ops_manager: "#0066FF",
  analyst: "#7C4DFF",
  cs_lead: "#00C853",
  sales_rep: "#00C853",
  marketing_mgr: "#FF4081",
  viewer: "#9E9E9E",
  external_auditor: "#795548",
  custom: "#607D8B",
};

const roleNames: Record<RoleId, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  ops_manager: "Ops Manager",
  analyst: "Analyst",
  cs_lead: "CS Lead",
  sales_rep: "Sales Rep",
  marketing_mgr: "Marketing Mgr",
  viewer: "Viewer",
  external_auditor: "Ext. Auditor",
  custom: "Custom",
};

const statusConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  active: { color: "var(--iw-success)", icon: CheckCircle },
  invited: { color: "var(--iw-blue)", icon: Mail },
  suspended: { color: "var(--iw-danger)", icon: XCircle },
  deactivated: { color: "var(--muted-foreground)", icon: EyeOff },
};

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ops: Building2,
  website: Globe,
  marketing: Megaphone,
  sales: DollarSign,
};

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "invites">("users");

  const filtered = users.filter((u) => {
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    invited: users.filter((u) => u.status === "invited").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    mfaEnabled: users.filter((u) => u.mfaEnabled).length,
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2>User Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage team members, roles, and access across tenants
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-md text-sm hover:bg-accent transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm"
          >
            <UserPlus className="w-4 h-4" /> Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total Users" value={stats.total} icon={<Users className="w-4 h-4" />} color="var(--iw-blue)" />
        <StatCard label="Active" value={stats.active} icon={<CheckCircle className="w-4 h-4" />} color="var(--iw-success)" />
        <StatCard label="Pending Invites" value={stats.invited} icon={<Mail className="w-4 h-4" />} color="var(--iw-blue)" />
        <StatCard label="Suspended" value={stats.suspended} icon={<ShieldAlert className="w-4 h-4" />} color="var(--iw-danger)" />
        <StatCard label="MFA Enabled" value={`${stats.mfaEnabled}/${stats.total}`} icon={<KeyRound className="w-4 h-4" />} color="var(--iw-purple)" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-sm border-b-2 transition-colors ${
            activeTab === "users" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={{ fontWeight: activeTab === "users" ? 500 : 400 }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("invites")}
          className={`px-4 py-2 text-sm border-b-2 transition-colors ${
            activeTab === "invites" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          style={{ fontWeight: activeTab === "invites" ? 500 : 400 }}
        >
          Pending Invites ({pendingInvites.filter((i) => i.status === "pending").length})
        </button>
      </div>

      {activeTab === "users" ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* User Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>User</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Role</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>Modules</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell" style={{ fontWeight: 500 }}>Tenants</th>
                    <th className="text-center py-2.5 px-4 text-xs text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>MFA</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Status</th>
                    <th className="text-left py-2.5 px-4 text-xs text-muted-foreground hidden xl:table-cell" style={{ fontWeight: 500 }}>Last Active</th>
                    <th className="text-right py-2.5 px-4 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const StatusIcon = statusConfig[user.status]?.icon || CheckCircle;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] flex-shrink-0"
                              style={{ backgroundColor: roleColors[user.role], fontWeight: 600 }}
                            >
                              {user.initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{user.name}</div>
                              <div className="text-[11px] text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${roleColors[user.role]}15`,
                              color: roleColors[user.role],
                              fontWeight: 500,
                            }}
                          >
                            {roleNames[user.role]}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex gap-1">
                            {(Object.entries(user.modules) as [string, boolean][])
                              .filter(([, v]) => v)
                              .map(([mod]) => {
                                const Icon = moduleIcons[mod];
                                return (
                                  <div
                                    key={mod}
                                    className="w-5 h-5 rounded flex items-center justify-center bg-secondary"
                                    title={mod.charAt(0).toUpperCase() + mod.slice(1)}
                                  >
                                    {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{user.tenants.length} tenant{user.tenants.length > 1 ? "s" : ""}</span>
                        </td>
                        <td className="py-3 px-4 text-center hidden sm:table-cell">
                          {user.mfaEnabled ? (
                            <ShieldCheck className="w-4 h-4 text-[var(--iw-success)] mx-auto" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)] mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full capitalize flex items-center gap-1 w-fit"
                            style={{
                              backgroundColor: `${statusConfig[user.status]?.color}15`,
                              color: statusConfig[user.status]?.color,
                              fontWeight: 500,
                            }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground hidden xl:table-cell">
                          {user.lastActive}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(user); }}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Pending Invites */
        <div className="space-y-3">
          {pendingInvites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      )}

      {/* User Detail Drawer */}
      {selectedUser && (
        <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>{icon}</div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg" style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function InviteCard({ invite }: { invite: InvitePending }) {
  return (
    <div className={`bg-card border rounded-lg p-4 flex items-center gap-4 ${invite.status === "expired" ? "border-border/50 opacity-60" : "border-border"}`}>
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <Mail className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="text-sm" style={{ fontWeight: 500 }}>{invite.email}</div>
        <div className="text-[11px] text-muted-foreground">
          Invited as <span style={{ fontWeight: 500, color: roleColors[invite.role] }}>{roleNames[invite.role]}</span> by {invite.invitedBy}
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <div className="text-[11px] text-muted-foreground">Sent {invite.sentAt}</div>
        <div className="text-[11px] text-muted-foreground">Expires {invite.expiresAt}</div>
      </div>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
          invite.status === "pending" ? "bg-[var(--iw-blue)]/10 text-[var(--iw-blue)]" : invite.status === "expired" ? "bg-secondary text-muted-foreground" : "bg-[var(--iw-success)]/10 text-[var(--iw-success)]"
        }`}
        style={{ fontWeight: 500 }}
      >
        {invite.status}
      </span>
      {invite.status === "pending" && (
        <div className="flex gap-1">
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors" title="Resend">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button className="p-1.5 rounded-md hover:bg-secondary transition-colors" title="Revoke">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}

function UserDetailDrawer({ user, onClose }: { user: User; onClose: () => void }) {
  const role = roles.find((r) => r.id === user.role);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[90vw] bg-card border-l border-border shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h3>User Details</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: roleColors[user.role], fontWeight: 600 }}
            >
              {user.initials}
            </div>
            <div>
              <div className="text-lg" style={{ fontWeight: 600 }}>{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${roleColors[user.role]}15`, color: roleColors[user.role], fontWeight: 500 }}
                >
                  {roleNames[user.role]}
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${statusConfig[user.status]?.color}15`, color: statusConfig[user.status]?.color, fontWeight: 500 }}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Department" value={user.department} />
            <DetailItem label="Timezone" value={user.timezone} />
            <DetailItem label="Joined" value={user.joinedAt} />
            <DetailItem label="Last Active" value={user.lastActive} />
            <DetailItem label="MFA" value={user.mfaEnabled ? "Enabled" : "Not Enabled"} highlight={!user.mfaEnabled} />
            <DetailItem label="Tenants" value={`${user.tenants.length} workspace${user.tenants.length > 1 ? "s" : ""}`} />
          </div>

          {/* Module Access */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>Module Access</div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(user.modules) as [string, boolean][]).map(([mod, enabled]) => {
                const Icon = moduleIcons[mod];
                return (
                  <div
                    key={mod}
                    className={`flex items-center gap-2 p-2 rounded-md border ${enabled ? "border-[var(--iw-success)]/30 bg-[var(--iw-success)]/5" : "border-border bg-secondary/30 opacity-50"}`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="text-xs capitalize" style={{ fontWeight: 500 }}>{mod === "ops" ? "Business Ops" : mod}</span>
                    {enabled ? <CheckCircle className="w-3 h-3 text-[var(--iw-success)] ml-auto" /> : <XCircle className="w-3 h-3 text-muted-foreground ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* View Modes */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>View Mode Access</div>
            <div className="flex gap-2">
              {(Object.entries(user.viewModes) as [string, boolean][]).map(([mode, enabled]) => (
                <div
                  key={mode}
                  className={`flex-1 text-center p-2 rounded-md text-[10px] capitalize ${enabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground/50"}`}
                  style={{ fontWeight: 500 }}
                >
                  {mode === "cs" ? "CS Intel" : mode}
                  <div className="mt-0.5">{enabled ? "✓" : "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Field-Level Access */}
          {role && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider" style={{ fontWeight: 600 }}>Field-Level Access</div>
              <div className="space-y-1.5">
                {(Object.entries(role.fieldAccess) as [string, string][]).map(([field, level]) => (
                  <div key={field} className="flex items-center justify-between px-2 py-1.5 rounded bg-secondary/50">
                    <span className="text-xs capitalize">{field.replace(/_/g, " ")}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: level === "full" ? "rgba(0,200,83,0.15)" : level === "masked" ? "rgba(255,152,0,0.15)" : level === "read" ? "rgba(0,102,255,0.15)" : "rgba(156,156,156,0.15)",
                        color: level === "full" ? "var(--iw-success)" : level === "masked" ? "var(--iw-warning)" : level === "read" ? "var(--iw-blue)" : "var(--muted-foreground)",
                        fontWeight: 500,
                      }}
                    >
                      {level === "full" ? "Full Access" : level === "masked" ? "Masked" : level === "read" ? "Read Only" : "Hidden"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-border">
            <button className="w-full py-2 px-3 rounded-md bg-secondary text-sm hover:bg-accent transition-colors text-left flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" /> Change Role
            </button>
            <button className="w-full py-2 px-3 rounded-md bg-secondary text-sm hover:bg-accent transition-colors text-left flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" /> Reset Password
            </button>
            {user.status === "active" ? (
              <button className="w-full py-2 px-3 rounded-md text-sm hover:bg-destructive/10 transition-colors text-left flex items-center gap-2 text-destructive">
                <XCircle className="w-4 h-4" /> Suspend User
              </button>
            ) : user.status === "suspended" ? (
              <button className="w-full py-2 px-3 rounded-md bg-[var(--iw-success)]/10 text-sm hover:bg-[var(--iw-success)]/20 transition-colors text-left flex items-center gap-2 text-[var(--iw-success)]">
                <CheckCircle className="w-4 h-4" /> Reactivate User
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function DetailItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-2 rounded-md bg-secondary/50">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-xs ${highlight ? "text-[var(--iw-warning)]" : ""}`} style={{ fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleId>("viewer");
  const [selectedModules, setSelectedModules] = useState({ ops: true, website: false, marketing: false, sales: false });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[480px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3>Invite Team Member</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email Address</label>
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Assign Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleId)}
              className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none cursor-pointer"
            >
              {roles.filter((r) => r.id !== "super_admin").map((r) => (
                <option key={r.id} value={r.id}>{r.name} - {r.description.slice(0, 50)}...</option>
              ))}
            </select>
          </div>

          {/* Module Access */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Module Access</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(selectedModules) as [string, boolean][]).map(([mod, enabled]) => {
                const Icon = moduleIcons[mod];
                return (
                  <button
                    key={mod}
                    onClick={() => setSelectedModules((prev) => ({ ...prev, [mod]: !enabled }))}
                    className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                      enabled ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="text-xs capitalize" style={{ fontWeight: 500 }}>{mod === "ops" ? "Business Ops" : mod}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-[var(--iw-warning)]/10 border border-[var(--iw-warning)]/20">
            <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)] flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-muted-foreground">
              The invited user will receive an email with a secure link. They must complete MFA setup within 7 days. 
              Data access follows the assigned role's RBAC permissions and field-level restrictions.
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2 rounded-md bg-secondary text-sm hover:bg-accent transition-colors">
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
          >
            Send Invite
          </button>
        </div>
      </div>
    </>
  );
}
