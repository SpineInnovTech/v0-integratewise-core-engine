"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  FormInput,
  Users,
  TrendingUp,
  Eye,
  MousePointerClick,
  Plus,
  Search,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface Page {
  id: string
  title: string
  slug: string
  page_type: string
  status: string
  views: number
  unique_visitors: number
  avg_time_on_page: number
  bounce_rate: number
  conversions: number
  seo_score: number
  published_at: string | null
}

interface Form {
  id: string
  name: string
  form_type: string
  status: string
  submissions_count: number
  conversion_rate: number
  connected_to: string
}

interface Visitor {
  id: string
  visitor_id: string
  total_visits: number
  total_pageviews: number
  email: string | null
  name: string | null
  company: string | null
  lifecycle_stage: string
  country: string
}

interface SyncLog {
  id: string
  sync_type: string
  direction: string
  status: string
  records_processed: number
  records_created: number
  records_updated: number
  completed_at: string | null
}

export function WebsiteManagerView() {
  const [pages, setPages] = useState<Page[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("pages")
  const [isAddPageOpen, setIsAddPageOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [pagesRes, formsRes, visitorsRes, syncRes] = await Promise.all([
      supabase.from("website_pages").select("*").order("views", { ascending: false }),
      supabase.from("website_forms").select("*").order("submissions_count", { ascending: false }),
      supabase.from("website_visitors").select("*").order("total_visits", { ascending: false }).limit(50),
      supabase.from("hubspot_sync_log").select("*").order("created_at", { ascending: false }).limit(10),
    ])

    if (pagesRes.data) setPages(pagesRes.data)
    if (formsRes.data) setForms(formsRes.data)
    if (visitorsRes.data) setVisitors(visitorsRes.data)
    if (syncRes.data) setSyncLogs(syncRes.data)
    setLoading(false)
  }

  async function triggerHubSpotSync() {
    setSyncing(true)
    try {
      const response = await fetch("/api/hubspot/sync", { method: "POST" })
      if (response.ok) {
        await loadData()
      }
    } catch (error) {
      console.error("Sync failed:", error)
    }
    setSyncing(false)
  }

  async function handleAddPage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const { error } = await supabase.from("website_pages").insert({
      title: formData.get("title"),
      slug: formData.get("slug"),
      page_type: formData.get("page_type"),
      status: formData.get("status"),
      meta_description: formData.get("meta_description"),
      content: formData.get("content"),
    })

    if (!error) {
      setIsAddPageOpen(false)
      loadData()
    }
  }

  // Calculate stats
  const totalViews = pages.reduce((sum, p) => sum + (p.views || 0), 0)
  const totalVisitors = pages.reduce((sum, p) => sum + (p.unique_visitors || 0), 0)
  const totalConversions = pages.reduce((sum, p) => sum + (p.conversions || 0), 0)
  const avgBounceRate = pages.length > 0 ? pages.reduce((sum, p) => sum + (p.bounce_rate || 0), 0) / pages.length : 0

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredVisitors = visitors.filter(
    (v) =>
      v.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.company?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Website Manager</h1>
          <p className="text-muted-foreground">Manage pages, forms, and track visitor analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={triggerHubSpotSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync HubSpot"}
          </Button>
          <Dialog open={isAddPageOpen} onOpenChange={setIsAddPageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddPage}>
                <DialogHeader>
                  <DialogTitle>Create New Page</DialogTitle>
                  <DialogDescription>Add a new page to your website</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Page Title</Label>
                    <Input id="title" name="title" placeholder="About Us" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input id="slug" name="slug" placeholder="/about" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="page_type">Page Type</Label>
                      <Select name="page_type" defaultValue="page">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="page">Page</SelectItem>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="landing">Landing Page</SelectItem>
                          <SelectItem value="service">Service Page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="draft">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Input id="meta_description" name="meta_description" placeholder="SEO description..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea id="content" name="content" placeholder="Page content..." rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddPageOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Page</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Page Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>12% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                <p className="text-2xl font-bold">{totalVisitors.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>8% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">{totalConversions.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>15% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Bounce Rate</p>
                <p className="text-2xl font-bold">{avgBounceRate.toFixed(1)}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <ArrowDownRight className="h-4 w-4" />
              <span>3% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pages" className="gap-2">
              <FileText className="h-4 w-4" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="forms" className="gap-2">
              <FormInput className="h-4 w-4" />
              Forms
            </TabsTrigger>
            <TabsTrigger value="visitors" className="gap-2">
              <Users className="h-4 w-4" />
              Visitors
            </TabsTrigger>
            <TabsTrigger value="hubspot" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              HubSpot Sync
            </TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>

        {/* Pages Tab */}
        <TabsContent value="pages" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Page</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-right p-4 font-medium">Views</th>
                      <th className="text-right p-4 font-medium">Visitors</th>
                      <th className="text-right p-4 font-medium">Conversions</th>
                      <th className="text-right p-4 font-medium">SEO</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPages.map((page) => (
                      <tr key={page.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{page.title}</p>
                            <p className="text-sm text-muted-foreground">{page.slug}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="capitalize">
                            {page.page_type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={page.status === "published" ? "default" : "secondary"}
                            className={page.status === "published" ? "bg-green-100 text-green-800" : ""}
                          >
                            {page.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">{page.views?.toLocaleString() || 0}</td>
                        <td className="p-4 text-right">{page.unique_visitors?.toLocaleString() || 0}</td>
                        <td className="p-4 text-right">{page.conversions || 0}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${page.seo_score >= 80 ? "bg-green-500" : page.seo_score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${page.seo_score}%` }}
                              />
                            </div>
                            <span className="text-sm">{page.seo_score}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <Badge variant={form.status === "active" ? "default" : "secondary"}>{form.status}</Badge>
                  </div>
                  <CardDescription className="capitalize">{form.form_type} Form</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{form.submissions_count}</p>
                      <p className="text-xs text-muted-foreground">Submissions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{form.conversion_rate}%</p>
                      <p className="text-xs text-muted-foreground">Conversion</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold capitalize">{form.connected_to || "-"}</p>
                      <p className="text-xs text-muted-foreground">Connected To</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Visitors Tab */}
        <TabsContent value="visitors" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Visitor</th>
                      <th className="text-left p-4 font-medium">Company</th>
                      <th className="text-left p-4 font-medium">Country</th>
                      <th className="text-left p-4 font-medium">Stage</th>
                      <th className="text-right p-4 font-medium">Visits</th>
                      <th className="text-right p-4 font-medium">Pageviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{visitor.name || "Anonymous"}</p>
                            <p className="text-sm text-muted-foreground">{visitor.email || visitor.visitor_id}</p>
                          </div>
                        </td>
                        <td className="p-4">{visitor.company || "-"}</td>
                        <td className="p-4">{visitor.country || "-"}</td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              visitor.lifecycle_stage === "customer"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : visitor.lifecycle_stage === "sql"
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : visitor.lifecycle_stage === "mql"
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : ""
                            }
                          >
                            {visitor.lifecycle_stage?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">{visitor.total_visits}</td>
                        <td className="p-4 text-right">{visitor.total_pageviews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HubSpot Sync Tab */}
        <TabsContent value="hubspot" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>HubSpot Integration Status</CardTitle>
                <CardDescription>Real-time sync status between Website and HubSpot CRM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {["Contacts", "Deals", "Companies", "Forms"].map((type) => {
                    const lastSync = syncLogs.find((s) => s.sync_type === type.toLowerCase())
                    return (
                      <div key={type} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{type}</span>
                          {lastSync?.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lastSync ? `${lastSync.records_processed} records` : "Not synced"}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sync Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">Type</th>
                        <th className="text-left p-4 font-medium">Direction</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-right p-4 font-medium">Processed</th>
                        <th className="text-right p-4 font-medium">Created</th>
                        <th className="text-right p-4 font-medium">Updated</th>
                        <th className="text-right p-4 font-medium">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="p-4 capitalize">{log.sync_type}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize">
                              {log.direction}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={log.status === "completed" ? "default" : "secondary"}
                              className={log.status === "completed" ? "bg-green-100 text-green-800" : ""}
                            >
                              {log.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">{log.records_processed}</td>
                          <td className="p-4 text-right text-green-600">+{log.records_created}</td>
                          <td className="p-4 text-right text-blue-600">{log.records_updated}</td>
                          <td className="p-4 text-right text-sm text-muted-foreground">
                            {log.completed_at ? new Date(log.completed_at).toLocaleString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
