"use client";

/**
 * Tasks Page - Zero Dependency View
 * 
 * Client-only task management with sample data
 * Shows overdue and upcoming tasks without server dependencies
 */

import { useState } from "react";

interface Task {
  id: string;
  title: string;
  due: string;
  status: "overdue" | "pending" | "completed";
  priority?: "high" | "medium" | "low";
}

const SAMPLE_TASKS: Task[] = [
  { 
    id: "t1", 
    title: "Review onboarding copy", 
    due: "2025-12-20", 
    status: "overdue",
    priority: "high"
  },
  { 
    id: "t2", 
    title: "Plan launch checklist", 
    due: "2025-12-22", 
    status: "pending",
    priority: "medium"
  },
  { 
    id: "t3", 
    title: "Update product documentation", 
    due: "2025-12-25", 
    status: "pending",
    priority: "low"
  },
  { 
    id: "t4", 
    title: "Prepare Q1 roadmap", 
    due: "2026-01-05", 
    status: "pending",
    priority: "medium"
  },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [filter, setFilter] = useState<"all" | "overdue" | "pending">("all");

  const overdueTasks = tasks.filter(t => t.status === "overdue");
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const displayTasks = filter === "all" 
    ? tasks 
    : filter === "overdue" 
    ? overdueTasks 
    : pendingTasks;

  const toggleTaskStatus = (id: string) => {
    setTasks(tasks.map(t => 
      t.id === id 
        ? { ...t, status: t.status === "completed" ? "pending" : "completed" as const }
        : t
    ));
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 dark:bg-red-950";
      case "medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950";
      case "low": return "text-green-600 bg-green-50 dark:bg-green-950";
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-950";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Manage your tasks and track deadlines. Connect Calendar for auto-sync.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          <div className="text-sm text-muted-foreground">Overdue</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-blue-600">{pendingTasks.length}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "all" 
              ? "border-black dark:border-white text-black dark:text-white" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "overdue" 
              ? "border-red-600 text-red-600" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overdue ({overdueTasks.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === "pending" 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending ({pendingTasks.length})
        </button>
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <section className="border-l-4 border-red-600 rounded-r-lg bg-red-50 dark:bg-red-950/20 p-4">
          <h2 className="text-lg font-semibold text-red-600 mb-3">Overdue Tasks</h2>
          <ul className="space-y-2">
            {overdueTasks.map(task => (
              <li key={task.id} className="flex items-center gap-3 p-2 bg-white dark:bg-background rounded">
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => toggleTaskStatus(task.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-xs text-muted-foreground">Due: {task.due}</div>
                </div>
                {task.priority && (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Upcoming/Pending Tasks */}
      <section className="border rounded-lg p-4 bg-card">
        <h2 className="text-lg font-semibold mb-3">
          {filter === "all" ? "All Tasks" : filter === "pending" ? "Pending Tasks" : "Filtered Tasks"}
        </h2>
        {displayTasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tasks to display.</p>
        ) : (
          <ul className="space-y-2">
            {displayTasks.map(task => (
              <li key={task.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded">
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => toggleTaskStatus(task.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-muted-foreground">Due: {task.due}</div>
                </div>
                {task.priority && (
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Info Banner */}
      <div className="border-l-4 border-blue-600 rounded-r-lg bg-blue-50 dark:bg-blue-950/20 p-4">
        <h3 className="font-semibold text-sm mb-1">Enable Calendar Integration</h3>
        <p className="text-sm text-muted-foreground">
          Connect your calendar to automatically sync tasks from meetings and events.
        </p>
      </div>
    </div>
  );
}
