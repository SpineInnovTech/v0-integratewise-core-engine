"use client"

import { useState } from "react"
import useSWR from "swr"
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground">Track marketing campaigns and performance</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-foreground flex items-center">
                  <IndianRupee className="h-5 w-5" />
                  {formatValue(stats.totalBudget)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-green-500">{stats.totalLeads}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-blue-500">{stats.activeCampaigns}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold text-primary">{stats.avgConversion}%</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "paused" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("paused")}
          >
            Paused
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
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
              <Card key={campaign.id} className="bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-xl ${type.color}/10 flex items-center justify-center`}>
                        <TypeIcon className={`h-6 w-6 ${type.color.replace("bg-", "text-")}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground text-lg">{campaign.name}</h3>
                          <Badge className={`${status.color} text-white`}>{status.label}</Badge>
                          <Badge variant="outline">{type.label}</Badge>
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{campaign.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {campaign.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(campaign.start_date).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                              {campaign.end_date &&
                                ` - ${new Date(campaign.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                            </span>
                          )}
                          {campaign.budget > 0 && (
                            <span className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {formatValue(campaign.budget)} budget
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-5 gap-4 mt-5 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-xs">Sent</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{campaign.total_sent.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-xs">Open Rate</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{openRate}%</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <MousePointer className="h-3.5 w-3.5" />
                        <span className="text-xs">Click Rate</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{clickRate}%</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">Leads</span>
                      </div>
                      <p className="text-lg font-bold text-green-500">{campaign.total_leads}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Target className="h-3.5 w-3.5" />
                        <span className="text-xs">Goal Progress</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={Math.min(goalProgress, 100)} className="w-16 h-2" />
                        <span className="text-sm font-medium">{Math.round(goalProgress)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {campaign.tags?.length > 0 && (
                    <div className="flex items-center gap-2 mt-4">
                      {campaign.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
