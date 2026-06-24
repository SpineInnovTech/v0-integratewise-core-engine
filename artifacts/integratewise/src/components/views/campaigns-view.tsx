
import { useState } from "react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Megaphone,
  Plus,
  Search,
  Mail,
  Linkedin,
  Globe,
  Users,
  Calendar,
  Target,
  TrendingUp,
  IndianRupee,
  Eye,
  MousePointer,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  email: { label: "Email", icon: Mail, color: "bg-blue-500" },
  linkedin: { label: "LinkedIn", icon: Linkedin, color: "bg-sky-500" },
  ads: { label: "Ads", icon: Target, color: "bg-purple-500" },
  content: { label: "Content", icon: Globe, color: "bg-green-500" },
  webinar: { label: "Webinar", icon: Users, color: "bg-orange-500" },
  event: { label: "Event", icon: Calendar, color: "bg-pink-500" },
  referral: { label: "Referral", icon: Users, color: "bg-teal-500" },
  cold_outreach: { label: "Outreach", icon: Mail, color: "bg-gray-500" },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-500" },
  scheduled: { label: "Scheduled", color: "bg-blue-500" },
  active: { label: "Active", color: "bg-green-500" },
  paused: { label: "Paused", color: "bg-yellow-500" },
  completed: { label: "Completed", color: "bg-primary" },
  archived: { label: "Archived", color: "bg-gray-400" },
}

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

function formatValue(value: number) {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

export function CampaignsView() {
  const { data: campaigns, isLoading } = useSWR("campaigns", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>("active")

  const filteredCampaigns = campaigns?.filter((campaign: any) => {
    const matchesSearch = !search || campaign.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Aggregate stats
  const stats = {
    totalBudget: campaigns?.reduce((sum: number, c: any) => sum + (c.budget || 0), 0) || 0,
    totalLeads: campaigns?.reduce((sum: number, c: any) => sum + (c.total_leads || 0), 0) || 0,
    activeCampaigns: campaigns?.filter((c: any) => c.status === "active").length || 0,
    avgConversion: campaigns?.length
      ? (
          campaigns.reduce((sum: number, c: any) => {
            const rate = c.total_sent > 0 ? (c.total_leads / c.total_sent) * 100 : 0
            return sum + rate
          }, 0) / campaigns.length
        ).toFixed(1)
      : 0,
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide">Track marketing campaigns and performance</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-md transition-all hover:shadow-lg font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Budget</p>
                <p className="text-3xl font-light text-foreground mt-2 flex items-center">
                  <IndianRupee className="h-6 w-6 opacity-60" />
                  {formatValue(stats.totalBudget)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-light text-emerald-600 mt-2">{stats.totalLeads}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active</p>
                <p className="text-3xl font-light text-blue-600 mt-2">{stats.activeCampaigns}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Avg Conversion</p>
                <div className="flex items-end gap-1 mt-2">
                  <p className="text-3xl font-bold text-primary">{stats.avgConversion}</p>
                  <p className="text-xl font-bold text-primary/60 pb-0.5">%</p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-border/50">
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-10 bg-background border-border rounded-xl focus:ring-4 focus:ring-primary/10 transition-all w-full"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
            className="rounded-full px-5 whitespace-nowrap"
          >
            All
          </Button>
          {["active", "paused", "completed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "capitalize rounded-full px-5 whitespace-nowrap transition-all",
                statusFilter !== status && "bg-background border-border/50 hover:bg-muted"
              )}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns?.map((campaign: any) => {
            const type = typeConfig[campaign.type] || typeConfig.email
            const status = statusConfig[campaign.status] || statusConfig.draft
            const TypeIcon = type.icon
            const openRate =
              campaign.total_sent > 0 ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1) : 0
            const clickRate =
              campaign.total_opened > 0 ? ((campaign.total_clicked / campaign.total_opened) * 100).toFixed(1) : 0
            const conversionRate =
              campaign.total_sent > 0 ? ((campaign.total_leads / campaign.total_sent) * 100).toFixed(1) : 0
            const goalProgress = campaign.goal_leads > 0 ? (campaign.total_leads / campaign.goal_leads) * 100 : 0

            return (
              <Card key={campaign.id} className="bg-card hover:shadow-md transition-all border border-border/60 hover:border-primary/30 rounded-2xl overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-5">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-border/50", `${type.color}/10`)}>
                          <TypeIcon className={cn("h-6 w-6", type.color.replace("bg-", "text-"))} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-foreground text-xl tracking-tight group-hover:text-primary transition-colors">{campaign.name}</h3>
                            <Badge className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 shadow-none", status.color, "text-white border-transparent")}>
                              {status.label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-border/50 bg-secondary/30">
                              {type.label}
                            </Badge>
                          </div>
                          {campaign.description && (
                            <p className="text-sm font-medium text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">{campaign.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-bold text-foreground/70">
                            {campaign.start_date && (
                              <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(campaign.start_date).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                })}
                                {campaign.end_date &&
                                  ` - ${new Date(campaign.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                              </span>
                            )}
                            {campaign.budget > 0 && (
                              <span className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1 rounded-md border border-border/50">
                                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                {formatValue(campaign.budget)} budget
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border-t border-border/50 bg-secondary/10 divide-y md:divide-y-0 md:divide-x divide-border/50">
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <Mail className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Sent</span>
                      </div>
                      <p className="text-2xl font-light text-foreground">{campaign.total_sent.toLocaleString()}</p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <Eye className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Open Rate</span>
                      </div>
                      <p className="text-2xl font-light text-foreground">{openRate}<span className="text-lg opacity-60 ml-0.5">%</span></p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <MousePointer className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Click Rate</span>
                      </div>
                      <p className="text-2xl font-light text-foreground">{clickRate}<span className="text-lg opacity-60 ml-0.5">%</span></p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <Users className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Leads</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">{campaign.total_leads}</p>
                    </div>
                    <div className="p-4 flex flex-col items-center justify-center hover:bg-secondary/30 transition-colors md:col-span-1 col-span-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                        <Target className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Goal Progress</span>
                      </div>
                      <div className="flex items-center gap-3 w-full max-w-[160px]">
                        <span className="text-lg font-bold text-foreground">{Math.round(goalProgress)}%</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(goalProgress, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {campaign.tags?.length > 0 && (
                    <div className="px-6 pb-5 pt-3 bg-secondary/10 flex items-center gap-2">
                      {campaign.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border-border/60 bg-background shadow-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {filteredCampaigns?.length === 0 && (
            <div className="bg-card border border-dashed border-border/60 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
                <Megaphone className="h-10 w-10 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No campaigns found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
                No campaigns match your current filters. Create a new campaign or adjust your search.
              </p>
              <Button className="rounded-full px-8 py-6 h-auto font-semibold text-base shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Create New Campaign
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
