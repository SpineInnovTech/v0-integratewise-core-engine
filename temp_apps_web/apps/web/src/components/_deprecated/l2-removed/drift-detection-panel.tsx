"use client";

/**
 * L2 Drift Detection Panel
 * Monitor belief vs reality divergence
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  XCircle,
  TrendingDown,
  TrendingUp,
  Eye,
  EyeOff,
  RotateCcw,
  Activity,
  Target,
  Zap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
  tenantId?: string;
}

interface DriftEvent {
  id: string;
  entityType: string;
  entityName: string;
  attributeName: string;
  believedValue: string | number;
  observedValue: string | number;
  driftMagnitude: number;
  driftType: "sudden_shift" | "gradual_drift" | "value_change" | "missing_data" | "conflict";
  severity: "critical" | "high" | "medium" | "low";
  responseAction: "update_belief" | "flag_for_review" | "pause_automations" | "revert_adjustment";
  responseStatus: "pending" | "in_progress" | "resolved" | "ignored";
  detectedAt: string;
}

interface ActiveBelief {
  id: string;
  entityName: string;
  attribute: string;
  value: string | number;
  confidence: number;
  ageHours: number;
  evidenceQuality: "strong" | "moderate" | "weak" | "inferred";
}

const severityColor = {
  critical: "text-red-600 bg-red-100 dark:bg-red-900/30",
  high: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  medium: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  low: "text-green-600 bg-green-100 dark:bg-green-900/30",
};

const statusIcon = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  in_progress: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />,
  resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
  ignored: <EyeOff className="h-4 w-4 text-gray-400" />,
};

const qualityColor = {
  strong: "text-green-600",
  moderate: "text-yellow-600",
  weak: "text-orange-600",
  inferred: "text-red-600",
};

export function DriftDetectionPanel({ entityType, entityId }: PanelProps) {
  const { data: driftEvents, isLoading: driftsLoading } = useWorkspaceEntities<any>("drift_events");
  const { data: beliefs, isLoading: beliefsLoading } = useWorkspaceEntities<any>("active_beliefs");
  const isLoading = driftsLoading || beliefsLoading;
  const [activeTab, setActiveTab] = useState<"drifts" | "beliefs">("drifts");
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  const filteredEvents = driftEvents.filter(
    (e) => !filterSeverity || e.severity === filterSeverity
  );

  const pendingCount = driftEvents.filter((e) => e.responseStatus === "pending").length;
  const criticalCount = driftEvents.filter((e) => e.severity === "critical").length;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          Reality Drift Detection
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Model-reality divergence monitoring (Clause 1, 3)
        </p>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-3 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            {criticalCount} critical drift{criticalCount > 1 ? "s" : ""} detected
          </span>
          <Button size="sm" variant="outline" className="ml-auto">
            Review
          </Button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 border rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="p-2 border rounded-lg text-center">
          <div className="text-2xl font-bold">{driftEvents.length}</div>
          <div className="text-xs text-muted-foreground">Total (30d)</div>
        </div>
        <div className="p-2 border rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{beliefs.length}</div>
          <div className="text-xs text-muted-foreground">Active Beliefs</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("drifts")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "drifts"
              ? "border-red-500 text-red-600"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Drift Events
        </button>
        <button
          onClick={() => setActiveTab("beliefs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "beliefs"
              ? "border-red-500 text-red-600"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Active Beliefs
        </button>
      </div>

      {activeTab === "drifts" && (
        <>
          {/* Severity Filter */}
          <div className="flex gap-2 flex-wrap">
            {["critical", "high", "medium", "low"].map((severity) => (
              <Badge
                key={severity}
                variant="outline"
                className={`cursor-pointer capitalize ${filterSeverity === severity ? severityColor[severity as keyof typeof severityColor] : ""}`}
                onClick={() => setFilterSeverity(filterSeverity === severity ? null : severity)}
              >
                {severity}
              </Badge>
            ))}
          </div>

          {/* Drift Events List */}
          <ScrollArea className="h-[350px]">
            <div className="space-y-2">
              {filteredEvents.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No drift events detected</p>
                </div>
              )}
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {(statusIcon as any)[event.responseStatus]}
                      <div>
                        <div className="font-medium text-sm">{event.entityName}</div>
                        <div className="text-xs text-muted-foreground">{event.attributeName}</div>
                      </div>
                    </div>
                    <Badge className={(severityColor as any)[event.severity] || ""}>
                      {event.severity}
                    </Badge>
                  </div>

                  {/* Drift Visualization */}
                  <div className="mt-2 p-2 bg-muted/30 rounded flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {typeof event.believedValue === "number"
                        ? event.believedValue.toLocaleString()
                        : event.believedValue}
                    </span>
                    <ArrowRight className="h-4 w-4 text-red-500" />
                    <span className="font-medium">
                      {typeof event.observedValue === "number"
                        ? event.observedValue.toLocaleString()
                        : event.observedValue}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Δ {Math.round(event.driftMagnitude * 100)}%
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {event.driftType.replace(/_/g, " ")}
                    </Badge>
                    <span>•</span>
                    <span>{event.responseAction.replace(/_/g, " ")}</span>
                    <span className="ml-auto">
                      {new Date(event.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {activeTab === "beliefs" && (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {beliefs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active beliefs tracked</p>
              </div>
            )}
            {beliefs.map((belief) => (
              <div
                key={belief.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{belief.entityName}</div>
                    <div className="text-xs text-muted-foreground">{belief.attribute}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {typeof belief.value === "number" && belief.value < 1
                        ? `${Math.round(belief.value * 100)}%`
                        : belief.value}
                    </div>
                    <div
                      className={`text-xs ${(qualityColor as any)[belief.evidenceQuality] || ""}`}
                    >
                      {belief.evidenceQuality}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Progress value={belief.confidence * 100} className="flex-1 h-1" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round(belief.confidence * 100)}% conf
                  </span>
                  <span className="text-xs text-muted-foreground">{belief.ageHours}h old</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Revert Button (Clause 3) */}
      <div className="pt-2 border-t">
        <Button variant="outline" className="w-full" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Revert Last Adjustment (Clause 3)
        </Button>
      </div>
    </div>
  );
}
