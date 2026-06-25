"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Escalation {
  id: string
  title: string
  severity: string
  opened_at: string
  status: string
  tasks_done: number
  tasks_total: number
}

export default function WarRoomPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchEscalations()
  }, [])

  async function fetchEscalations() {
    const { data, error } = await supabase
      .from("tam_escalations")
      .select("*")
      .eq("status", "Open")
      .order("opened_at", { ascending: false })

    if (!error && data) {
      setEscalations(data)
    }
    setLoading(false)
  }

  const severityColors = {
    Critical: "bg-red-100 text-red-900",
    High: "bg-orange-100 text-orange-900",
    Medium: "bg-yellow-100 text-yellow-900",
    Low: "bg-blue-100 text-blue-900",
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-8 w-8" />
          War Room
        </h1>
        <p className="text-foreground/60 mt-2">Active escalations and critical issues</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading escalations...</CardContent>
          </Card>
        ) : escalations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">No active escalations</CardContent>
          </Card>
        ) : (
          escalations.map((escalation) => (
            <Card key={escalation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{escalation.title}</CardTitle>
                  <Badge className={`${severityColors[escalation.severity as keyof typeof severityColors] || ""}`}>
                    {escalation.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-foreground/60">Opened</p>
                    <p className="text-sm font-medium">{new Date(escalation.opened_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Status</p>
                    <p className="text-sm font-medium">{escalation.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-foreground/60">Progress</p>
                    <p className="text-sm font-medium">
                      {escalation.tasks_done}/{escalation.tasks_total}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 transition-all"
                    style={{
                      width: `${escalation.tasks_total > 0 ? (escalation.tasks_done / escalation.tasks_total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
