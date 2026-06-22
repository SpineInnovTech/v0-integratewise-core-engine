import { useState } from "react";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Users,
  ArrowRight,
  Eye,
  MessageSquare,
  RotateCcw,
  Search,
  Filter,
  Download,
  X,
  Check,
  UserCog,
  Lock,
  FileText,
} from "lucide-react";

export interface ApprovalRequest {
  id: string;
  type: "role_change" | "permission_change" | "field_access_change" | "new_role" | "delete_role" | "bulk_permission";
  status: "pending" | "approved" | "rejected" | "expired" | "auto_approved";
  priority: "low" | "medium" | "high" | "critical";
  requestedBy: { name: string; initials: string; role: string };
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  expiresAt: string;
  title: string;
  description: string;
  details: ApprovalDetail;
  approvers: Approver[];
  comments: ApprovalComment[];
  impactSummary: string;
  affectedUsers: number;
  tenant: string;
}

interface ApprovalDetail {
  targetUser?: string;
  fromRole?: string;
  toRole?: string;
  module?: string;
  permission?: string;
  fromValue?: string;
  toValue?: string;
  fieldName?: string;
}

interface Approver {
  name: string;
  initials: string;
  status: "pending" | "approved" | "rejected";
  respondedAt?: string;
}

interface ApprovalComment {
  id: string;
  user: string;
  initials: string;
  message: string;
  timestamp: string;
}

