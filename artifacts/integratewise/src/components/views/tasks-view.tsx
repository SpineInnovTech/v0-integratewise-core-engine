
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
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Tasks & Actions</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Manage and track your team's work</p>
        </div>
        <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 shadow-md font-semibold tracking-wide h-11 transition-all hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-light tracking-tight">Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="What needs to be done?"
                  className="bg-muted/30 focus:bg-background h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Add details, links, or context..."
                  className="bg-muted/30 focus:bg-background resize-none min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger className="bg-muted/30 focus:bg-background h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="bg-muted/30 focus:bg-background h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignee" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignee</Label>
                <Input
                  id="assignee"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  placeholder="Assign to someone..."
                  className="bg-muted/30 focus:bg-background h-11"
                />
              </div>
              <Button onClick={createTask} className="w-full rounded-full h-12 font-bold tracking-wide mt-2">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="board" className="space-y-8">
        <TabsList className="bg-secondary/50 p-1.5 rounded-xl border border-border/50">
          <TabsTrigger value="board" className="rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">Kanban Board</TabsTrigger>
          <TabsTrigger value="list" className="rounded-lg text-sm font-semibold tracking-wide uppercase px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* To Do Column */}
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="flex items-center justify-between mb-4 bg-card border border-border/50 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">To Do</h3>
                </div>
                <Badge variant="secondary" className="font-mono px-2 py-0.5 rounded-md bg-secondary/80 text-foreground font-bold">
                  {todoTasks.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                {!tasks ? (
                  <LoadingSkeleton />
                ) : (
                  todoTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="flex items-center justify-between mb-4 bg-card border border-border/50 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">In Progress</h3>
                </div>
                <Badge variant="secondary" className="font-mono px-2 py-0.5 rounded-md bg-secondary/80 text-foreground font-bold">
                  {inProgressTasks.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                {!tasks ? (
                  <LoadingSkeleton />
                ) : (
                  inProgressTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="flex flex-col h-[calc(100vh-280px)]">
              <div className="flex items-center justify-between mb-4 bg-card border border-border/50 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h3 className="font-bold text-foreground uppercase tracking-wider text-sm">Done</h3>
                </div>
                <Badge variant="secondary" className="font-mono px-2 py-0.5 rounded-md bg-secondary/80 text-foreground font-bold">
                  {doneTasks.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-10">
                {!tasks ? (
                  <LoadingSkeleton />
                ) : (
                  doneTasks.map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="focus-visible:outline-none">
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
            {!tasks ? (
              <div className="p-6">
                <LoadingSkeleton />
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {tasks.map((task: any) => (
                  <div key={task.id} className="p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={() => toggleTask(task.id, task.status)}
                        className="rounded h-5 w-5 border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="min-w-0 flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <p
                          className={cn(
                            "font-semibold text-[15px] truncate",
                            task.status === "done" ? "line-through text-muted-foreground opacity-70" : "text-foreground group-hover:text-primary transition-colors",
                          )}
                        >
                          {task.title}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none", priorityColors[task.priority as keyof typeof priorityColors])}
                          >
                            {task.priority}
                          </Badge>
                          {task.assignee && (
                            <span className="text-xs font-medium text-foreground bg-secondary/80 px-2 py-1 rounded-md flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {task.assignee}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs font-medium text-foreground bg-secondary/80 px-2 py-1 rounded-md flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
                          <DropdownMenuItem className="py-2 cursor-pointer font-medium">Edit Task</DropdownMenuItem>
                          <DropdownMenuItem className="py-2 cursor-pointer font-medium text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => deleteTask(task.id)}>
                            Delete Task
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    No tasks found. Create one to get started.
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
