"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  FileText,
  DollarSign,
  Target,
  Megaphone,
  Rocket,
  Package,
  Briefcase,
  BarChart3,
  Globe,
  Linkedin,
  Users,
  Settings,
  Shield,
  Lightbulb,
  BookOpen,
  PieChart,
  TrendingUp,
  Award,
  Workflow,
  Database,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  Eye,
  Code,
  Zap,
  Server,
  Layers,
  Palette,
  Lock,
  HeadphonesIcon,
  Monitor,
  FlaskConical,
  FolderKanban,
  Github,
  Bot,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDocuments } from "@/lib/hooks/use-data"
import { createClient } from "@/lib/supabase/client"
import { mutate } from "swr"

interface KnowledgeViewProps {
  category?: string
}

const categories = [
  { id: "all", name: "All", icon: BookOpen },
  { id: "branding", name: "Branding & Assets", icon: Palette },
  { id: "compliance", name: "Compliance & Legal", icon: Shield },
  { id: "credentials", name: "Credentials & Security", icon: Lock },
  { id: "customer-support", name: "Customer & Support", icon: HeadphonesIcon },
  { id: "digital-it", name: "Digital Presence & IT", icon: Monitor },
  { id: "finance", name: "Finance & Billing", icon: DollarSign },
  { id: "innovation", name: "Innovation & R&D", icon: FlaskConical },
  { id: "investor-relations", name: "Investor Relations", icon: TrendingUp },
  { id: "marketing", name: "Marketing & Brand", icon: Megaphone },
  { id: "metrics", name: "Metrics & Dashboard", icon: BarChart3 },
  { id: "misc-ops", name: "Misc & General Ops", icon: FolderKanban },
  { id: "saas-tech", name: "SaaS & Tech", icon: Database },
  { id: "sales", name: "Sales & Growth", icon: Target },
  { id: "startup-launch", name: "Startup Launch", icon: Sparkles },
  { id: "team-culture", name: "Team & Culture", icon: Users },
  { id: "automations", name: "Automations", icon: Workflow },
  { id: "github-internal", name: "GitHub & Internal", icon: Github },
  { id: "product-docs", name: "Product Docs & Runbooks", icon: FileText },
  { id: "ai-exports", name: "AI Exports", icon: Bot },
]

