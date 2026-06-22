import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Filter,
  Trash2,
  Settings,
  AlertTriangle,
  Info,
  Zap,
  GitBranch,
  Shield,
  Users,
  DollarSign,
  Megaphone,
  Globe,
  Clock,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface Notification {
  id: string;
  type: "info" | "warning" | "critical" | "success";
  category: "system" | "workflow" | "rbac" | "integration" | "sales" | "marketing" | "website" | "approval";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionTarget?: { module: string; view: string };
  actor?: string;
  actorInitials?: string;
}

const initialNotifications: Notification[] = [
  {
    id: "n1",
    type: "critical",
    category: "workflow",
    title: "Workflow Error: Marketing Attribution Sync",
    message: "Failed after 3 retries — Salesforce API rate limit exceeded. Last attempt: 5 min ago.",
    timestamp: "5 min ago",
    read: false,
    actionLabel: "View Workflow",
    actionTarget: { module: "ops", view: "workflows" },
    actor: "System",
    actorInitials: "SY",
  },
  {
    id: "n2",
    type: "warning",
    category: "approval",
    title: "Approval Pending: Role Change Request",
    message: "Priya Sharma requested Admin role for Vikram Rao — requires your approval.",
    timestamp: "12 min ago",
    read: false,
    actionLabel: "Review",
    actionTarget: { module: "admin", view: "rbac" },
    actor: "Priya Sharma",
    actorInitials: "PS",
  },
  {
    id: "n3",
    type: "success",
    category: "integration",
    title: "Salesforce → HubSpot Sync Complete",
    message: "156 records synced successfully in the last 24 hours. No conflicts detected.",
    timestamp: "28 min ago",
    read: false,
    actionLabel: "View Details",
    actionTarget: { module: "ops", view: "integrations" },
    actor: "System",
    actorInitials: "SY",
  },
  {
    id: "n4",
    type: "warning",
    category: "rbac",
    title: "MFA Not Enabled: Rajesh Menon",
    message: "User has not enabled MFA after 7 days. Security policy requires enforcement.",
    timestamp: "1h ago",
    read: false,
    actionLabel: "Manage User",
    actionTarget: { module: "admin", view: "user-management" },
    actor: "System",
    actorInitials: "SY",
  },
  {
    id: "n5",
    type: "info",
    category: "sales",
    title: "Deal Stage Changed: Acme Corp Enterprise",
    message: "Moved from 'Proposal' to 'Negotiation' by Vikram Rao — $240K deal value.",
    timestamp: "2h ago",
    read: false,
    actionLabel: "View Deal",
    actionTarget: { module: "sales", view: "deals" },
    actor: "Vikram Rao",
    actorInitials: "VR",
  },
  {
    id: "n6",
    type: "success",
    category: "workflow",
    title: "Churn Prediction Pipeline Completed",
    message: "Daily churn scoring complete — 3 accounts flagged at high risk (>70% probability).",
    timestamp: "3h ago",
    read: true,
    actionLabel: "View Pipeline",
    actionTarget: { module: "ops", view: "workflows" },
    actor: "AI Engine",
    actorInitials: "AI",
  },
  {
    id: "n7",
    type: "info",
    category: "marketing",
    title: "Campaign Published: Q1 APAC Webinar Series",
    message: "Email campaign sent to 2,450 contacts. Open tracking enabled.",
    timestamp: "4h ago",
    read: true,
    actionLabel: "View Campaign",
    actionTarget: { module: "marketing", view: "campaigns" },
    actor: "Deepak Joshi",
    actorInitials: "DJ",
  },
  {
    id: "n8",
    type: "warning",
    category: "system",
    title: "Renewal Risk: TechFlow Solutions",
    message: "Health score dropped to 52 — renewal in 28 days. Recommended: schedule QBR.",
    timestamp: "5h ago",
    read: true,
    actionLabel: "View Account",
    actionTarget: { module: "ops", view: "accounts" },
    actor: "AI Engine",
    actorInitials: "AI",
  },
  {
    id: "n9",
    type: "info",
    category: "approval",
    title: "Permission Change Approved",
    message: "Your request to enable export_data for the Analyst role was approved by Arun Kumar.",
    timestamp: "6h ago",
    read: true,
    actor: "Arun Kumar",
    actorInitials: "AK",
  },
  {
    id: "n10",
    type: "info",
    category: "website",
    title: "SEO Score Updated",
    message: "Overall site health improved to 87/100. 3 new issues detected on blog pages.",
    timestamp: "8h ago",
    read: true,
    actionLabel: "View SEO",
    actionTarget: { module: "website", view: "seo" },
    actor: "System",
    actorInitials: "SY",
  },
  {
    id: "n11",
    type: "success",
    category: "approval",
    title: "Field Access Change Approved",
    message: "Revenue field masking for CS Lead role has been approved and applied.",
    timestamp: "1d ago",
    read: true,
    actor: "Arun Kumar",
    actorInitials: "AK",
  },
  {
    id: "n12",
    type: "info",
    category: "system",
    title: "Workspace Backup Completed",
    message: "Daily backup for APAC India workspace completed successfully. 12.4GB total.",
    timestamp: "1d ago",
    read: true,
    actor: "System",
    actorInitials: "SY",
  },
];

