"use client";

/**
 * L2 Workflows & Agent Colony Control Panel
 * Orchestration surface for multi-agent systems
 *
 * Contains:
 * - Workflow definitions + runs + retries
 * - Agent roster (scopes, permissions, responsibilities)
 * - Escalation rules and failure handling
 * - Scheduling rules (what runs when)
 *
 * Rule: Agents can only operate within policies + approvals.
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Workflow,
  Bot,
  Play,
  Pause,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Settings,
  Calendar,
  Shield,
  Zap,
  Users,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed" | "paused" | "pending_approval";
  progress: number;
  currentStep: string;
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
  retryCount: number;
}

interface Agent {
  id: string;
  name: string;
  type: "assistant" | "worker" | "supervisor" | "specialist";
  status: "active" | "idle" | "busy" | "disabled";
  scope: string[];
  permissions: string[];
  lastActiveAt: string;
  tasksCompleted: number;
  currentTask?: string;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: "manual" | "scheduled" | "event" | "webhook";
  schedule?: string;
  steps: number;
  enabled: boolean;
  lastRunAt?: string;
}

export function WorkflowsPanel({ entityType, entityId }: PanelProps) {
  const [isLoading] = useState(false);
  const [activeView, setActiveView] = useState<"runs" | "agents" | "definitions">("runs");

  // Mock data - will connect to workflow service
  const [workflowRuns] = useState<WorkflowRun[]>([
    {
      id: "run-001",
      workflowId: "wf-001",
      workflowName: "Daily Account Health Check",
      status: "running",
      progress: 65,
      currentStep: "Analyzing engagement metrics",
      startedAt: new Date(Date.now() - 1200000).toISOString(),
      triggeredBy: "Scheduled",
      retryCount: 0,
    },
    {
      id: "run-002",
      workflowId: "wf-002",
      workflowName: "Deal Stage Progression",
      status: "pending_approval",
      progress: 80,
      currentStep: "Awaiting approval: Update stage to Negotiation",
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      triggeredBy: "Signal: Champion email received",
      retryCount: 0,
    },
    {
      id: "run-003",
      workflowId: "wf-003",
      workflowName: "Meeting Follow-up Automation",
      status: "completed",
      progress: 100,
      currentStep: "Done",
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 6000000).toISOString(),
      triggeredBy: "Event: Meeting ended",
      retryCount: 0,
    },
    {
      id: "run-004",
      workflowId: "wf-004",
      workflowName: "Contact Enrichment",
      status: "failed",
      progress: 45,
      currentStep: "Failed: API rate limit exceeded",
      startedAt: new Date(Date.now() - 14400000).toISOString(),
      triggeredBy: "Manual",
      retryCount: 2,
    },
  ]);

  const [agents] = useState<Agent[]>([
    {
      id: "agent-001",
      name: "Sales Assistant",
      type: "assistant",
      status: "busy",
      scope: ["deals", "contacts", "meetings"],
      permissions: ["read", "write", "propose"],
      lastActiveAt: new Date().toISOString(),
      tasksCompleted: 142,
      currentTask: "Analyzing deal pipeline for Acme Corp",
    },
    {
      id: "agent-002",
      name: "Research Agent",
      type: "worker",
      status: "idle",
      scope: ["contacts", "organizations"],
      permissions: ["read", "enrich"],
      lastActiveAt: new Date(Date.now() - 1800000).toISOString(),
      tasksCompleted: 89,
    },
    {
      id: "agent-003",
      name: "Ops Supervisor",
      type: "supervisor",
      status: "active",
      scope: ["all"],
      permissions: ["read", "write", "approve", "escalate"],
      lastActiveAt: new Date(Date.now() - 300000).toISOString(),
      tasksCompleted: 567,
      currentTask: "Reviewing pending approvals",
    },
    {
      id: "agent-004",
      name: "Email Drafter",
      type: "specialist",
      status: "disabled",
      scope: ["emails", "templates"],
      permissions: ["read", "draft"],
      lastActiveAt: new Date(Date.now() - 86400000).toISOString(),
      tasksCompleted: 234,
    },
  ]);

  const [definitions] = useState<WorkflowDefinition[]>([
    {
      id: "wf-001",
      name: "Daily Account Health Check",
      description: "Analyze all active accounts for health signals",
      trigger: "scheduled",
      schedule: "0 8 * * *",
      steps: 5,
      enabled: true,
      lastRunAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: "wf-002",
      name: "Deal Stage Progression",
      description: "Auto-advance deals based on signals",
      trigger: "event",
      steps: 4,
      enabled: true,
      lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "wf-003",
      name: "Meeting Follow-up Automation",
      description: "Generate notes and tasks after meetings",
      trigger: "event",
      steps: 3,
      enabled: true,
      lastRunAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "wf-004",
      name: "Contact Enrichment",
      description: "Enrich contacts with external data",
      trigger: "manual",
      steps: 6,
      enabled: false,
    },
  ]);

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const STATUS_STYLES = {
    running: { icon: Play, color: "text-blue-500", bg: "bg-blue-50" },
    completed: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
    failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
    paused: { icon: Pause, color: "text-yellow-500", bg: "bg-yellow-50" },
    pending_approval: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
  };

  const AGENT_STATUS = {
    active: { color: "text-green-500", badge: "default" as const },
    idle: { color: "text-gray-500", badge: "secondary" as const },
    busy: { color: "text-blue-500", badge: "default" as const },
    disabled: { color: "text-red-500", badge: "destructive" as const },
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Workflow className="h-5 w-5 text-indigo-600" />
          Workflows & Agent Colony
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Orchestration surface — agents operate within policies + approvals
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-blue-600">
            {workflowRuns.filter((r) => r.status === "running").length}
          </div>
          <div className="text-xs text-muted-foreground">Running</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-orange-600">
            {workflowRuns.filter((r) => r.status === "pending_approval").length}
          </div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-green-600">
            {agents.filter((a) => a.status === "active" || a.status === "busy").length}
          </div>
          <div className="text-xs text-muted-foreground">Active Agents</div>
        </div>
        <div className="p-3 border rounded-lg text-center">
          <div className="text-xl font-bold text-purple-600">
            {definitions.filter((d) => d.enabled).length}
          </div>
          <div className="text-xs text-muted-foreground">Workflows</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1">
        <Button
          variant={activeView === "runs" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("runs")}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-1" />
          Runs
        </Button>
        <Button
          variant={activeView === "agents" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("agents")}
          className="flex-1"
        >
          <Bot className="h-4 w-4 mr-1" />
          Agents
        </Button>
        <Button
          variant={activeView === "definitions" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveView("definitions")}
          className="flex-1"
        >
          <Settings className="h-4 w-4 mr-1" />
          Definitions
        </Button>
      </div>

      {/* Workflow Runs */}
      {activeView === "runs" && (
        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            : workflowRuns.map((run) => {
                const style = STATUS_STYLES[run.status];
                const StatusIcon = style.icon;

                return (
                  <div key={run.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${style.bg} dark:bg-opacity-20`}>
                          <StatusIcon className={`h-4 w-4 ${style.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{run.workflowName}</p>
                          <p className="text-xs text-muted-foreground">
                            {run.triggeredBy} • {formatTime(run.startedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          run.status === "failed"
                            ? "destructive"
                            : run.status === "completed"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {run.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="space-y-1 pl-8">
                      <Progress value={run.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{run.currentStep}</p>
                    </div>

                    {run.status === "failed" && (
                      <div className="pl-8">
                        <Button size="sm" variant="outline">
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retry ({run.retryCount}/3)
                        </Button>
                      </div>
                    )}

                    {run.status === "pending_approval" && (
                      <div className="flex gap-2 pl-8">
                        <Button size="sm" variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
        </div>
      )}

      {/* Agent Roster */}
      {activeView === "agents" && (
        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {agents.map((agent) => {
            const style = AGENT_STATUS[agent.status];

            return (
              <div key={agent.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className={`h-5 w-5 ${style.color}`} />
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.type} • {agent.tasksCompleted} tasks completed
                      </p>
                    </div>
                  </div>
                  <Badge variant={style.badge}>{agent.status}</Badge>
                </div>

                {agent.currentTask && (
                  <p className="text-xs text-muted-foreground pl-7">
                    <Zap className="h-3 w-3 inline mr-1" />
                    {agent.currentTask}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 pl-7">
                  {agent.scope.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pl-7">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {agent.permissions.join(", ")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(agent.lastActiveAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Workflow Definitions */}
      {activeView === "definitions" && (
        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {definitions.map((def) => (
            <div key={def.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{def.name}</p>
                  <p className="text-xs text-muted-foreground">{def.description}</p>
                </div>
                <Badge variant={def.enabled ? "default" : "secondary"}>
                  {def.enabled ? "Active" : "Disabled"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {def.trigger === "scheduled" && <Calendar className="h-3 w-3" />}
                  {def.trigger === "event" && <Zap className="h-3 w-3" />}
                  {def.trigger === "manual" && <Users className="h-3 w-3" />}
                  {def.trigger}
                  {def.schedule && ` (${def.schedule})`}
                </span>
                <span>{def.steps} steps</span>
                {def.lastRunAt && <span>Last run: {formatTime(def.lastRunAt)}</span>}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={!def.enabled}>
                  <Play className="h-3 w-3 mr-1" />
                  Run Now
                </Button>
                <Button size="sm" variant="ghost">
                  <Settings className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center p-2 border-t">
        Rule: Agents can only operate within policies + approvals
      </div>
    </div>
  );
}