const iconOptions = [
  { value: "FileText", label: "Document", icon: FileText },
  { value: "Target", label: "Target", icon: Target },
  { value: "Package", label: "Package", icon: Package },
  { value: "DollarSign", label: "Finance", icon: DollarSign },
  { value: "Award", label: "Award", icon: Award },
  { value: "Megaphone", label: "Marketing", icon: Megaphone },
  { value: "Linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "Rocket", label: "Rocket", icon: Rocket },
  { value: "Workflow", label: "Workflow", icon: Workflow },
  { value: "Briefcase", label: "Business", icon: Briefcase },
  { value: "BarChart3", label: "Analytics", icon: BarChart3 },
  { value: "Globe", label: "Web", icon: Globe },
  { value: "PieChart", label: "Metrics", icon: PieChart },
  { value: "BookOpen", label: "Guide", icon: BookOpen },
  { value: "Users", label: "Team", icon: Users },
  { value: "TrendingUp", label: "Growth", icon: TrendingUp },
  { value: "Lightbulb", label: "Ideas", icon: Lightbulb },
  { value: "Database", label: "Data", icon: Database },
  { value: "Shield", label: "Security", icon: Shield },
  { value: "Settings", label: "Settings", icon: Settings },
  { value: "Code", label: "Code", icon: Code },
  { value: "Zap", label: "Automation", icon: Zap },
  { value: "Server", label: "Server", icon: Server },
  { value: "Layers", label: "Layers", icon: Layers },
  { value: "Palette", label: "Branding", icon: Palette },
  { value: "Lock", label: "Credentials", icon: Lock },
  { value: "HeadphonesIcon", label: "Support", icon: HeadphonesIcon },
  { value: "Monitor", label: "IT", icon: Monitor },
  { value: "FlaskConical", label: "R&D", icon: FlaskConical },
  { value: "Github", label: "GitHub", icon: Github },
  { value: "Bot", label: "AI", icon: Bot },
  { value: "Sparkles", label: "Launch", icon: Sparkles },
]

const iconMap: Record<string, any> = {
  Target,
  Package,
  DollarSign,
  Award,
  Megaphone,
  Linkedin,
  Rocket,
  Workflow,
  Briefcase,
  BarChart3,
  Globe,
  PieChart,
  BookOpen,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  Database,
  Shield,
  Settings,
  Code,
  Zap,
  Server,
  Layers,
  Palette,
  Lock,
  HeadphonesIcon,
  Monitor,
  FlaskConical,
  FolderKanban,
  Github,
  Bot,
  Sparkles,
}

function getIconComponent(iconName: string | null) {
  if (!iconName) return FileText
  return iconMap[iconName] || FileText
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function KnowledgeView({ category }: KnowledgeViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState(category || "all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "marketing",
    icon: "FileText",
  })

  const { data: documents, isLoading } = useDocuments()
  const supabase = createClient()

  const filteredDocs = useMemo(() => {
    if (!documents) return []
    return documents.filter((doc: any) => {
      const matchesSearch =
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.content?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === "all" || doc.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [documents, searchQuery, activeCategory])

  const categoryLabel =
    activeCategory === "all" ? "All Documents" : categories.find((c) => c.id === activeCategory)?.name || "Documents"

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      category: "marketing",
      icon: "FileText",
    })
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("documents").insert({
        title: formData.title,
        description: formData.description,
        content: formData.content,
        category: formData.category,
        icon: formData.icon,
        is_starred: false,
        view_count: 0,
      })

      if (error) throw error

      mutate("documents")
      setIsAddOpen(false)
      resetForm()
    } catch (err) {
      console.error("Failed to create document:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedDoc || !formData.title.trim()) return
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("documents")
        .update({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          category: formData.category,
          icon: formData.icon,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedDoc.id)

      if (error) throw error

      mutate("documents")
      setIsEditOpen(false)
      setSelectedDoc(null)
      resetForm()
    } catch (err) {
      console.error("Failed to update document:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const { error } = await supabase.from("documents").delete().eq("id", docId)
      if (error) throw error
      mutate("documents")
    } catch (err) {
      console.error("Failed to delete document:", err)
    }
  }

  const handleToggleStar = async (doc: any) => {
    try {
      const { error } = await supabase.from("documents").update({ is_starred: !doc.is_starred }).eq("id", doc.id)
      if (error) throw error
      mutate("documents")
    } catch (err) {
      console.error("Failed to toggle star:", err)
    }
  }

  const handleView = async (doc: any) => {
    setSelectedDoc(doc)
    setIsViewOpen(true)

    try {
      await supabase
        .from("documents")
        .update({ view_count: (doc.view_count || 0) + 1 })
        .eq("id", doc.id)
      mutate("documents")
    } catch (err) {
      console.error("Failed to update view count:", err)
    }
  }

  const openEdit = (doc: any) => {
    setSelectedDoc(doc)
    setFormData({
      title: doc.title || "",
      description: doc.description || "",
      content: doc.content || "",
      category: doc.category || "marketing",
      icon: doc.icon || "FileText",
    })
    setIsEditOpen(true)
  }

  const starredDocs = filteredDocs.filter((doc: any) => doc.is_starred)
  const regularDocs = filteredDocs.filter((doc: any) => !doc.is_starred)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Knowledge Hub</h1>
          <p className="text-muted-foreground">Create and manage internal documentation</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm()
                setIsAddOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3 space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Page title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => {
                        const Icon = opt.icon
                        return (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {opt.label}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.id !== "all")
                      .map((cat) => {
                        const Icon = cat.icon
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {cat.name}
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description..."
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Content (Markdown supported)</Label>
                <Textarea
                  placeholder="Write your content here... Markdown is supported."
                  rows={12}
                  className="font-mono text-sm"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting || !formData.title.trim()}>
                  {isSubmitting ? "Creating..." : "Create Page"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search all documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.name}
            </button>
          )
        })}
      </div>

      {/* Starred Section */}
      {starredDocs.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Starred</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {starredDocs.map((doc: any) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onView={handleView}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        </>
      )}

      {/* All Documents */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{categoryLabel}</h2>
        <p className="text-sm text-muted-foreground">
          {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
          : regularDocs.map((doc: any) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onView={handleView}
                onEdit={openEdit}
                onDelete={handleDelete}
                onToggleStar={handleToggleStar}
              />
            ))}
      </div>

      {!isLoading && filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No documents found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Try adjusting your search" : "Create your first page to get started"}
          </p>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getIconComponent(selectedDoc.icon)
                      return (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                      )
                    })()}
                    <div>
                      <DialogTitle className="text-xl">{selectedDoc.title}</DialogTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedDoc.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 inline mr-1" />
                          {selectedDoc.view_count || 0} views
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated {formatDate(selectedDoc.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleStar(selectedDoc)}>
                      {selectedDoc.is_starred ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsViewOpen(false)
                        openEdit(selectedDoc)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-4">
                {selectedDoc.description && <p className="text-muted-foreground mb-4">{selectedDoc.description}</p>}
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {selectedDoc.content || "No content yet."}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3 space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Page title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.id !== "all")
                    .map((cat) => {
                      const Icon = cat.icon
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description..."
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Content (Markdown supported)</Label>
              <Textarea
                placeholder="Write your content here..."
                rows={12}
                className="font-mono text-sm"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting || !formData.title.trim()}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Document Card Component
function DocumentCard({
  doc,
  onView,
  onEdit,
  onDelete,
  onToggleStar,
}: {
  doc: any
  onView: (doc: any) => void
  onEdit: (doc: any) => void
  onDelete: (id: string) => void
  onToggleStar: (doc: any) => void
}) {
  const Icon = getIconComponent(doc.icon)
  const categoryInfo = categories.find((c) => c.id === doc.category)
  const CategoryIcon = categoryInfo?.icon || FileText

  return (
    <Card
      className="group hover:shadow-md transition-all cursor-pointer border-border/50 hover:border-primary/30"
      onClick={() => onView(doc)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStar(doc)
                }}
              >
                {doc.is_starred ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" /> Unstar
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" /> Star
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(doc)
                }}
              >
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(doc.id)
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{doc.title}</h3>
        {doc.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{doc.description}</p>}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CategoryIcon className="h-3 w-3" />
            <span className="truncate max-w-20">{categoryInfo?.name || doc.category}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            {doc.view_count || 0}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