const mockApprovals: ApprovalRequest[] = [
  {
    id: "apr-1",
    type: "role_change",
    status: "pending",
    priority: "high",
    requestedBy: { name: "Priya Sharma", initials: "PS", role: "Ops Manager" },
    requestedAt: "12 min ago",
    expiresAt: "2026-02-11",
    title: "Role Change: Vikram Rao → Admin",
    description: "Elevate Vikram Rao from Sales Rep to Admin role to manage the Singapore workspace during Mei Lin's leave.",
    details: { targetUser: "Vikram Rao", fromRole: "Sales Rep", toRole: "Admin" },
    approvers: [
      { name: "Arun Kumar", initials: "AK", status: "pending" },
      { name: "Mei Lin Chen", initials: "MC", status: "pending" },
    ],
    comments: [
      { id: "c1", user: "Priya Sharma", initials: "PS", message: "Mei Lin is on leave from Feb 10-20. Vikram needs admin access for the Singapore workspace during this period.", timestamp: "12 min ago" },
    ],
    impactSummary: "User will gain full CRUD access across all modules in the Singapore workspace, including user management capabilities.",
    affectedUsers: 1,
    tenant: "iw-apac",
  },
  {
    id: "apr-2",
    type: "permission_change",
    status: "pending",
    priority: "medium",
    requestedBy: { name: "Deepak Joshi", initials: "DJ", role: "Marketing Manager" },
    requestedAt: "45 min ago",
    expiresAt: "2026-02-12",
    title: "Enable API Access for Marketing Manager",
    description: "Allow Marketing Manager role to use API access for HubSpot campaign automation integration.",
    details: { module: "Cross-Cutting", permission: "api_access", fromValue: "Denied", toValue: "Granted" },
    approvers: [
      { name: "Arun Kumar", initials: "AK", status: "pending" },
    ],
    comments: [
      { id: "c2", user: "Deepak Joshi", initials: "DJ", message: "Need API access to set up the new HubSpot marketing automation workflow that connects campaign data.", timestamp: "45 min ago" },
    ],
    impactSummary: "Marketing Manager role will gain API access capability. Affects 1 user currently in this role.",
    affectedUsers: 1,
    tenant: "iw-apac",
  },
  {
    id: "apr-3",
    type: "field_access_change",
    status: "pending",
    priority: "critical",
    requestedBy: { name: "Anjali Patel", initials: "AP", role: "CS Lead" },
    requestedAt: "2h ago",
    expiresAt: "2026-02-10",
    title: "Unmask Revenue Fields for CS Lead Role",
    description: "Request to change revenue_fields from 'masked' to 'full' for the CS Lead role for renewal conversations.",
    details: { fieldName: "Revenue Fields", fromValue: "Masked ($•••,•••)", toValue: "Full Access" },
    approvers: [
      { name: "Arun Kumar", initials: "AK", status: "pending" },
      { name: "Priya Sharma", initials: "PS", status: "approved", respondedAt: "1h ago" },
    ],
    comments: [
      { id: "c3", user: "Anjali Patel", initials: "AP", message: "I need full revenue data visibility for upcoming QBR meetings and renewal negotiations.", timestamp: "2h ago" },
      { id: "c4", user: "Priya Sharma", initials: "PS", message: "Approved from RevOps side. Revenue visibility is essential for CS-led renewal conversations.", timestamp: "1h ago" },
    ],
    impactSummary: "CS Lead will see actual revenue numbers instead of masked values. This is a sensitive data exposure change that affects 1 user.",
    affectedUsers: 1,
    tenant: "iw-apac",
  },
  {
    id: "apr-4",
    type: "bulk_permission",
    status: "pending",
    priority: "high",
    requestedBy: { name: "Arun Kumar", initials: "AK", role: "Super Admin" },
    requestedAt: "3h ago",
    expiresAt: "2026-02-11",
    title: "Enable Workflow Execution for All Non-Admin Roles",
    description: "Batch enable workflows_execute permission for Ops Manager, CS Lead, and Sales Rep roles.",
    details: { permission: "workflows_execute", fromValue: "Mixed", toValue: "Granted for 3 roles" },
    approvers: [
      { name: "Priya Sharma", initials: "PS", status: "approved", respondedAt: "2h ago" },
      { name: "Mei Lin Chen", initials: "MC", status: "pending" },
    ],
    comments: [
      { id: "c5", user: "Arun Kumar", initials: "AK", message: "As we roll out more automation, all operational roles need the ability to trigger workflows.", timestamp: "3h ago" },
      { id: "c6", user: "Priya Sharma", initials: "PS", message: "Agree — this will improve efficiency across the board.", timestamp: "2h ago" },
    ],
    impactSummary: "3 roles will gain workflow execution capability, affecting approximately 3 users.",
    affectedUsers: 3,
    tenant: "iw-apac",
  },
  {
    id: "apr-5",
    type: "role_change",
    status: "approved",
    priority: "medium",
    requestedBy: { name: "Priya Sharma", initials: "PS", role: "Ops Manager" },
    requestedAt: "2d ago",
    resolvedAt: "1d ago",
    resolvedBy: "Arun Kumar",
    expiresAt: "2026-02-09",
    title: "Role Change: Rajesh Menon → Ops Manager (Temp)",
    description: "Temporary role elevation for Rajesh to assist with quarterly report generation.",
    details: { targetUser: "Rajesh Menon", fromRole: "Analyst", toRole: "Ops Manager" },
    approvers: [
      { name: "Arun Kumar", initials: "AK", status: "approved", respondedAt: "1d ago" },
    ],
    comments: [
      { id: "c7", user: "Arun Kumar", initials: "AK", message: "Approved for 7-day period. Set calendar reminder for role revert.", timestamp: "1d ago" },
    ],
    impactSummary: "Temporary elevation approved with time-bound scope.",
    affectedUsers: 1,
    tenant: "iw-apac",
  },
  {
    id: "apr-6",
    type: "permission_change",
    status: "rejected",
    priority: "high",
    requestedBy: { name: "Vikram Rao", initials: "VR", role: "Sales Rep" },
    requestedAt: "3d ago",
    resolvedAt: "2d ago",
    resolvedBy: "Arun Kumar",
    expiresAt: "2026-02-08",
    title: "Enable Bulk Actions for Sales Rep",
    description: "Request to enable bulk_actions permission for Sales Rep role.",
    details: { module: "Cross-Cutting", permission: "bulk_actions", fromValue: "Denied", toValue: "Granted" },
    approvers: [
      { name: "Arun Kumar", initials: "AK", status: "rejected", respondedAt: "2d ago" },
    ],
    comments: [
      { id: "c8", user: "Arun Kumar", initials: "AK", message: "Rejected — bulk actions for Sales Rep would allow mass data modifications. Please escalate specific needs through Ops Manager.", timestamp: "2d ago" },
    ],
    impactSummary: "Not applicable — request was rejected.",
    affectedUsers: 1,
    tenant: "iw-apac",
  },
  {
    id: "apr-7",
    type: "field_access_change",
    status: "auto_approved",
    priority: "low",
    requestedBy: { name: "System", initials: "SY", role: "Automated Policy" },
    requestedAt: "5d ago",
    resolvedAt: "5d ago",
    resolvedBy: "System (Auto-Policy)",
    expiresAt: "N/A",
    title: "Compliance Auto-Review: No Changes",
    description: "Weekly automated compliance review found no policy violations in field access configuration.",
    details: {},
    approvers: [],
    comments: [],
    impactSummary: "No changes made. All field access configurations are compliant.",
    affectedUsers: 0,
    tenant: "iw-apac",
  },
];

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { color: "#FF9800", bg: "rgba(255,152,0,0.1)", label: "Pending", icon: Clock },
  approved: { color: "#00C853", bg: "rgba(0,200,83,0.1)", label: "Approved", icon: CheckCircle },
  rejected: { color: "#F44336", bg: "rgba(244,67,54,0.1)", label: "Rejected", icon: XCircle },
  expired: { color: "#9E9E9E", bg: "rgba(158,158,158,0.1)", label: "Expired", icon: Clock },
  auto_approved: { color: "#0066FF", bg: "rgba(0,102,255,0.1)", label: "Auto-Approved", icon: CheckCircle },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: "#9E9E9E", bg: "rgba(158,158,158,0.1)" },
  medium: { color: "#0066FF", bg: "rgba(0,102,255,0.1)" },
  high: { color: "#FF9800", bg: "rgba(255,152,0,0.1)" },
  critical: { color: "#F44336", bg: "rgba(244,67,54,0.1)" },
};

