"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar, User, Flag, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTasks } from "@/lib/hooks/use-data"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const priorityColors = {
  low: "bg-slate-500/10 text-slate-500",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-rose-500/10 text-rose-500",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TasksView() {
  const { data: tasks, mutate } = useTasks()
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    assignee: "",
    due_date: "",
  })

  const toggleTask = async (id: string, currentStatus: string) => {
    const supabase = createClient()
    const newStatus = currentStatus === "done" ? "todo" : "done"
    await supabase.from("tasks").update({ status: newStatus }).eq("id", id)
    mutate()
  }

  const deleteTask = async (id: string) => {
    const supabase = createClient()
    await supabase.from("tasks").delete().eq("id", id)
    mutate()
  }

  const createTask = async () => {
    if (!newTask.title.trim()) return
    const supabase = createClient()
    await supabase.from("tasks").insert({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: newTask.status,
      assignee: newTask.assignee || null,
      due_date: newTask.due_date || null,
    })
    setNewTask({ title: "", description: "", priority: "medium", status: "todo", assignee: "", due_date: "" })
    setNewTaskOpen(false)
    mutate()
  }

  const todoTasks = tasks?.filter((t: any) => t.status === "todo") || []
  const inProgressTasks = tasks?.filter((t: any) => t.status === "in_progress" || t.status === "in-progress") || []
  const doneTasks = tasks?.filter((t: any) => t.status === "done") || []

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="bg-card hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === "done"}
            onCheckedChange={() => toggleTask(task.id, task.status)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "font-medium",
                  task.status === "done" ? "line-through text-muted-foreground" : "text-card-foreground",
                )}
              >
                {task.title}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Move to...</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge
                variant="secondary"
                className={cn("text-xs", priorityColors[task.priority as keyof typeof priorityColors])}
              >
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
              {task.due_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
              {task.assignee && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignee}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks & Actions</h1>
          <p className="text-muted-foreground">Manage and track your team's work</p>
        </div>
        <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="Assignee name..."
                />
              </div>
              <Button onClick={createTask} className="w-full">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* To Do Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  To Do
                  <Badge variant="secondary" className="text-xs">
                    {todoTasks.length}
                  </Badge>
                </h3>
              </div>
              {!tasks ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-3">
                  {todoTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>

            {/* In Progress Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  In Progress
                  <Badge variant="secondary" className="text-xs">
                    {inProgressTasks.length}
                  </Badge>
                </h3>
              </div>
              {!tasks ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-3">
                  {inProgressTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>

            {/* Done Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  Done
                  <Badge variant="secondary" className="text-xs">
                    {doneTasks.length}
                  </Badge>
                </h3>
              </div>
              {!tasks ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-3">
                  {doneTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {!tasks ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
