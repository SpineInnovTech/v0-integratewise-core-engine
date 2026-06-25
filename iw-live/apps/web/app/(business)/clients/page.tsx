"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Client {
  id: string
  name: string
  company: string
  email: string
  health_score: number
  total_revenue: number
  status: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const { data, error } = await supabase.from("clients").select("*").order("total_revenue", { ascending: false })

    if (!error && data) {
      setClients(data)
    }
    setLoading(false)
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-900"
    if (score >= 60) return "bg-yellow-100 text-yellow-900"
    return "bg-red-100 text-red-900"
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            Clients
          </h1>
          <p className="text-foreground/60 mt-2">Manage and track your client relationships</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Client
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">Loading clients...</CardContent>
          </Card>
        ) : clients.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-foreground/60">No clients yet</CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Company</th>
                  <th className="text-left py-3 px-4 font-semibold">Health</th>
                  <th className="text-left py-3 px-4 font-semibold">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{client.name}</td>
                    <td className="py-3 px-4 text-foreground/60">{client.company}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getHealthColor(client.health_score || 0)}`}
                      >
                        {client.health_score || 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4">${(client.total_revenue || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-900">{client.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
