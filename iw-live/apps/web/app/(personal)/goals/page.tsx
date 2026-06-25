"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Target } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Goal {
  id: string
  title: string
  description: string
  target_value: number
  current_value: number
  target_date: string
  status: string
  progress: number
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: "", target_value: 0, target_date: "" })

  const supabase = createClient()

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    const { data, error } = await supabase.from("goals").select("*").order("target_date", { ascending: true })

    if (!error && data) {
      const goalsWithProgress = data.map((g: any) => ({
        ...g,
        progress: g.target_value > 0 ? Math.min(100, (g.current_value / g.target_value) * 100) : 0,
      }))
      setGoals(goalsWithProgress)
    }
    setLoading(false)
  }

  async function createGoal() {
    if (!newGoal.title || !newGoal.target_value) return

    const { error } = await supabase.from("goals").insert([{ ...newGoal, status: "Active" }])

    if (!error) {
      setNewGoal({ title: "", target_value: 0, target_date: "" })
      setShowForm(false)
      fetchGoals()
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-8 w-8" />
            Your Goals
          </h1>
          <p className="text-foreground/60 mt-2">Track your objectives and progress</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Goal Title</Label>
              <Input
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="e.g., Launch product feature"
              />
            </div>
            <div>
              <Label>Target Value</Label>
              <Input
                type="number"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                placeholder="100"
              />
            </div>
            <div>
              <Label>Target Date</Label>
              <Input
                type="date"
                value={newGoal.target_date}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createGoal}>Create Goal</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading goals...</CardContent>
          </Card>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">
              No goals yet. Create one to get started!
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{goal.title}</span>
                  <span className="text-sm font-normal text-foreground/60">{Math.round(goal.progress)}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Progress</span>
                  <span className="font-medium">
                    {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
                <div className="text-xs text-foreground/60">
                  Target: {new Date(goal.target_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
