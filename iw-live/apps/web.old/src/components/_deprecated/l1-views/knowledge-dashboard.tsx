"use client";

import { useState } from "react";
import {
  DashboardLayout,
  Section,
  StandardEmptyState,
} from "@/components/common/layouts/page-layouts";
import {
  BookOpen,
  FileText,
  Lightbulb,
  Layout,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  Tag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useEntities } from "@/components/core/providers/spine-context-provider";
import { SpineEntity } from "@/lib/spine";

interface KnowledgeEntry {
  id: string;
  category: string; // content type: note, framework, etc.
  title: string;
  description?: string;
  content_markdown: string;
  tags: string[];
  source_type?: string;
  usage_count: number;
  last_used_at?: string;
  created_at: string;
}

interface BrainstormSession {
  id: string;
  title: string;
  description?: string;
  status: string;
  session_date: string;
  brainstorm_insights?: Array<{ id: string; insight_text: string }>;
}

interface KnowledgeDashboardProps {
  entries: KnowledgeEntry[];
  sessions: BrainstormSession[];
}

const CATEGORY_CONFIG: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  note: { icon: FileText, color: "bg-blue-50 text-blue-600", label: "Notes" },
  framework: { icon: Layout, color: "bg-purple-50 text-purple-600", label: "Frameworks" },
  template: { icon: BookOpen, color: "bg-green-50 text-green-600", label: "Templates" },
  reference: { icon: Lightbulb, color: "bg-amber-50 text-amber-600", label: "References" },
  playbook: { icon: Sparkles, color: "bg-pink-50 text-pink-600", label: "Playbooks" },
};

export function KnowledgeDashboard({
  entries: initialEntries,
  sessions: initialSessions,
}: KnowledgeDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"entries" | "sessions">("entries");

  // Use Universal Spine Hooks for context-aware data
  const { entities: documentEntities, isLoading: loadingDocs } =
    useEntities<SpineEntity>("document");

  // Map Spine Documents to Knowledge Entries
  const liveEntries: KnowledgeEntry[] =
    documentEntities.length > 0
      ? documentEntities.map((doc) => ({
          id: doc.id,
          category: (doc.data as any).type || "note",
          title: (doc.data as any).title || "Untitled",
          description: (doc.data as any).description,
          content_markdown: (doc.data as any).content_text || "",
          tags: (doc.data as any).labels || [],
          source_type: (doc.data as any).source_type,
          usage_count: (doc.data as any).usage_count || 0,
          created_at: doc.created_at,
          last_used_at: doc.updated_at,
        }))
      : initialEntries;

  const displayEntries =
    documentEntities.length > 0 ? liveEntries : loadingDocs ? initialEntries : [];

  // Filter logic
  const filteredEntries = displayEntries.filter((entry) => {
    const matchesSearch =
      !search ||
      entry.title.toLowerCase().includes(search.toLowerCase()) ||
      entry.description?.toLowerCase().includes(search.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !selectedCategory || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate category counts
  const categoryCounts = displayEntries.reduce(
    (acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <DashboardLayout
      title="Knowledge Hub"
      description="Notes, frameworks, templates, playbooks, and AI-generated insights."
      stageId="KNOWLEDGE-014"
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2d5a3d] text-white text-sm font-medium rounded-lg hover:bg-[#1a3a2a] transition-colors">
          <Plus className="w-4 h-4" />
          Add Knowledge
        </button>
      }
    >
      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a3d]/20 focus:border-[#2d5a3d]"
          />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`bg-white rounded-xl border p-4 text-left transition-all ${
            selectedCategory === null
              ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <BookOpen className="w-8 h-8 text-gray-400 mb-2" />
          <p className="font-semibold text-gray-900">All</p>
          <p className="text-sm text-gray-500">{displayEntries.length} items</p>
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`bg-white rounded-xl border p-4 text-left transition-all ${
                selectedCategory === key
                  ? "border-[#2d5a3d] ring-2 ring-[#2d5a3d]/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center mb-2`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p className="font-semibold text-gray-900">{config.label}</p>
              <p className="text-sm text-gray-500">{categoryCounts[key] || 0} items</p>
            </button>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: "entries", label: "Knowledge Entries", icon: BookOpen },
          { key: "sessions", label: "AI Sessions", icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === tab.key
                ? "border-[#2d5a3d] text-[#2d5a3d]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Knowledge Entries Tab */}
      {selectedTab === "entries" && (
        <Section
          title={
            selectedCategory
              ? CATEGORY_CONFIG[selectedCategory]?.label || "Entries"
              : "All Knowledge"
          }
        >
          {loadingDocs && displayEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading universal knowledge...</div>
          ) : filteredEntries.length > 0 ? (
            <div className="space-y-3">
              {filteredEntries.map((entry) => {
                const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.note;
                const Icon = config.icon;
                return (
                  <div
                    key={entry.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#2d5a3d] transition-colors">
                            {entry.title}
                          </h4>
                          <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {entry.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {entry.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {entry.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {entry.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                              {entry.tags.length > 3 && <span>+{entry.tags.length - 3}</span>}
                            </div>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                          {entry.usage_count > 0 && <span>{entry.usage_count} uses</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <StandardEmptyState
              icon={<BookOpen className="w-12 h-12 text-gray-300" />}
              title="No Knowledge Entries"
              description={
                search
                  ? "No entries match your search criteria."
                  : "Add your first knowledge entry to get started."
              }
            />
          )}
        </Section>
      )}

      {/* AI Sessions Tab */}
      {selectedTab === "sessions" && (
        <Section title="Brainstorm Sessions">
          {initialSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initialSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#2d5a3d] transition-colors">
                    {session.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {session.description || "No description provided."}
                  </p>
                  {session.brainstorm_insights && session.brainstorm_insights.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-gray-500">
                        {session.brainstorm_insights.length} insights generated
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.session_date).toLocaleDateString()}
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#2d5a3d]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StandardEmptyState
              icon={<MessageSquare className="w-12 h-12 text-gray-300" />}
              title="No AI Sessions"
              description="Start a brainstorm session to generate insights with AI."
            />
          )}
        </Section>
      )}
    </DashboardLayout>
  );
}
