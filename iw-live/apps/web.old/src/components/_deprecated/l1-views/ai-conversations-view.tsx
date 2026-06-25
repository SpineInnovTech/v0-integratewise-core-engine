/**
 * AI Conversations View - Full-featured chat history browser
 * Supports search, filtering, memory extraction, and MCP integration
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Clock,
  MessageSquare,
  Search,
  Filter,
  Play,
  CheckCircle,
  XCircle,
  Archive,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Calendar,
  User,
  Bot,
  ChevronRight,
  Lightbulb,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface Conversation {
  id: string;
  title: string;
  provider: string;
  status: "active" | "archived" | "deleted";
  message_count: number;
  token_count: number;
  summary?: string;
  topics: string[];
  context_type?: string;
  context_id?: string;
  started_at: string;
  ended_at?: string;
  expires_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: any[];
  tool_results?: any[];
  tokens_used: number;
  created_at: string;
}

interface Memory {
  id: string;
  memory_type: string;
  content: string;
  entity_type?: string;
  entity_id?: string;
  confidence: number;
  is_confirmed: boolean;
  created_at: string;
}

interface KPI {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

// ============================================================================
// KPI BAND COMPONENT
// ============================================================================

function KPIBand({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            {kpi.icon}
            <span>{kpi.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
          {kpi.change && (
            <div
              className={cn(
                "text-xs mt-1",
                kpi.changeType === "positive"
                  ? "text-green-600"
                  : kpi.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-500"
              )}
            >
              {kpi.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { bg: "bg-blue-100", text: "text-blue-700", icon: Play },
    archived: { bg: "bg-gray-100", text: "text-gray-700", icon: Archive },
    completed: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
    deleted: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
  }[status] || { bg: "bg-gray-100", text: "text-gray-700", icon: Clock };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        config.bg,
        config.text
      )}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

// ============================================================================
// CONVERSATION CARD
// ============================================================================

function ConversationCard({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const daysUntilExpiry = Math.ceil(
    (new Date(conversation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <button
      type="button"
      className={cn(
        "w-full text-left bg-white rounded-xl border p-4 hover:shadow-sm transition-all",
        isSelected ? "border-[#2d5a3d] ring-1 ring-[#2d5a3d]/20" : "border-gray-200"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "p-2 rounded-lg shrink-0",
              conversation.provider === "chatgpt"
                ? "bg-green-50"
                : conversation.provider === "claude"
                  ? "bg-orange-50"
                  : conversation.provider === "system"
                    ? "bg-purple-50"
                    : "bg-gray-50"
            )}
          >
            <Brain
              className={cn(
                "w-4 h-4",
                conversation.provider === "chatgpt"
                  ? "text-green-600"
                  : conversation.provider === "claude"
                    ? "text-orange-600"
                    : conversation.provider === "system"
                      ? "text-purple-600"
                      : "text-gray-600"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {conversation.title || "Untitled Conversation"}
            </div>
            {conversation.summary && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{conversation.summary}</div>
            )}
          </div>
        </div>
        <StatusBadge status={conversation.status} />
      </div>

      {/* Topics */}
      {conversation.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {conversation.topics.slice(0, 3).map((topic, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
              {topic}
            </span>
          ))}
          {conversation.topics.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{conversation.topics.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Messages
          </div>
          <div className="text-sm font-semibold text-gray-900">{conversation.message_count}</div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Tokens
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {conversation.token_count > 1000
              ? `${(conversation.token_count / 1000).toFixed(1)}K`
              : conversation.token_count}
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-2">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            Expires
          </div>
          <div
            className={cn(
              "text-sm font-semibold",
              daysUntilExpiry <= 7 ? "text-orange-600" : "text-gray-900"
            )}
          >
            {daysUntilExpiry}d
          </div>
        </div>
      </div>

      {/* Context */}
      {conversation.context_type && (
        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          <span>Context: {conversation.context_type}</span>
          {conversation.context_id && (
            <span className="text-gray-400">#{conversation.context_id.slice(0, 8)}</span>
          )}
        </div>
      )}
    </button>
  );
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isTool = message.role === "tool";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            isSystem ? "bg-gray-100" : isTool ? "bg-purple-100" : "bg-green-100"
          )}
        >
          {isSystem ? (
            <Clock className="w-4 h-4 text-gray-600" />
          ) : isTool ? (
            <Sparkles className="w-4 h-4 text-purple-600" />
          ) : (
            <Bot className="w-4 h-4 text-green-600" />
          )}
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2",
          isUser
            ? "bg-[#2d5a3d] text-white"
            : isSystem
              ? "bg-gray-100 text-gray-600 text-sm italic"
              : isTool
                ? "bg-purple-50 text-purple-900 border border-purple-200"
                : "bg-gray-100 text-gray-900"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-purple-200">
            <div className="text-xs text-purple-600 font-medium mb-1">Tool Calls:</div>
            {message.tool_calls.map((call, i) => (
              <div key={i} className="text-xs text-purple-700 font-mono">
                {call.tool}({JSON.stringify(call.arguments).slice(0, 50)}...)
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] mt-1 opacity-60">
          {new Date(message.created_at).toLocaleTimeString()}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MEMORY CARD
// ============================================================================

function MemoryCard({
  memory,
  onConfirm,
  onDelete,
}: {
  memory: Memory;
  onConfirm?: () => void;
  onDelete?: () => void;
}) {
  const typeConfig = {
    decision: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    preference: { icon: User, color: "text-blue-600", bg: "bg-blue-50" },
    insight: { icon: Lightbulb, color: "text-yellow-600", bg: "bg-yellow-50" },
    action: { icon: Play, color: "text-purple-600", bg: "bg-purple-50" },
    rule: { icon: Tag, color: "text-red-600", bg: "bg-red-50" },
    fact: { icon: Brain, color: "text-gray-600", bg: "bg-gray-50" },
  }[memory.memory_type] || { icon: Brain, color: "text-gray-600", bg: "bg-gray-50" };

  const Icon = typeConfig.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", typeConfig.bg)}>
          <Icon className={cn("w-4 h-4", typeConfig.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase">
              {memory.memory_type}
            </span>
            {memory.is_confirmed && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Confirmed
              </span>
            )}
          </div>
          <p className="text-sm text-gray-900 mt-1">{memory.content}</p>

          {memory.entity_type && (
            <div className="text-xs text-gray-500 mt-2">
              Related: {memory.entity_type} {memory.entity_id && `#${memory.entity_id.slice(0, 8)}`}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-400">
              Confidence: {Math.round(memory.confidence * 100)}%
            </div>
            <div className="flex items-center gap-2">
              {!memory.is_confirmed && onConfirm && (
                <button onClick={onConfirm} className="text-xs text-green-600 hover:text-green-700">
                  Confirm
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="text-xs text-red-600 hover:text-red-700">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIConversationsView() {
  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showMemories, setShowMemories] = useState(false);

  // KPIs
  const kpis: KPI[] = [
    {
      label: "Total Conversations",
      value: conversations.length,
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      label: "Active",
      value: conversations.filter((c) => c.status === "active").length,
      icon: <Play className="w-4 h-4" />,
    },
    {
      label: "Total Messages",
      value: conversations.reduce((sum, c) => sum + c.message_count, 0).toLocaleString(),
      icon: <Brain className="w-4 h-4" />,
    },
    {
      label: "Memories Extracted",
      value: memories.length,
      icon: <Lightbulb className="w-4 h-4" />,
    },
  ];

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/ai/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterStatus]);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }, []);

  // Load memories
  const loadMemories = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/memories");
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
      }
    } catch (error) {
      console.error("Failed to load memories:", error);
    }
  }, []);

  // Effects
  useEffect(() => {
    loadConversations();
    loadMemories();
  }, [loadConversations, loadMemories]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation, loadMessages]);

  // Handlers
  const handleArchive = async (id: string) => {
    try {
      await fetch(`/api/ai/conversations/${id}/archive`, { method: "POST" });
      loadConversations();
    } catch (error) {
      console.error("Failed to archive:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      loadConversations();
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleConfirmMemory = async (memoryId: string) => {
    try {
      await fetch(`/api/ai/memories/${memoryId}/confirm`, { method: "POST" });
      loadMemories();
    } catch (error) {
      console.error("Failed to confirm memory:", error);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      await fetch(`/api/ai/memories/${memoryId}`, { method: "DELETE" });
      loadMemories();
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
  };

  // Filtered conversations
  const filteredConversations = conversations.filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(query) ||
        c.summary?.toLowerCase().includes(query) ||
        c.topics?.some((t) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Conversations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Browse and manage your AI conversation history (30-day retention)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMemories(!showMemories)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                showMemories
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              <Lightbulb className="w-4 h-4" />
              Memories ({memories.length})
            </button>
            <button
              onClick={() => loadConversations()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Band */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <KPIBand kpis={kpis} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Conversation List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Search & Filter */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No conversations found</p>
                <p className="text-sm text-gray-400 mt-1">Start chatting to see history here</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversation?.id === conv.id}
                  onClick={() => setSelectedConversation(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Conversation Detail / Memories */}
        <div className="flex-1 flex flex-col">
          {showMemories ? (
            // Memories Panel
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extracted Memories</h2>
              <p className="text-sm text-gray-500 mb-6">
                Key insights and information extracted from your conversations
              </p>
              <div className="space-y-3">
                {memories.length === 0 ? (
                  <div className="text-center py-12">
                    <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No memories extracted yet</p>
                  </div>
                ) : (
                  memories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      onConfirm={() => handleConfirmMemory(memory.id)}
                      onDelete={() => handleDeleteMemory(memory.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ) : selectedConversation ? (
            // Conversation Detail
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.title || "Untitled Conversation"}
                    </h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(selectedConversation.started_at).toLocaleString()}
                      </span>
                      <span>{selectedConversation.message_count} messages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleArchive(selectedConversation.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(selectedConversation.id)}
                      className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a conversation from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIConversationsView;
