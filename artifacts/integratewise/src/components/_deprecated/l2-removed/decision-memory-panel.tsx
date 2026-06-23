"use client";

/**
 * L2 Decision Memory Panel
 * View past decisions, patterns, and organizational learning
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspaceEntities } from "@/hooks/use-workspace-entities";
import {
  Brain,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
  tenantId?: string;
}

interface Decision {
  id: string;
  actionType: string;
  entityType: string;
  entityName: string;
  outcome: "correct" | "incorrect" | "partial" | "pending";
  confidence: number;
  trustScore: number;
  autonomyLevel: number;
  decidedAt: string;
  evidenceCount: number;
  patterns: string[];
}

interface DecisionPattern {
  id: string;
  pattern: string;
  successRate: number;
  sampleSize: number;
  lastSeen: string;
}

const outcomeIcon = {
  correct: <CheckCircle className="h-4 w-4 text-green-500" />,
  incorrect: <XCircle className="h-4 w-4 text-red-500" />,
  partial: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  pending: <Clock className="h-4 w-4 text-gray-400" />,
};

const outcomeBadge = {
  correct: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  incorrect: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function DecisionMemoryPanel({ entityType, entityId }: PanelProps) {
  const { data: decisions, isLoading: decisionsLoading } = useWorkspaceEntities<any>("decisions");
  const { data: patterns, isLoading: patternsLoading } =
    useWorkspaceEntities<any>("decision_patterns");
  const isLoading = decisionsLoading || patternsLoading;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"decisions" | "patterns">("decisions");

  const filteredDecisions = decisions.filter((d) => {
    if (filterOutcome && d.outcome !== filterOutcome) return false;
    if (
      searchQuery &&
      !(d.entityName || "").toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(d.actionType || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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
      <div className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Decision Memory
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Organizational learning from past decisions
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 border rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">78%</div>
          <div className="text-xs text-muted-foreground">Success Rate</div>
        </div>
        <div className="p-2 border rounded-lg text-center">
          <div className="text-2xl font-bold">247</div>
          <div className="text-xs text-muted-foreground">Decisions</div>
        </div>
        <div className="p-2 border rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">12</div>
          <div className="text-xs text-muted-foreground">Patterns</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("decisions")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "decisions"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Recent Decisions
        </button>
        <button
          onClick={() => setActiveTab("patterns")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "patterns"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Learned Patterns
        </button>
      </div>

      {activeTab === "decisions" && (
        <>
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search decisions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Outcome Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {["correct", "incorrect", "partial", "pending"].map((outcome) => (
              <Badge
                key={outcome}
                variant="outline"
                className={`cursor-pointer ${filterOutcome === outcome ? outcomeBadge[outcome as keyof typeof outcomeBadge] : ""}`}
                onClick={() => setFilterOutcome(filterOutcome === outcome ? null : outcome)}
              >
                {outcomeIcon[outcome as keyof typeof outcomeIcon]}
                <span className="ml-1 capitalize">{outcome}</span>
              </Badge>
            ))}
          </div>

          {/* Decisions List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredDecisions.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No decisions recorded yet</p>
                </div>
              )}
              {filteredDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {(outcomeIcon as any)[decision.outcome]}
                      <div>
                        <div className="font-medium text-sm">{decision.entityName}</div>
                        <div className="text-xs text-muted-foreground">
                          {decision.actionType.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(decision.confidence * 100)}% conf
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(decision.decidedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Decision Metadata */}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      Trust: {Math.round(decision.trustScore * 100)}%
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      L{decision.autonomyLevel} Autonomy
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {decision.evidenceCount} evidence
                    </Badge>
                  </div>

                  {/* Patterns */}
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {(decision.patterns || []).map((pattern: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded"
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      {activeTab === "patterns" && (
        <ScrollArea className="h-[450px]">
          <div className="space-y-2">
            {patterns.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No decision patterns found</p>
              </div>
            )}
            {patterns.map((pattern) => (
              <div
                key={pattern.id}
                className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">{pattern.pattern}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                  <span
                    className={pattern.successRate > 0.7 ? "text-green-600" : "text-yellow-600"}
                  >
                    {Math.round(pattern.successRate * 100)}% success
                  </span>
                  <span>{pattern.sampleSize} samples</span>
                  <span>Last: {pattern.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Replay Button */}
      <div className="pt-2 border-t">
        <Button variant="outline" className="w-full" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Replay Decision (Clause 4)
        </Button>
      </div>
    </div>
  );
}
