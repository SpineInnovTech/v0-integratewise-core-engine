"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Search,
  Mail,
  Phone,
  Building2,
  Linkedin,
  Star,
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { AddLeadDialog } from "@/components/dialogs/add-lead-dialog"

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500" },
  contacted: { label: "Contacted", color: "bg-yellow-500" },
  qualified: { label: "Qualified", color: "bg-green-500" },
  unqualified: { label: "Unqualified", color: "bg-gray-500" },
  converted: { label: "Converted", color: "bg-primary" },
  lost: { label: "Lost", color: "bg-red-500" },
}

const sourceConfig: Record<string, { label: string; icon: string }> = {
  linkedin: { label: "LinkedIn", icon: "linkedin" },
  website: { label: "Website", icon: "globe" },
  referral: { label: "Referral", icon: "users" },
  hubspot: { label: "HubSpot", icon: "database" },
  event: { label: "Event", icon: "calendar" },
  cold_outreach: { label: "Outreach", icon: "mail" },
}

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from("leads").select("*").order("score", { ascending: false })
  if (error) throw error
  return data
}

export function LeadsView() {
  const { data: leads, isLoading } = useSWR("leads", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const filteredLeads = leads?.filter((lead: any) => {
    const matchesSearch =
      !search ||
      lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Stats
  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l: any) => l.status === "new").length || 0,
    qualified: leads?.filter((l: any) => l.status === "qualified").length || 0,
    converted: leads?.filter((l: any) => l.status === "converted").length || 0,
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from("leads").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", leadId)
    mutate("leads")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales leads</p>
        </div>
        <AddLeadDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold text-green-500">{stats.qualified}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-primary">{stats.converted}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary" />
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
            placeholder="Search leads..."
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
          {Object.entries(statusConfig)
            .slice(0, 4)
            .map(([key, config]) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(key)}
              >
                {config.label}
              </Button>
            ))}
        </div>
      </div>

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads?.map((lead: any) => {
            const status = statusConfig[lead.status] || statusConfig.new
            const source = sourceConfig[lead.source] || { label: lead.source, icon: "globe" }
            return (
              <Card key={lead.id} className="bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {lead.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("") || "?"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {lead.name}
                          </h3>
                          {lead.linkedin_url && (
                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4 text-blue-500 hover:text-blue-600" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {lead.company}
                          </span>
                          {lead.job_title && <span className="text-muted-foreground/60">• {lead.job_title}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {/* Lead Score */}
                      <div className="text-center">
                        <div className="flex items-center gap-2">
                          <Progress value={lead.score} className="w-16 h-2" />
                          <span className="text-sm font-medium text-foreground">{lead.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score</p>
                      </div>

                      {/* Source */}
                      <Badge variant="secondary" className="text-xs">
                        {source.label}
                      </Badge>

                      {/* Status */}
                      <Badge className={`${status.color} text-white`}>{status.label}</Badge>

                      {/* Contact Actions */}
                      <div className="flex items-center gap-2">
                        {lead.email && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </Button>
                        )}
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* More Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "contacted")}>
                            Mark as Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "qualified")}>
                            Mark as Qualified
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateLeadStatus(lead.id, "converted")}>
                            Convert to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => updateLeadStatus(lead.id, "lost")}>
                            Mark as Lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Tags */}
                  {lead.tags?.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pl-16">
                      {lead.tags.map((tag: string) => (
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
