import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/clerk-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, TrendingUp, AlertTriangle, DollarSign, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function TAMCommandCenterPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch TAM accounts
  const { data: accounts } = await supabase
    .from("tam_accounts")
    .select("*")
    .order("arr", { ascending: false })
    .limit(20)

  // Fetch escalations
  const { data: escalations } = await supabase
    .from("tam_escalations")
    .select("*, tam_accounts(name)")
    .eq("status", "Open")
    .order("severity", { ascending: false })
    .limit(10)

  // Calculate metrics
  const totalARR = (accounts || []).reduce((sum, a) => sum + (Number(a.arr) || 0), 0)
  const redAccounts = (accounts || []).filter((a) => a.rag_status === "Red").length
  const renewalsThisMonth = (accounts || []).filter((a) => {
    if (!a.renewal_date) return false
    const renewal = new Date(a.renewal_date)
    const now = new Date()
    return renewal.getMonth() === now.getMonth() && renewal.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">TAM Command Center</h1>
          <p className="text-muted-foreground mt-1">Monitor account health, renewals, and escalations</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total ARR" value={`$${(totalARR / 1000000).toFixed(2)}M`} icon={DollarSign} color="green" />
        <MetricCard title="Active Accounts" value={accounts?.length || 0} icon={Users} color="blue" />
        <MetricCard title="At Risk (Red)" value={redAccounts} icon={AlertTriangle} color="red" />
        <MetricCard title="Renewals This Month" value={renewalsThisMonth} icon={TrendingUp} color="purple" />
      </div>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="escalations">Escalations ({escalations?.length || 0})</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>TAM Accounts</CardTitle>
              <CardDescription>All accounts in your territory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Account</th>
                      <th className="pb-3 font-medium">Segment</th>
                      <th className="pb-3 font-medium">RAG</th>
                      <th className="pb-3 font-medium">ARR</th>
                      <th className="pb-3 font-medium">Technical</th>
                      <th className="pb-3 font-medium">Adoption</th>
                      <th className="pb-3 font-medium">Renewal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(accounts || []).map((account) => (
                      <tr key={account.id} className="border-b last:border-0">
                        <td className="py-4 font-medium">{account.name}</td>
                        <td className="py-4">
                          <Badge variant="outline">{account.segment || "SMB"}</Badge>
                        </td>
                        <td className="py-4">
                          <RAGBadge status={account.rag_status} />
                        </td>
                        <td className="py-4 font-medium">${Number(account.arr || 0).toLocaleString()}</td>
                        <td className="py-4">
                          <ScoreBadge score={account.technical_score} />
                        </td>
                        <td className="py-4">
                          <ScoreBadge score={account.adoption_score} />
                        </td>
                        <td className="py-4 text-sm">
                          {account.renewal_date ? new Date(account.renewal_date).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                    {(!accounts || accounts.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          No TAM accounts found. Import your account data to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Escalations</CardTitle>
              <CardDescription>Active issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(escalations || []).map((esc) => (
                <div key={esc.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={esc.severity} />
                      <span className="font-medium">{esc.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(esc.tam_accounts as any)?.name || "Unknown Account"}
                    </p>
                    {esc.description && <p className="text-sm mt-2">{esc.description}</p>}
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">
                      {esc.tasks_done}/{esc.tasks_total} tasks
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Opened {new Date(esc.opened_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!escalations || escalations.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No open escalations. Great work!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Renewals</CardTitle>
              <CardDescription>Accounts with renewals in the next 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(accounts || [])
                  .filter((a) => {
                    if (!a.renewal_date) return false
                    const renewal = new Date(a.renewal_date)
                    const now = new Date()
                    const diff = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    return diff > 0 && diff <= 90
                  })
                  .sort((a, b) => new Date(a.renewal_date!).getTime() - new Date(b.renewal_date!).getTime())
                  .map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(account.renewal_revenue || account.arr || 0).toLocaleString()} ARR
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{new Date(account.renewal_date!).toLocaleDateString()}</p>
                        <RiskBadge risk={account.renewal_risk} />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: "green" | "blue" | "red" | "purple"
}) {
  const colorMap = {
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RAGBadge({ status }: { status: string }) {
  const colors = {
    Red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Amber: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status as keyof typeof colors] || colors.Amber}`}>
      {status}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  let color = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  if (score >= 70) color = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  else if (score >= 40) color = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"

  return <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>{score || 0}%</span>
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    High: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  }

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${colors[severity as keyof typeof colors] || colors.Medium}`}
    >
      {severity}
    </span>
  )
}

function RiskBadge({ risk }: { risk: string }) {
  const colors = {
    High: "text-red-600 dark:text-red-400",
    Medium: "text-yellow-600 dark:text-yellow-400",
    Low: "text-green-600 dark:text-green-400",
  }

  return (
    <span className={`text-sm font-medium ${colors[risk as keyof typeof colors] || colors.Medium}`}>
      {risk || "Low"} Risk
    </span>
  )
}
