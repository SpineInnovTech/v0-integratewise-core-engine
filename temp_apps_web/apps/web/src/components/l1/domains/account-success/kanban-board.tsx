/**
 * Kanban Board — Drag-and-drop task board for CSM tasks
 * Cherry-picked from Project Task Organizer, adapted for IntegrateWise
 */
import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Calendar, User, GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";
import { type CSMTask, getPriorityColor } from "./csm-data";

const ITEM_TYPE = "TASK";

type TaskStatus = CSMTask["status"];

interface TaskCardProps {
  task: CSMTask;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
}

function TaskCard({ task, onMove }: TaskCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const priorityColor = getPriorityColor(task.priority);

  return (
    <div
      ref={drag}
      className={cn("cursor-move transition-all hover:shadow-md", isDragging && "opacity-50")}
    >
      <Card className="border-l-4" style={{ borderLeftColor: priorityColor }}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight">{task.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0"
                  style={{ borderColor: priorityColor, color: priorityColor }}
                >
                  {task.priority}
                </Badge>
                {task.dueDays !== undefined && (
                  <span
                    className={cn(
                      "text-xs",
                      task.dueDays < 0
                        ? "text-iw-red"
                        : task.dueDays === 0
                          ? "text-iw-gold"
                          : "text-muted-foreground"
                    )}
                  >
                    {task.dueDays < 0
                      ? `${Math.abs(task.dueDays)}d overdue`
                      : task.dueDays === 0
                        ? "Today"
                        : `${task.dueDays}d left`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {task.assignee && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{task.assignee.name}</span>
                  </div>
                )}
                {task.accountName && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span className="truncate max-w-[80px]">{task.accountName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: CSMTask[];
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  count: number;
}

function KanbanColumn({ title, status, tasks, onMove, count }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: string; status: TaskStatus }) => {
      if (item.status !== status) {
        onMove(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const columnColors: Record<TaskStatus, string> = {
    todo: "bg-slate-100 dark:bg-slate-900",
    "in-progress": "bg-iw-slate/5 dark:bg-iw-slate/95/20",
    overdue: "bg-iw-gold/5 dark:bg-iw-gold/95/20",
    done: "bg-iw-forest/5 dark:bg-iw-forest/95/20",
  };

  return (
    <div
      ref={drop}
      className={cn(
        "flex flex-col rounded-lg p-3 min-w-[280px] flex-1 transition-colors",
        columnColors[status],
        isOver && "ring-2 ring-primary ring-inset"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold uppercase tracking-wide">{title}</h4>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>

      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} onMove={onMove} />)
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {status === "done"
              ? "No completed tasks"
              : status === "overdue"
                ? "No overdue tasks"
                : "Drop tasks here"}
          </div>
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: CSMTask[];
  onTaskMove?: (taskId: string, newStatus: TaskStatus) => void;
}

export function KanbanBoard({ tasks, onTaskMove }: KanbanBoardProps) {
  const [taskList, setTaskList] = useState<CSMTask[]>(tasks);

  const handleMove = (taskId: string, newStatus: TaskStatus) => {
    setTaskList((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    onTaskMove?.(taskId, newStatus);
  };

  const columns: { id: TaskStatus; title: string }[] = [
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "overdue", title: "Overdue" },
    { id: "done", title: "Done" },
  ];

  const counts = {
    todo: taskList.filter((t) => t.status === "todo").length,
    "in-progress": taskList.filter((t) => t.status === "in-progress").length,
    overdue: taskList.filter((t) => t.status === "overdue").length,
    done: taskList.filter((t) => t.status === "done").length,
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <KanbanColumn
          key={col.id}
          title={col.title}
          status={col.id}
          tasks={taskList.filter((t) => t.status === col.id)}
          onMove={handleMove}
          count={counts[col.id]}
        />
      ))}
    </div>
  );
}
