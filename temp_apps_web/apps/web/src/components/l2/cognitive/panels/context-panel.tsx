"use client";

/**
 * L2 Context Lens Panel
 * Shows what's currently in context for reasoning
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers,
  Pin,
  X,
  Plus,
  RefreshCw,
  Clock,
  Zap,
  FileText,
  Calendar,
  Users,
  Building2,
  Mail,
} from "lucide-react";

interface PanelProps {
  entityId?: string;
  entityType?: string;
}

interface ContextItem {
  id: string;
  type: "meeting" | "email" | "note" | "account" | "project" | "document";
  title: string;
  addedAt: string;
  pinned: boolean;
  relevanceScore: number;
  reason: string;
}

const CONTEXT_ICONS = {
  meeting: Calendar,
  email: Mail,
  note: FileText,
  account: Building2,
  project: Layers,
  document: FileText,
};

export function ContextPanel({ entityType, entityId }: PanelProps) {
  const [isLoading] = useState(false);
  const [contextItems, setContextItems] = useState<ContextItem[]>([
    {
      id: "1",
      type: "meeting",
      title: "Q1 Planning Session",
      addedAt: new Date().toISOString(),
      pinned: true,
      relevanceScore: 95,
      reason: "User-pinned context",
    },
    {
      id: "2",
      type: "account",
      title: "Acme Corp",
      addedAt: new Date(Date.now() - 3600000).toISOString(),
      pinned: false,
      relevanceScore: 88,
      reason: "Active workspace focus",
    },
    {
      id: "3",
      type: "email",
      title: "RE: Proposal feedback",
      addedAt: new Date(Date.now() - 7200000).toISOString(),
      pinned: false,
      relevanceScore: 75,
      reason: "Recent interaction (2h ago)",
    },
  ]);

  const removeItem = (id: string) => {
    setContextItems((prev) => prev.filter((item) => item.id !== id));
  };

  const togglePin = (id: string) => {
    setContextItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item))
    );
  };

  const sortedItems = [...contextItems].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.relevanceScore - a.relevanceScore;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-cyan-50 dark:bg-cyan-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-cyan-600" />
          Context Lens
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          What&apos;s currently in context for reasoning
        </p>
      </div>

      {/* Context Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-cyan-600">
            {contextItems.filter((i) => i.pinned).length}
          </div>
          <div className="text-xs text-muted-foreground">Pinned</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-cyan-600">{contextItems.length}</div>
          <div className="text-xs text-muted-foreground">Total Items</div>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="text-2xl font-bold text-cyan-600">
            {Math.round(
              contextItems.reduce((sum, i) => sum + i.relevanceScore, 0) / contextItems.length
            )}
          </div>
          <div className="text-xs text-muted-foreground">Avg Score</div>
        </div>
      </div>

      {/* Active Workspace Focus */}
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">Active Workspace</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sales / Acme Corp</p>
            <p className="text-xs text-muted-foreground">Account workspace active for 2h 15m</p>
          </div>
          <Badge variant="outline">Live</Badge>
        </div>
      </div>

      {/* Context Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Context Stack</p>
          <Button variant="ghost" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : sortedItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No context items</p>
              <p className="text-xs">Add items to build reasoning context</p>
            </div>
          ) : (
            sortedItems.map((item) => {
              const Icon = CONTEXT_ICONS[item.type];
              return (
                <div
                  key={item.id}
                  className={`p-3 hover:bg-muted/50 transition-colors ${
                    item.pinned ? "bg-cyan-50/50 dark:bg-cyan-900/10" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{item.title}</p>
                          {item.pinned && <Pin className="h-3 w-3 text-cyan-600" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {item.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(item.addedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span
                        className={`text-xs font-medium ${
                          item.relevanceScore >= 90
                            ? "text-green-600"
                            : item.relevanceScore >= 70
                              ? "text-yellow-600"
                              : "text-orange-600"
                        }`}
                      >
                        {item.relevanceScore}%
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground italic">{item.reason}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => togglePin(item.id)}
                      >
                        <Pin className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-red-600"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Context Rules */}
      <div className="p-3 border rounded-lg bg-muted/30">
        <p className="text-xs font-medium mb-2">Context Rules</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Pinned items always included</li>
          <li>• Auto-include items from active workspace</li>
          <li>• Recent items (last 3h) ranked by recency</li>
          <li>• Max 50 items in context window</li>
        </ul>
      </div>
    </div>
  );
}
