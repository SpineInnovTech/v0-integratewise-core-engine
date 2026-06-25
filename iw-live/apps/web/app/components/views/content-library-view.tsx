"use client"

import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Plus,
  FileText,
  Video,
  BookOpen,
  Mail,
  Presentation,
  Calculator,
  CheckSquare,
  Eye,
  Heart,
  Share2,
  Calendar,
  ExternalLink,
  MoreHorizontal,
  Linkedin,
  Youtube,
  Globe,
} from "lucide-react"

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase.from("content_library").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return data
}

const typeIcons: Record<string, any> = {
  article: FileText,
  video: Video,
  ebook: BookOpen,
  guide: BookOpen,
  newsletter: Mail,
  presentation: Presentation,
  tool: Calculator,
  checklist: CheckSquare,
  case_study: FileText,
}

const platformIcons: Record<string, any> = {
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
  blog: Globe,
  email: Mail,
  community: Heart,
  internal: FileText,
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  active: "bg-teal-100 text-teal-700",
}

export function ContentLibraryView() {
  const { data: content, isLoading } = useSWR("content_library", fetcher)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const types = ["all", "article", "video", "ebook", "guide", "newsletter", "case_study", "tool"]

  const filteredContent = content?.filter((item: any) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || item.type === typeFilter
    const matchesStatus = statusFilter === "all" || item.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = {
    total: content?.length || 0,
    published: content?.filter((c: any) => c.status === "published").length || 0,
    totalViews: content?.reduce((sum: number, c: any) => sum + (c.views || 0), 0) || 0,
    totalShares: content?.reduce((sum: number, c: any) => sum + (c.shares || 0), 0) || 0,
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Content Library</h1>
          <p className="text-slate-500">Marketing assets, lead magnets, and thought leadership</p>
        </div>
        <Button className="bg-teal-500 hover:bg-teal-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Content
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.published}</p>
                <p className="text-sm text-slate-500">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalViews.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Share2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalShares.toLocaleString()}</p>
                <p className="text-sm text-slate-500">Total Shares</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-slate-200"
          />
        </div>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="bg-slate-100">
            {types.map((type) => (
              <TabsTrigger key={type} value={type} className="capitalize data-[state=active]:bg-white">
                {type === "all" ? "All" : type.replace("_", " ")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
        </select>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent?.map((item: any) => {
          const TypeIcon = typeIcons[item.type] || FileText
          const PlatformIcon = platformIcons[item.platform] || Globe

          return (
            <Card key={item.id} className="border-slate-200 hover:border-teal-300 transition-colors group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-teal-100 transition-colors">
                      <TypeIcon className="h-4 w-4 text-slate-600 group-hover:text-teal-600" />
                    </div>
                    <Badge className={statusColors[item.status] || "bg-gray-100"}>{item.status}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-base mt-2 line-clamp-2">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.description && <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>}

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <PlatformIcon className="h-3.5 w-3.5" />
                    <span className="capitalize">{item.platform}</span>
                  </div>
                  {item.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(item.published_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Eye className="h-3.5 w-3.5" />
                      {item.views?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Heart className="h-3.5 w-3.5" />
                      {item.engagement || 0}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Share2 className="h-3.5 w-3.5" />
                      {item.shares || 0}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs border-slate-200">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs border-slate-200">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredContent?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No content found</h3>
          <p className="text-slate-500">Try adjusting your filters or create new content</p>
        </div>
      )}
    </div>
  )
}
