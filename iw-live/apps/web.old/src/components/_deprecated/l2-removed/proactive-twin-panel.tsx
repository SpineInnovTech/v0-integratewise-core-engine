"use client";

/**
 * L2 Proactive Twin Panel
 * Proactive monitoring without polluting L1
 *
 * Contains:
 * - Watchlists (accounts/projects/metrics)
 * - Scheduled checks + alerts (queued as proposals)
 * - Daily/weekly briefings (evidence-backed)
 * - "Next actions" always in approval queue
 *
 * Rule: Proactive outputs land as proposals, never silent acts.
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Bell,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  ChevronRight,
  Building2,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  FileText,
  Mail,
  Zap,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
}

interface Watchlist {
  id: string;
  name: string;
  entityType: "account" | "project" | "metric" | "deal";
  entityId: string;
  entityName: string;
  watchType: "health" | "activity" | "metrics" | "deadlines";
  thresholds: Record<string, number>;
  lastCheckedAt: string;
  lastAlertAt?: string;
  status: "healthy" | "warning" | "critical";
  alertCount: number;
}

interface ScheduledCheck {
  id: string;
  watchlistId: string;
  name: string;
  scheduledAt: string;
  frequency: "hourly" | "daily" | "weekly";
  status: "pending" | "completed" | "failed";
  lastResult?: string;
  alertGenerated: boolean;
}

interface Briefing {
  id: string;
  type: "daily" | "weekly";
  title: string;
  summary: string;
  keyItems: string[];
  recommendations: string[];
  evidenceCount: number;
  generatedAt: string;
  read: boolean;
}

interface ProactiveAction {
  id: string;
  source: string;
  action: string;
  reason: string;
  priority: "low" | "medium" | "high";
  status: "queued" | "approved" | "rejected";
  createdAt: string;
}

const ENTITY_ICONS = {
  account: Building2,
  project: Target,
  metric: TrendingUp,
  deal: Zap,
};

const STATUS_COLORS = {
  healthy: "text-green-500",
  warning: "text-yellow-500",
  critical: "text-red-500",
};

export function ProactiveTwinPanel({ entityType, entityId }: PanelProps) {
  const [isLoading] = useState(false);
  const [activeView, setActiveView] = useState<"watchlists" | "briefings" | "actions">(
    "watchlists"
  );

  // Twin service data — starts empty, populated when twin service is connected
  const [watchlists] = useState<Watchlist[]>([]);

  const [briefings] = useState<Briefing[]>([]);

  const [proactiveActions] = useState<ProactiveAction[]>([]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const PRIORITY_STYLES = {
    low: "bg-gray-100 text-gray-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-teal-600" />
          Proactive Twin
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Proactive monitoring — outputs land as proposals, never silent acts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-teal-600">{watchlists.length}</div>
          <div className="text-xs text-muted-foreground">Watchlists</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-red-600">
            {watchlists.filter((w) => w.status === "critical").length}
          </div>
          <div className="text-xs text-muted-foreground">Critical</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-blue-600">
            {briefings.filter((b) => !b.read).length}
          </div>
          <div className="text-xs text-muted-foreground">Unread</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-orange-600">
            {proactiveActions.filter((a) => a.status === "queued").length}
          </div>
          <div className="text-xs text-muted-foreground">Queued</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1">
        <Button
          variant={activeView === "watchlists" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("watchlists")}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          Watchlists
        </Button>
        <Button
          variant={activeView === "briefings" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("briefings")}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-1" />
          Briefings
        </Button>
        <Button
          variant={activeView === "actions" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("actions")}
          className="flex-1"
        >
          <Zap className="h-4 w-4 mr-1" />
          Actions
        </Button>
      </div>

      {/* Watchlists */}
      {activeView === "watchlists" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Active Watchlists</p>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              : watchlists.map((watchlist) => {
                  const EntityIcon = ENTITY_ICONS[watchlist.entityType];
                  const statusColor = STATUS_COLORS[watchlist.status];

                  return (
                    <div key={watchlist.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <EntityIcon className={`h-5 w-5 ${statusColor}`} />
                          <div>
                            <p className="text-sm font-medium">{watchlist.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {watchlist.entityName} • {watchlist.watchType}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            watchlist.status === "critical"
                              ? "destructive"
                              : watchlist.status === "warning"
                                ? "secondary"
                                : "default"
                          }
                        >
                          {watchlist.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Checked {formatTime(watchlist.lastCheckedAt)}
                        </span>
                        {watchlist.alertCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Bell className="h-3 w-3" />
                            {watchlist.alertCount} alerts
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* Briefings */}
      {activeView === "briefings" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Evidence-Backed Briefings</p>

          <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
            {briefings.map((briefing) => (
              <div
                key={briefing.id}
                className={`p-4 space-y-3 ${!briefing.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {briefing.type === "daily" ? (
                      <Calendar className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-purple-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{briefing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(briefing.generatedAt)} • {briefing.evidenceCount} evidence items
                      </p>
                    </div>
                  </div>
                  {!briefing.read && <Badge variant="default">New</Badge>}
                </div>

                <p className="text-sm text-muted-foreground">{briefing.summary}</p>

                <div className="space-y-1">
                  <p className="text-xs font-medium">Key Items:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {briefing.keyItems.slice(0, 3).map((item, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recommendations:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {briefing.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <Zap className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proactive Actions (Approval Queue) */}
      {activeView === "actions" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Next Actions (Approval Queue)</p>

          <div className="border rounded-lg divide-y max-h-[350px] overflow-y-auto">
            {proactiveActions.map((action) => (
              <div key={action.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{action.action}</p>
                    <p className="text-xs text-muted-foreground">Source: {action.source}</p>
                  </div>
                  <Badge className={PRIORITY_STYLES[action.priority]}>{action.priority}</Badge>
                </div>

                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  {action.reason}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatTime(action.createdAt)}
                  </span>

                  {action.status === "queued" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline">
                        Reject
                      </Button>
                    </div>
                  )}

                  {action.status === "approved" && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  )}

                  {action.status === "rejected" && <Badge variant="secondary">Rejected</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center p-2 border-t">
        Rule: Proactive outputs land as proposals, never silent acts
      </div>
    </div>
  );
}
