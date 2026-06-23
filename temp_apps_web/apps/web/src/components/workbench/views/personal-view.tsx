"use client";

/**
 * Personal View — Individual Space
 *
 * User-scoped memory and tasks. Independent of department/industry.
 * Shows: tasks, calendar, notes, personal AI sessions, decisions, bookmarks.
 * Built from the same 8 primitives.
 */

import { useMemo } from "react";
import { useSpineEntities } from "@/hooks/use-workspace-entities";
import {
  MetricTile,
  EntityCard,
  TimelineStream,
  OperationalCanvas,
} from "@/components/workbench/primitives";
import { CheckCircle, Calendar, BookOpen, Brain } from "lucide-react";

export function PersonalView() {
  // Personal tasks
  const { data: tasks, isLoading: tasksLoading } = useSpineEntities("task", { limit: 5 });

  // Personal notes (using document entity type)
  const { data: notes, isLoading: notesLoading } = useSpineEntities("document", { limit: 5 });

  const isLoading = tasksLoading || notesLoading;

  const taskCards = useMemo(
    () =>
      tasks.map((t: any) => ({
        id: t.id,
        name: t.title || "Untitled Task",
        entityType: "Task",
        status: t.status || "open",
        fields: [
          {
            label: "Due",
            value: t.due_date ? new Date(t.due_date).toLocaleDateString() : "No due date",
          },
          { label: "Priority", value: t.priority || "normal" },
        ],
      })),
    [tasks]
  );

  const timelineEvents = useMemo(
    () => [
      {
        id: "p1",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: "ingest" as const,
        title: "AI session saved",
        description: "Brainstorming session on Q3 strategy saved to Knowledge Base.",
        source: "Twin Chat",
      },
      {
        id: "p2",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        type: "curate" as const,
        title: "Note created",
        description: "Personal note: 'IntegrateWise pricing strategy v3'.",
        actor: "You",
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Personal Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="My Tasks"
          value={tasks.length}
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <MetricTile label="My Notes" value={notes.length} icon={<BookOpen className="w-4 h-4" />} />
        <MetricTile label="AI Sessions" value={12} icon={<Brain className="w-4 h-4" />} />
        <MetricTile
          label="Calendar"
          value={3}
          formatted="3 events today"
          icon={<Calendar className="w-4 h-4" />}
        />
      </div>

      <OperationalCanvas
        title="Personal Workspace"
        subtitle="Your individual operational memory"
        sections={[
          {
            id: "tasks",
            label: "My Tasks",
            width: "half",
            component: (
              <div className="flex flex-col gap-3">
                {taskCards.map((card) => (
                  <EntityCard
                    key={card.id}
                    id={card.id}
                    name={card.name}
                    entityType={card.entityType}
                    status={card.status}
                    fields={card.fields}
                    actions={[
                      { label: "Complete", onClick: () => console.log("Complete", card.id) },
                    ]}
                  />
                ))}
                {taskCards.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No tasks assigned. Create your first task.
                  </div>
                )}
              </div>
            ),
          },
          {
            id: "timeline",
            label: "My Activity",
            width: "half",
            component: <TimelineStream events={timelineEvents} maxItems={5} />,
          },
        ]}
      />
    </div>
  );
}
