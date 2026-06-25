"use client";

/**
 * L2 Think Workspace Panel
 * Reasoning surface that generates proposals
 */

import React, { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  FileText,
  RefreshCw,
  ChevronRight,
  Zap,
  Sparkles,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface PanelProps {
  entityId?: string;
  entityType?: string;
}

interface ThinkingOutput {
  id: string;
  type: "summary" | "plan" | "strategy" | "risk" | "prediction" | "hypothesis";
  title: string;
  content: string;
  confidence: number;
  evidenceCount: number;
  createdAt: string;
  status: "draft" | "proposed" | "accepted" | "rejected";
}

const THINK_TYPES = [
  { id: "summary", label: "Summary", icon: FileText, color: "blue" },
  { id: "plan", label: "Plan", icon: Target, color: "green" },
  { id: "strategy", label: "Strategy", icon: Lightbulb, color: "purple" },
  { id: "risk", label: "Risk Analysis", icon: AlertTriangle, color: "red" },
  { id: "prediction", label: "Prediction", icon: TrendingUp, color: "orange" },
];

export function ThinkPanel({ entityType, entityId }: PanelProps) {
  const [isLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("summary");
  const [prompt, setPrompt] = useState("");
  const [outputs] = useState<ThinkingOutput[]>([]);

  const handleThink = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsThinking(true);
    try {
      const result = await apiFetch<ThinkingOutput>(
        "/api/v1/cognitive/think",
        {
          method: "POST",
          body: {
            type: selectedType,
            prompt: prompt.trim(),
            entityId,
            entityType,
          },
        },
        "Think"
      );
      if (result) {
        outputs.unshift(result);
      }
    } catch (err: any) {
      console.warn("[ThinkPanel] API call failed:", err?.message);
      // Don't inject mock data — show error state
    } finally {
      setIsThinking(false);
      setPrompt("");
    }
  }, [prompt, selectedType, entityId, entityType, outputs]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Think Workspace
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Reasoning surface that generates proposals + evidence
        </p>
      </div>

      {/* Think Type Selector */}
      <div className="grid grid-cols-2 gap-2">
        {THINK_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSelectedType(id)}
            className={`p-3 border rounded-lg text-left flex items-center gap-2 transition-colors ${
              selectedType === id
                ? "bg-purple-100 border-purple-300 dark:bg-purple-900/30"
                : "hover:bg-muted/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Think Prompt */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Generate Thinking</p>
        <Textarea
          placeholder={`What would you like to ${selectedType}? (e.g., "Summarize Q1 performance for Acme Corp")`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="text-sm"
        />
        <Button onClick={handleThink} disabled={!prompt.trim() || isThinking} className="w-full">
          {isThinking ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
            </>
          )}
        </Button>
      </div>

      {/* Thinking Outputs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Proposals</p>
          <Badge variant="outline">{outputs.length} generated</Badge>
        </div>

        <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))
          ) : outputs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No thinking outputs yet</p>
              <p className="text-xs">Generate summaries, plans, or analyses above</p>
            </div>
          ) : (
            outputs.map((output) => {
              const typeConfig = THINK_TYPES.find((t) => t.id === output.type);
              const Icon = typeConfig?.icon || Brain;
              return (
                <div key={output.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      <Icon className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{output.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {output.type}
                          </Badge>
                          <Badge
                            variant={
                              output.status === "proposed"
                                ? "default"
                                : output.status === "accepted"
                                  ? "default"
                                  : output.status === "rejected"
                                    ? "destructive"
                                    : "outline"
                            }
                            className="text-xs"
                          >
                            {output.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span
                        className={`text-xs font-medium ${
                          output.confidence >= 85
                            ? "text-green-600"
                            : output.confidence >= 70
                              ? "text-yellow-600"
                              : "text-orange-600"
                        }`}
                      >
                        {output.confidence}% confidence
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {output.evidenceCount} sources
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{output.content}</p>

                  {output.status === "proposed" && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button size="sm" className="flex-1">
                        <Zap className="h-3 w-3 mr-1" />
                        Stage Action
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        View Evidence
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Rule */}
      <div className="p-3 border rounded-lg bg-muted/30">
        <p className="text-xs font-medium mb-1">Think Workspace Rules</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Output is always proposal + evidence</li>
          <li>• Never silent execution - all outputs staged</li>
          <li>• Uncertainty explicitly stated</li>
          <li>• What-if scenarios show alternatives</li>
        </ul>
      </div>
    </div>
  );
}