const typeLabels: Record<string, string> = {
  role_change: "Role Change",
  permission_change: "Permission Change",
  field_access_change: "Field Access",
  new_role: "New Role",
  delete_role: "Delete Role",
  bulk_permission: "Bulk Permission",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  role_change: UserCog,
  permission_change: Shield,
  field_access_change: Lock,
  new_role: Users,
  delete_role: XCircle,
  bulk_permission: Users,
};

export function ApprovalWorkflows() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(mockApprovals);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>("apr-1");
  const [showApproveModal, setShowApproveModal] = useState<ApprovalRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve");
  const [approvalComment, setApprovalComment] = useState("");

  const filtered = approvals.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const stats = {
    pending: approvals.filter((a) => a.status === "pending").length,
    approved: approvals.filter((a) => a.status === "approved" || a.status === "auto_approved").length,
    rejected: approvals.filter((a) => a.status === "rejected").length,
    avgResolution: "4.2h",
  };

  const handleApprovalAction = (req: ApprovalRequest, action: "approve" | "reject") => {
    setShowApproveModal(req);
    setApprovalAction(action);
    setApprovalComment("");
  };

  const submitApproval = () => {
    if (!showApproveModal) return;
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === showApproveModal.id
          ? {
              ...a,
              status: approvalAction === "approve" ? "approved" : "rejected",
              resolvedAt: "Just now",
              resolvedBy: "Arun Kumar",
              comments: [
                ...a.comments,
                {
                  id: `c-${Date.now()}`,
                  user: "Arun Kumar",
                  initials: "AK",
                  message: approvalComment || (approvalAction === "approve" ? "Approved." : "Rejected."),
                  timestamp: "Just now",
                },
              ],
              approvers: a.approvers.map((ap) =>
                ap.name === "Arun Kumar" ? { ...ap, status: approvalAction === "approve" ? "approved" : "rejected", respondedAt: "Just now" } : ap
              ),
            }
          : a
      )
    );
    setShowApproveModal(null);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(255,152,0,0.1)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "#FF9800" }} />
            </div>
            <span className="text-[10px] text-muted-foreground">Pending</span>
          </div>
          <div className="text-lg" style={{ fontWeight: 600 }}>{stats.pending}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(0,200,83,0.1)" }}>
              <CheckCircle className="w-3.5 h-3.5" style={{ color: "#00C853" }} />
            </div>
            <span className="text-[10px] text-muted-foreground">Approved</span>
          </div>
          <div className="text-lg" style={{ fontWeight: 600 }}>{stats.approved}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(244,67,54,0.1)" }}>
              <XCircle className="w-3.5 h-3.5" style={{ color: "#F44336" }} />
            </div>
            <span className="text-[10px] text-muted-foreground">Rejected</span>
          </div>
          <div className="text-lg" style={{ fontWeight: 600 }}>{stats.rejected}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "rgba(0,102,255,0.1)" }}>
              <Clock className="w-3.5 h-3.5" style={{ color: "#0066FF" }} />
            </div>
            <span className="text-[10px] text-muted-foreground">Avg Resolution</span>
          </div>
          <div className="text-lg" style={{ fontWeight: 600 }}>{stats.avgResolution}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search approval requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-1 p-0.5 bg-secondary rounded-md">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-[11px] capitalize transition-all ${
                statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontWeight: statusFilter === s ? 500 : 400 }}
            >
              {s}
              {s === "pending" && pendingCount > 0 && (
                <span className="ml-1 text-[9px] px-1 rounded-full bg-[var(--iw-warning)]/20 text-[var(--iw-warning)]" style={{ fontWeight: 600 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Approval Cards */}
      <div className="space-y-3">
        {filtered.map((req) => {
          const stCfg = statusConfig[req.status];
          const prCfg = priorityConfig[req.priority];
          const TypeIcon = typeIcons[req.type] || Shield;
          const StIcon = stCfg.icon;
          const isExpanded = expandedId === req.id;

          return (
            <div
              key={req.id}
              className={`bg-card border rounded-lg overflow-hidden transition-all ${
                req.status === "pending" ? "border-[var(--iw-warning)]/30" : "border-border"
              }`}
            >
              {/* Header */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : req.id)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stCfg.bg }}
                >
                  <TypeIcon className="w-4 h-4" style={{ color: stCfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm" style={{ fontWeight: 600 }}>{req.title}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                      style={{ backgroundColor: stCfg.bg, color: stCfg.color, fontWeight: 500 }}
                    >
                      <StIcon className="w-3 h-3" /> {stCfg.label}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                      style={{ backgroundColor: prCfg.bg, color: prCfg.color, fontWeight: 500 }}
                    >
                      {req.priority}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                      style={{ fontWeight: 500 }}
                    >
                      {typeLabels[req.type]}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{req.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>Requested by {req.requestedBy.name} · {req.requestedAt}</span>
                    <span>Affects {req.affectedUsers} user{req.affectedUsers !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Approver avatars */}
                  <div className="flex -space-x-2">
                    {req.approvers.map((a, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] border-2 border-card"
                        style={{
                          fontWeight: 600,
                          backgroundColor:
                            a.status === "approved"
                              ? "rgba(0,200,83,0.2)"
                              : a.status === "rejected"
                              ? "rgba(244,67,54,0.2)"
                              : "var(--secondary)",
                          color: a.status === "approved" ? "#00C853" : a.status === "rejected" ? "#F44336" : "var(--muted-foreground)",
                        }}
                        title={`${a.name} — ${a.status}`}
                      >
                        {a.initials}
                      </div>
                    ))}
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-border">
                    {/* Change Details */}
                    <div className="p-4 space-y-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                        Change Details
                      </div>
                      {req.details.targetUser && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground w-16">User:</span>
                          <span style={{ fontWeight: 500 }}>{req.details.targetUser}</span>
                        </div>
                      )}
                      {req.details.fromRole && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground w-16">From:</span>
                          <span className="px-1.5 py-0.5 rounded bg-[var(--iw-danger)]/10 text-[var(--iw-danger)]" style={{ fontWeight: 500 }}>
                            {req.details.fromRole}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="px-1.5 py-0.5 rounded bg-[var(--iw-success)]/10 text-[var(--iw-success)]" style={{ fontWeight: 500 }}>
                            {req.details.toRole}
                          </span>
                        </div>
                      )}
                      {req.details.module && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground w-16">Module:</span>
                          <span style={{ fontWeight: 500 }}>{req.details.module}</span>
                        </div>
                      )}
                      {req.details.permission && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground w-16">Perm:</span>
                          <span style={{ fontWeight: 500 }}>{req.details.permission}</span>
                        </div>
                      )}
                      {req.details.fromValue && !req.details.fromRole && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-muted-foreground w-16">Change:</span>
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground" style={{ fontWeight: 500 }}>
                            {req.details.fromValue}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="px-1.5 py-0.5 rounded bg-[var(--iw-success)]/10 text-[var(--iw-success)]" style={{ fontWeight: 500 }}>
                            {req.details.toValue}
                          </span>
                        </div>
                      )}
                      <div className="p-2 rounded-md bg-[var(--iw-warning)]/5 border border-[var(--iw-warning)]/20 mt-2">
                        <div className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-[var(--iw-warning)] flex-shrink-0 mt-0.5" />
                          <span className="text-[10px] text-muted-foreground">{req.impactSummary}</span>
                        </div>
                      </div>
                    </div>

                    {/* Approver Status */}
                    <div className="p-4 space-y-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                        Approver Status
                      </div>
                      {req.approvers.length === 0 ? (
                        <div className="text-[11px] text-muted-foreground italic">No approvers required (auto-policy)</div>
                      ) : (
                        req.approvers.map((a, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px]"
                              style={{
                                fontWeight: 600,
                                backgroundColor:
                                  a.status === "approved" ? "rgba(0,200,83,0.15)" : a.status === "rejected" ? "rgba(244,67,54,0.15)" : "var(--secondary)",
                                color: a.status === "approved" ? "#00C853" : a.status === "rejected" ? "#F44336" : "var(--muted-foreground)",
                              }}
                            >
                              {a.initials}
                            </div>
                            <div className="flex-1">
                              <div className="text-[11px]" style={{ fontWeight: 500 }}>{a.name}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {a.status === "pending" ? "Awaiting response" : `${a.status} · ${a.respondedAt}`}
                              </div>
                            </div>
                            {a.status === "approved" && <CheckCircle className="w-4 h-4 text-[var(--iw-success)]" />}
                            {a.status === "rejected" && <XCircle className="w-4 h-4 text-[var(--iw-danger)]" />}
                            {a.status === "pending" && <Clock className="w-4 h-4 text-[var(--iw-warning)]" />}
                          </div>
                        ))
                      )}

                      {/* Expiry */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        Expires: {req.expiresAt}
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="p-4 space-y-3">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                        Comments ({req.comments.length})
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {req.comments.map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[8px] flex-shrink-0 mt-0.5" style={{ fontWeight: 600 }}>
                              {c.initials}
                            </div>
                            <div>
                              <div className="text-[10px]">
                                <span style={{ fontWeight: 500 }}>{c.user}</span>
                                <span className="text-muted-foreground ml-1">· {c.timestamp}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground">{c.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {req.status === "pending" && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/20">
                      <div className="text-[10px] text-muted-foreground">
                        You are an approver for this request
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovalAction(req, "reject")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--iw-danger)]/30 text-[var(--iw-danger)] text-xs hover:bg-[var(--iw-danger)]/10 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleApprovalAction(req, "approve")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--iw-success)] text-white text-xs hover:opacity-90 transition-opacity"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Approve/Reject Modal */}
      {showApproveModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowApproveModal(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[480px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {approvalAction === "approve" ? (
                  <CheckCircle className="w-5 h-5 text-[var(--iw-success)]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[var(--iw-danger)]" />
                )}
                <h3>{approvalAction === "approve" ? "Approve" : "Reject"} Request</h3>
              </div>
              <button onClick={() => setShowApproveModal(null)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 rounded-md bg-secondary/50">
                <div className="text-sm" style={{ fontWeight: 500 }}>{showApproveModal.title}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{showApproveModal.description}</div>
              </div>

              {approvalAction === "approve" && (
                <div className="p-3 rounded-md bg-[var(--iw-warning)]/5 border border-[var(--iw-warning)]/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--iw-warning)] flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-muted-foreground">{showApproveModal.impactSummary}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {approvalAction === "approve" ? "Approval Note (optional)" : "Reason for Rejection (required)"}
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder={approvalAction === "approve" ? "Add a note..." : "Please provide a reason..."}
                  className="w-full px-3 py-2 bg-secondary rounded-md text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                />
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowApproveModal(null)}
                className="flex-1 py-2 rounded-md bg-secondary text-sm hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                disabled={approvalAction === "reject" && !approvalComment.trim()}
                className={`flex-1 py-2 rounded-md text-sm text-white transition-opacity ${
                  approvalAction === "approve"
                    ? "bg-[var(--iw-success)] hover:opacity-90"
                    : "bg-[var(--iw-danger)] hover:opacity-90"
                } ${approvalAction === "reject" && !approvalComment.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {approvalAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
