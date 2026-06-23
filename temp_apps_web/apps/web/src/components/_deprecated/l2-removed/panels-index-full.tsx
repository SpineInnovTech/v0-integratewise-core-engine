"use client";

/**
 * L2 Cognitive Panels - Intelligence Layer UI Components
 * Connected to real L3 services via hooks
 */

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  Brain,
  BookOpen,
  Lightbulb,
  Activity,
  FileSearch,
  History,
  ChevronRight,
  ExternalLink,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Zap,
  Users,
  Building2,
  FileText,
  Calendar,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  useKnowledgeSearch,
  useKnowledgeTopics,
  useSignals,
  useSituations,
  useEvidence,
  useAuditLog,
  useIQSessions,
  useMemories,
  type SpineEntity,
  type Signal,
  type Situation,
  type EvidenceItem,
  type AuditEntry,
  type IQSession,
  type MemoryObject,
  type KnowledgeSearchResult,
  type KnowledgeTopic,
} from "@/hooks/useCognitiveData";
import { useSpineEntitiesBatch } from "@/hooks/use-spine-entities";

interface PanelProps {
  entityId?: string;
  entityType?: string;
}

// ============================================================================
// Spine Panel - Entity Browser
// ============================================================================

const ENTITY_TYPES = [
  { type: "account", label: "Accounts", icon: Building2 },
  { type: "contact", label: "Contacts", icon: Users },
  { type: "project", label: "Projects", icon: Target },
  { type: "task", label: "Tasks", icon: CheckCircle },
  { type: "meeting", label: "Meetings", icon: Calendar },
  { type: "document", label: "Documents", icon: FileText },
];