const typeConfig: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { color: "#F44336", bg: "rgba(244,67,54,0.1)", icon: AlertTriangle },
  warning: { color: "#FF9800", bg: "rgba(255,152,0,0.1)", icon: AlertTriangle },
  success: { color: "#00C853", bg: "rgba(0,200,83,0.1)", icon: Zap },
  info: { color: "#0066FF", bg: "rgba(0,102,255,0.1)", icon: Info },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  system: Settings,
  workflow: GitBranch,
  rbac: Shield,
  integration: Zap,
  sales: DollarSign,
  marketing: Megaphone,
  website: Globe,
  approval: Shield,
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (module: string, view: string) => void;
}

export function NotificationCenter({ isOpen, onClose, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Simulate real-time notifications
  useEffect(() => {
    if (!isOpen) return;

    const liveMessages: Notification[] = [
      {
        id: `live-${Date.now()}-1`,
        type: "success",
        category: "workflow",
        title: "New Lead Routing (APAC) executed",
        message: "3 new leads routed to regional sales reps",
        timestamp: "Just now",
        read: false,
        actor: "System",
        actorInitials: "SY",
      },
      {
        id: `live-${Date.now()}-2`,
        type: "info",
        category: "sales",
        title: "New activity: Vikram Rao logged a call",
        message: "Call with TechFlow Solutions — 15 min duration",
        timestamp: "Just now",
        read: false,
        actor: "Vikram Rao",
        actorInitials: "VR",
      },
    ];

    const timer = setTimeout(() => {
      const newNotif = liveMessages[Math.floor(Math.random() * liveMessages.length)];
      newNotif.id = `live-${Date.now()}`;
      setLiveNotifications((prev) => [newNotif, ...prev]);
      setNotifications((prev) => [newNotif, ...prev]);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isOpen, notifications.length]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const criticalCount = notifications.filter((n) => n.type === "critical" && !n.read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (filter === "critical" && n.type !== "critical") return false;
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleAction = (n: Notification) => {
    markAsRead(n.id);
    if (n.actionTarget && onNavigate) {
      onNavigate(n.actionTarget.module, n.actionTarget.view);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" />
      <div
        ref={panelRef}
        className="fixed top-12 right-4 z-50 w-[420px] max-h-[85vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: "slideDown 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm" style={{ fontWeight: 600 }}>Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground" style={{ fontWeight: 500 }}>
                {unreadCount}
              </span>
            )}
            {criticalCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--iw-danger)] text-white" style={{ fontWeight: 500 }}>
                {criticalCount} critical
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={markAllRead}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-2 border-b border-border bg-secondary/20 space-y-2">
          <div className="flex gap-1">
            {(["all", "unread", "critical"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-all ${
                  filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                }`}
                style={{ fontWeight: filter === f ? 500 : 400 }}
              >
                {f}
                {f === "unread" && unreadCount > 0 && (
                  <span className="ml-1 text-[9px] opacity-70">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            {["all", "approval", "workflow", "rbac", "integration", "sales", "marketing", "system"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded text-[10px] capitalize whitespace-nowrap transition-all ${
                  categoryFilter === cat ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontWeight: categoryFilter === cat ? 500 : 400 }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Live indicator */}
        {liveNotifications.length > 0 && (
          <div className="px-4 py-1.5 bg-[var(--iw-success)]/10 border-b border-[var(--iw-success)]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--iw-success)] animate-pulse" />
            <span className="text-[10px] text-[var(--iw-success)]" style={{ fontWeight: 500 }}>
              Live — {liveNotifications.length} new notification{liveNotifications.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-sm">No notifications</span>
              <span className="text-[11px] opacity-70">You're all caught up</span>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filtered.map((n) => {
                const cfg = typeConfig[n.type];
                const TypeIcon = cfg.icon;
                const CatIcon = categoryIcons[n.category] || Info;
                const isNew = liveNotifications.some((ln) => ln.id === n.id);

                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-secondary/30 transition-all cursor-pointer relative group ${
                      !n.read ? "bg-primary/[0.02]" : ""
                    } ${isNew ? "animate-pulse" : ""}`}
                    onClick={() => markAsRead(n.id)}
                  >
                    {/* Unread indicator */}
                    {!n.read && (
                      <div
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                    )}

                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <TypeIcon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-[12px]" style={{ fontWeight: n.read ? 400 : 600 }}>
                            {n.title}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(n.id);
                            }}
                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all flex-shrink-0"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {n.timestamp}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded capitalize"
                            style={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 500 }}
                          >
                            {n.category}
                          </span>
                          {n.actor && (
                            <span className="text-[10px] text-muted-foreground">
                              by {n.actor}
                            </span>
                          )}
                        </div>
                        {n.actionLabel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(n);
                            }}
                            className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
                            style={{ fontWeight: 500 }}
                          >
                            {n.actionLabel}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-secondary/20 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {notifications.length} total · {unreadCount} unread
          </span>
          <button className="text-[11px] text-primary hover:underline" style={{ fontWeight: 500 }}>
            Notification Settings
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export function NotificationBell({
  onClick,
  unreadCount,
}: {
  onClick: () => void;
  unreadCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[var(--iw-danger)] text-white text-[9px] rounded-full px-1" style={{ fontWeight: 600 }}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
