import { useState, useEffect, useRef, useCallback } from "react";
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
  Brain,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { apiFetch } from "@/lib/api-client";

export interface Notification {
  id: string;
  type: "info" | "warning" | "critical" | "success";
  category:
    | "system"
    | "workflow"
    | "rbac"
    | "integration"
    | "sales"
    | "marketing"
    | "website"
    | "approval";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionTarget?: { module: string; view: string };
  actor?: string;
  actorInitials?: string;
}

/** Response shape from Think service GET /v1/signals */
interface SignalsResponse {
  data?: Array<{
    id: string;
    tenant_id?: string;
    signal_type?: string;
    severity?: "info" | "warning" | "critical";
    source?: string;
    entity_type?: string | null;
    entity_id?: string | null;
    title?: string;
    description?: string | null;
    metadata?: any;
    acknowledged_by?: string | null;
    acknowledged_at?: string | null;
    resolved_at?: string | null;
    created_at?: string;
    expires_at?: string | null;
  }>;
  recent_signals?: any[];
  signal_count?: number;
  unread_count?: number;
  active_situations?: number;
}

/** Map entity_type from signal to notification category */
function entityTypeToCategory(
  entityType: string | null | undefined,
  signalType: string | undefined
): Notification["category"] {
  if (!entityType && signalType) {
    // Infer from signal_type keywords
    if (/workflow|pipeline|sync/i.test(signalType)) return "workflow";
    if (/approval|role|permission/i.test(signalType)) return "approval";
    if (/churn|health|risk|renewal/i.test(signalType)) return "sales";
    if (/campaign|email|marketing/i.test(signalType)) return "marketing";
    if (/security|mfa|auth/i.test(signalType)) return "rbac";
    if (/seo|website/i.test(signalType)) return "website";
  }
  switch (entityType) {
    case "account":
    case "contact":
    case "deal":
    case "opportunity":
    case "lead":
      return "sales";
    case "campaign":
    case "email_campaign":
      return "marketing";
    case "ticket":
    case "case":
    case "connector":
      return "integration";
    case "workflow":
    case "pipeline":
      return "workflow";
    case "role":
    case "permission":
    case "user":
      return "rbac";
    case "approval":
      return "approval";
    case "website":
    case "page":
      return "website";
    default:
      return "system";
  }
}

/** Format a timestamp as relative time (e.g. "5 min ago", "2h ago") */
function relativeTime(dateStr: string | undefined): string {
  if (!dateStr) return "Just now";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "Just now";
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/** Extract initials from a source/actor string */
function toInitials(source: string | undefined): string {
  if (!source) return "SY";
  if (source === "pipeline" || source === "system") return "SY";
  if (source === "ai" || source === "typescript_intelligence") return "AI";
  return (
    source
      .split(/[\s_-]+/)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2) || "SY"
  );
}

const typeConfig: Record<
  string,
  { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  critical: { color: "#8B2020", bg: "rgba(244,67,54,0.1)", icon: AlertTriangle },
  warning: { color: "#B8943F", bg: "rgba(255,152,0,0.1)", icon: AlertTriangle },
  success: { color: "#3D7A50", bg: "rgba(0,200,83,0.1)", icon: Zap },
  info: { color: "#3d7a50", bg: "rgba(61, 122, 80,0.1)", icon: Info },
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch real signals from Think service via Gateway
  const fetchSignals = useCallback(async () => {
    try {
      const res = await apiFetch<SignalsResponse>(
        "/api/v1/intelligence/signals?limit=50",
        {},
        "NotificationSignals"
      );
      const signals = res.data || res.recent_signals || [];
      const mapped: Notification[] = signals.map((s) => ({
        id: s.id || `signal-${Date.now()}-${Math.random()}`,
        type:
          s.severity === "critical"
            ? ("critical" as const)
            : s.severity === "warning"
              ? ("warning" as const)
              : s.resolved_at
                ? ("success" as const)
                : ("info" as const),
        category: entityTypeToCategory(s.entity_type, s.signal_type),
        title: s.title || s.signal_type || "Signal",
        message: s.description || `${s.entity_type || "Entity"} signal detected`,
        timestamp: relativeTime(s.created_at),
        read: !!s.acknowledged_at,
        actionLabel: s.entity_id ? "View" : undefined,
        actionTarget: s.entity_type
          ? { module: s.entity_type, view: s.entity_id || "" }
          : undefined,
        actor: s.source || "System",
        actorInitials: toInitials(s.source),
      }));
      setNotifications(mapped);
    } catch {
      // API unavailable — show empty state (no mock data in production)
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchSignals();
  }, [isOpen, fetchSignals]);

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
            <span className="text-sm" style={{ fontWeight: 600 }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground"
                style={{ fontWeight: 500 }}
              >
                {unreadCount}
              </span>
            )}
            {criticalCount > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--iw-danger)] text-white"
                style={{ fontWeight: 500 }}
              >
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
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            >
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
                  filter === f
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
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
            {[
              "all",
              "approval",
              "workflow",
              "rbac",
              "integration",
              "sales",
              "marketing",
              "system",
            ].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded text-[10px] capitalize whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
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
              Live — {liveNotifications.length} new notification
              {liveNotifications.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState variant="no-notifications" className="py-8" />
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
                        <TypeIcon className="w-4 h-4" />
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
                            <span className="text-[10px] text-muted-foreground">by {n.actor}</span>
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
        <span
          className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center bg-[var(--iw-danger)] text-white text-[9px] rounded-full px-1"
          style={{ fontWeight: 600 }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