export function SpinePanelEnhanced({
  entityType: initialType,
  entityId,
}: PanelProps): React.ReactElement {
  const [selectedType, setSelectedType] = useState(initialType || "account");
  const [selectedEntity, setSelectedEntity] = useState<SpineEntity | null>(null);
  const batchResult = useSpineEntitiesBatch([
    "account",
    "contact",
    "project",
    "task",
    "meeting",
    "document",
  ]);
  const allEntities = Object.values(batchResult.data).flat() as SpineEntity[];
  const entities = allEntities;
  const isLoading = batchResult.isLoading;
  const refresh = batchResult.refetch;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Spine - System of Record
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Canonical truth store for all entities
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refresh()}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Entity Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        {ENTITY_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => {
              setSelectedType(type);
              setSelectedEntity(null);
            }}
            className={`p-3 border rounded-lg text-left flex items-center gap-2 transition-colors ${
              selectedType === type
                ? "bg-blue-100 border-blue-300 dark:bg-blue-900/30"
                : "hover:bg-muted/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Entity List */}
      <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : entities.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No {selectedType}s found</p>
          </div>
        ) : (
          entities.map((entity) => (
            <button
              key={entity.id}
              onClick={() => setSelectedEntity(entity)}
              className={`w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between ${
                selectedEntity?.id === entity.id ? "bg-muted" : ""
              }`}
            >
              <div>
                <p className="font-medium text-sm">
                  {(entity.data as any)?.name || (entity.data as any)?.title || entity.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entity.category} • Updated{" "}
                  {entity.updated_at ? new Date(entity.updated_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))
        )}
      </div>

      {/* Selected Entity Detail */}
      {selectedEntity && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Entity Detail</h4>
            <Badge variant="outline">{selectedEntity.category}</Badge>
          </div>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[200px]">
            {JSON.stringify(selectedEntity.data, null, 2)}
          </pre>
          {Object.keys(selectedEntity.relationships || {}).length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium mb-1">Relationships:</p>
              <pre className="text-xs bg-muted p-2 rounded">
                {JSON.stringify(selectedEntity.relationships, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Knowledge Panel - Semantic Search & Topics
// ============================================================================

export function KnowledgePanelEnhanced({ entityType, entityId }: PanelProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const { topics, isLoading: topicsLoading, refresh: refreshTopics } = useKnowledgeTopics();
  const { results, isLoading: searchLoading } = useKnowledgeSearch(activeSearch ?? undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-600" />
          Knowledge Bank
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Semantic search across all indexed documents
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={searchLoading}>
          {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {/* Search Results */}
      {activeSearch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Results for &quot;{activeSearch}&quot;</p>
            <Badge variant="outline">{results.length} found</Badge>
          </div>
          <div className="border rounded-lg divide-y max-h-[250px] overflow-y-auto">
            {searchLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))
            ) : results.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No results found</p>
              </div>
            ) : (
              results.map((result) => (
                <div key={result.id} className="p-3 hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{result.document_title}</p>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((result.similarity ?? 0) * 100)}% match
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.content ?? ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Topics */}
      {!activeSearch && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Knowledge Topics</p>
            <Button variant="ghost" size="sm" onClick={() => refreshTopics()}>
              <RefreshCw className={`h-3 w-3 ${topicsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {topicsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
            ) : topics.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-2">No topics indexed yet</p>
            ) : (
              topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    setSearchQuery(topic.name);
                    setActiveSearch(topic.name);
                  }}
                  className="p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                >
                  <p className="font-medium text-sm">{topic.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {topic.document_count ?? topic.documentCount ?? 0} documents
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Signals Panel - Health & Risk Monitoring
// ============================================================================

const BAND_CONFIG = {
  green: { color: "text-green-600", bg: "bg-green-100", label: "Healthy" },
  yellow: { color: "text-yellow-600", bg: "bg-yellow-100", label: "Attention" },
  red: { color: "text-red-600", bg: "bg-red-100", label: "Critical" },
};

export function SignalsPanelEnhanced({ entityType, entityId }: PanelProps): React.ReactElement {
  const { signals, isLoading: signalsLoading, refresh: refreshSignals } = useSignals();
  const { situations, isLoading: situationsLoading, refresh: refreshSituations } = useSituations();

  const signalsByBand = {
    red: signals.filter((s) => s.band === "red"),
    yellow: signals.filter((s) => s.band === "yellow"),
    green: signals.filter((s) => s.band === "green"),
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" />
          Signals & Situations
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Health monitoring, anomalies, and risk alerts
        </p>
      </div>

      {/* Signal Summary */}
      <div className="grid grid-cols-3 gap-2">
        {(["red", "yellow", "green"] as const).map((band) => {
          const config = BAND_CONFIG[band];
          return (
            <div key={band} className={`p-3 rounded-lg ${config.bg}`}>
              <div className={`text-2xl font-bold ${config.color}`}>
                {signalsByBand[band].length}
              </div>
              <div className="text-xs text-muted-foreground">{config.label}</div>
            </div>
          );
        })}
      </div>

      {/* Active Situations */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Active Situations</p>
          <Button variant="ghost" size="sm" onClick={() => refreshSituations()}>
            <RefreshCw className={`h-3 w-3 ${situationsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
          {situationsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          ) : situations.filter((s) => s.status === "open").length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No open situations</p>
            </div>
          ) : (
            situations
              .filter((s) => s.status === "open")
              .map((situation) => (
                <div
                  key={situation.id}
                  className={`p-3 iw-intelligence-card hover:opacity-95 transition-opacity ${
                    situation.severity === "critical"
                      ? "iw-signal-critical"
                      : situation.severity === "high"
                        ? "iw-signal-warning"
                        : situation.severity === "medium"
                          ? "iw-signal-info"
                          : "iw-signal-success"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{situation.title}</p>
                    <Badge
                      variant={
                        situation.severity === "critical"
                          ? "destructive"
                          : situation.severity === "high"
                            ? "destructive"
                            : situation.severity === "medium"
                              ? "default"
                              : "secondary"
                      }
                    >
                      {situation.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {situation.description}
                  </p>
                  {(situation.recommendations ?? []).length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <Lightbulb className="h-3 w-3" />
                      {(situation.recommendations ?? []).length} recommendations
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>

      {/* Recent Signals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Recent Signals</p>
          <Button variant="ghost" size="sm" onClick={() => refreshSignals()}>
            <RefreshCw className={`h-3 w-3 ${signalsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="border rounded-lg divide-y max-h-[150px] overflow-y-auto">
          {signalsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-2">
                  <Skeleton className="h-3 w-full" />
                </div>
              ))
            : signals.slice(0, 5).map((signal) => (
                <div key={signal.id} className="p-2 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      signal.band === "red"
                        ? "bg-red-500"
                        : signal.band === "yellow"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  />
                  <span className="text-sm flex-1 truncate">{signal.title ?? ""}</span>
                  <span className="text-xs text-muted-foreground">
                    {signal.computed_at ? new Date(signal.computed_at).toLocaleTimeString() : ""}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Evidence Panel - Data Lineage
// ============================================================================

export function EvidencePanelEnhanced({ entityType, entityId }: PanelProps): React.ReactElement {
  const { evidence, isLoading, refresh } = useEvidence(
    entityType || undefined,
    entityId || undefined
  );

  const sourceIcons: Record<string, React.ElementType> = {
    crm: Building2,
    email: MessageSquare,
    meeting: Calendar,
    document: FileText,
    api: Zap,
    system: Database,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3 border rounded-lg bg-amber-50 dark:bg-amber-900/20 flex-1">
          <h3 className="font-semibold flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-amber-600" />
            Evidence Trail
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Data lineage and source provenance</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refresh()}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {entityType && entityId && (
        <div className="p-2 border rounded bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Showing evidence for:{" "}
            <code className="bg-muted px-1 rounded">
              {entityType}/{entityId}
            </code>
          </p>
        </div>
      )}

      {/* Evidence List */}
      <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))
        ) : evidence.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <FileSearch className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No evidence found</p>
            <p className="text-xs">Evidence will appear as data flows through the system</p>
          </div>
        ) : (
          evidence.map((item) => {
            const Icon = sourceIcons[item.source_type || ""] || Database;
            return (
              <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {item.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timestamp || item.created_at
                        ? new Date(item.timestamp || item.created_at || "").toLocaleString()
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        item.confidence >= 90
                          ? "text-green-600"
                          : item.confidence >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {item.confidence}% confidence
                    </span>
                    {item.link && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{item.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Audit Panel - Immutable History
// ============================================================================

export function AuditPanelEnhanced({ entityType, entityId }: PanelProps): React.ReactElement {
  const { logs, isLoading, refresh } = useAuditLog();

  const actorIcons: Record<string, React.ElementType> = {
    user: Users,
    system: Database,
    agent: Zap,
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/20 flex-1">
          <h3 className="font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Trail
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable history of all actions and changes
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refresh()}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Audit Log */}
      <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3">
              <Skeleton className="h-4 w-2/3 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No audit logs yet</p>
          </div>
        ) : (
          logs.map((entry) => {
            const Icon = actorIcons[entry.actor_type || ""] || Users;
            return (
              <div key={entry.id} className="p-3 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{entry.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {entry.actor_name || entry.actor_id}
                  </Badge>
                  {entry.entity_type && (
                    <span className="text-xs text-muted-foreground">
                      {entry.entity_type}/{entry.entity_id}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Memory Panel - AI Session Memory
// ============================================================================

const MEMORY_ICONS: Record<string, React.ElementType> = {
  preference: Users,
  decision: CheckCircle,
  commitment: Target,
  assumption: AlertTriangle,
  strategy: Lightbulb,
  learning: BookOpen,
};

export function MemoryPanelEnhanced({ entityType, entityId }: PanelProps): React.ReactElement {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const { sessions, isLoading: sessionsLoading, refresh: refreshSessions } = useIQSessions();
  const {
    memories,
    isLoading: memoriesLoading,
    refresh: refreshMemories,
  } = useMemories(selectedType);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Memory Bank
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          AI session summaries and consolidated memory
        </p>
      </div>

      {/* Memory Type Filter */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selectedType === undefined ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType(undefined)}
        >
          All
        </Button>
        {Object.keys(MEMORY_ICONS).map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="capitalize"
          >
            {type}
          </Button>
        ))}
      </div>

      {/* Memory Objects */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Memory Objects</p>
          <Button variant="ghost" size="sm" onClick={() => refreshMemories()}>
            <RefreshCw className={`h-3 w-3 ${memoriesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
          {memoriesLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3">
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))
          ) : memories.filter((m) => m.status === "active").length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No active memories</p>
            </div>
          ) : (
            memories
              .filter((m) => m.status === "active")
              .map((memory) => {
                const Icon = MEMORY_ICONS[memory.type] || Brain;
                return (
                  <div key={memory.id} className="p-3 hover:bg-muted/50">
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {memory.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {memory.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-sm">{memory.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Recent Sessions</p>
          <Button variant="ghost" size="sm" onClick={() => refreshSessions()}>
            <RefreshCw className={`h-3 w-3 ${sessionsLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="border rounded-lg divide-y max-h-[150px] overflow-y-auto">
          {sessionsLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-3">
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))
            : sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-3 hover:bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{session.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {session.created_at || session.started_at
                        ? new Date(
                            session.created_at || session.started_at || ""
                          ).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {session.topic || ""}
                    </Badge>
                    {(session.decisions ?? []).length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {(session.decisions ?? []).length} decisions
                      </span>
                    )}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}

// Import new L2 panels
import { ContextPanel } from "@/components/l2/cognitive/panels/context-panel";
import { ThinkPanel } from "./think-panel";
import { PolicyPanel } from "./policy-panel";
import { CorrectRedoPanel } from "./correct-redo-panel";
import { WorkflowsPanel } from "./workflows-panel";
import { ProactiveTwinPanel } from "./proactive-twin-panel";

// Import Cognitive Brain panels (from Constitution v1)
import { DecisionMemoryPanel } from "./decision-memory-panel";
import { TrustDashboardPanel } from "./trust-dashboard-panel";
import { SimulationPanel } from "./simulation-panel";
import { DriftDetectionPanel } from "./drift-detection-panel";
import { TriageInboxPanel } from "./triage-inbox-panel";

// Export all enhanced panels
export {
  // Core L2 panels (enhanced)
  SpinePanelEnhanced as SpinePanel,
  KnowledgePanelEnhanced as KnowledgePanel,
  SignalsPanelEnhanced as SignalsPanel,
  EvidencePanelEnhanced as EvidencePanel,
  AuditPanelEnhanced as AuditPanel,
  MemoryPanelEnhanced as MemoryPanel,
  // New L2 panels from spec
  ContextPanel,
  ThinkPanel,
  PolicyPanel,
  CorrectRedoPanel,
  WorkflowsPanel,
  ProactiveTwinPanel,
  // Cognitive Brain panels (Constitution v1)
  DecisionMemoryPanel,
  TrustDashboardPanel,
  SimulationPanel,
  DriftDetectionPanel,
  // Flow C: Triage Inbox
  TriageInboxPanel,
};
