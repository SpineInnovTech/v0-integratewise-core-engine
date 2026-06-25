"use client";

/**
 * Memory Insights Component - Consent-based Integration
 * 
 * AI-powered memory extraction for tasks, overdue items, and insights
 * Fetches from "History" search memory when enabled
 * Requires 'integrations.memory.read' capability
 */

import { useState } from "react";

interface MemoryItem {
  id: string;
  type: "overdue" | "task" | "insight" | "reminder";
  content: string;
  priority?: "high" | "medium" | "low";
  date?: string;
}

export default function MemoryInsights() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<MemoryItem[]>([]);

  const enableMemory = async () => {
    setIsLoading(true);
    try {
      // Mock: In production, this would call Memory Search API
      // const response = await fetch('/api/memory/search', {
      //   method: 'POST',
      //   body: JSON.stringify({ query: 'History', limit: 20 })
      // });
      // const data = await response.json();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock memory items
      const mockItems: MemoryItem[] = [
        {
          id: "1",
          type: "overdue",
          content: "Respond to vendor proposal from Dec 15",
          priority: "high",
          date: "2025-12-15",
        },
        {
          id: "2",
          type: "task",
          content: "Draft Q1 2026 marketing plan",
          priority: "medium",
          date: "2025-12-22",
        },
        {
          id: "3",
          type: "insight",
          content: "Normalize leads by industry domain for better segmentation",
          priority: "medium",
        },
        {
          id: "4",
          type: "reminder",
          content: "Follow up with client about contract renewal",
          priority: "high",
          date: "2025-12-20",
        },
        {
          id: "5",
          type: "task",
          content: "Review and approve expense reports",
          priority: "low",
          date: "2025-12-21",
        },
        {
          id: "6",
          type: "insight",
          content: "Consider automating weekly status report generation",
          priority: "low",
        },
      ];

      setItems(mockItems);
      setIsEnabled(true);
    } catch (error) {
      console.error("Memory insights failed:", error);
      alert("Failed to enable memory insights. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const disable = () => {
    setIsEnabled(false);
    setItems([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "overdue": return "🚨";
      case "task": return "✅";
      case "insight": return "💡";
      case "reminder": return "⏰";
      default: return "📌";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "overdue": return "border-l-red-600 bg-red-50 dark:bg-red-950/20";
      case "task": return "border-l-blue-600 bg-blue-50 dark:bg-blue-950/20";
      case "insight": return "border-l-purple-600 bg-purple-50 dark:bg-purple-950/20";
      case "reminder": return "border-l-yellow-600 bg-yellow-50 dark:bg-yellow-950/20";
      default: return "border-l-gray-600 bg-gray-50 dark:bg-gray-950/20";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  if (!isEnabled) {
    return (
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Memory Insights</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered task and insight extraction
            </p>
          </div>
          <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-800 rounded">
            Disabled
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Track overdue items across all sources</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Generate action items from conversations</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Surface strategic insights from your data</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Consent-based, on-demand processing</span>
          </div>
        </div>

        <button
          onClick={enableMemory}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white rounded-md px-4 py-3 text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Enabling Memory...</span>
            </span>
          ) : (
            "Enable Memory Insights"
          )}
        </button>

        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded text-xs text-muted-foreground">
          <strong>Privacy:</strong> Memory insights are generated on-demand. 
          Your data is processed securely and you can disable this at any time.
        </div>
      </div>
    );
  }

  // Group items by type
  const overdueItems = items.filter(i => i.type === "overdue");
  const taskItems = items.filter(i => i.type === "task");
  const insightItems = items.filter(i => i.type === "insight");
  const reminderItems = items.filter(i => i.type === "reminder");

  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Memory Insights</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {items.length} item{items.length !== 1 ? "s" : ""} from your memory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
            Enabled
          </span>
          <button
            onClick={disable}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Disable
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Overdue Items */}
        {overdueItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-red-600">
              Overdue ({overdueItems.length})
            </h3>
            <div className="space-y-2">
              {overdueItems.map(item => (
                <div key={item.id} className={`border-l-2 rounded-r p-3 ${getTypeColor(item.type)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm">{item.content}</p>
                        {item.date && (
                          <p className="text-xs text-muted-foreground mt-1">Due: {item.date}</p>
                        )}
                      </div>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        {taskItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-blue-600">
              Tasks ({taskItems.length})
            </h3>
            <div className="space-y-2">
              {taskItems.map(item => (
                <div key={item.id} className={`border-l-2 rounded-r p-3 ${getTypeColor(item.type)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm">{item.content}</p>
                        {item.date && (
                          <p className="text-xs text-muted-foreground mt-1">Due: {item.date}</p>
                        )}
                      </div>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reminders */}
        {reminderItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-yellow-600">
              Reminders ({reminderItems.length})
            </h3>
            <div className="space-y-2">
              {reminderItems.map(item => (
                <div key={item.id} className={`border-l-2 rounded-r p-3 ${getTypeColor(item.type)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm">{item.content}</p>
                        {item.date && (
                          <p className="text-xs text-muted-foreground mt-1">Date: {item.date}</p>
                        )}
                      </div>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {insightItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-purple-600">
              Insights ({insightItems.length})
            </h3>
            <div className="space-y-2">
              {insightItems.map(item => (
                <div key={item.id} className={`border-l-2 rounded-r p-3 ${getTypeColor(item.type)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-lg">{getTypeIcon(item.type)}</span>
                      <div className="flex-1">
                        <p className="text-sm">{item.content}</p>
                      </div>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => alert("Refreshing memory insights...")}
        className="mt-4 w-full text-sm text-purple-600 hover:underline"
      >
        Refresh Insights
      </button>
    </div>
  );
}
