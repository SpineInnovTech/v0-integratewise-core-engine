import { useState } from "react"
import { Link } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import {
  useListLeads,
  useCreateLead,
  useUpdateLead,
  useQualifyLead,
  useConvertLead,
  getListLeadsQueryKey,
  type Lead,
  type LeadInput,
} from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building2,
  Linkedin,
  Star,
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500" },
  contacted: { label: "Contacted", color: "bg-yellow-500" },
  qualified: { label: "Qualified", color: "bg-green-500" },
  unqualified: { label: "Unqualified", color: "bg-gray-500" },
  converted: { label: "Converted", color: "bg-primary" },
  lost: { label: "Lost", color: "bg-red-500" },
}

const sourceLabels: Record<string, string> = {
  apollo: "Apollo",
  linkedin: "LinkedIn",
  website: "Website",
  referral: "Referral",
  hubspot: "HubSpot",
  event: "Event",
  cold_outreach: "Outreach",
}

const emptyForm: LeadInput = {
  firstName: "",
  lastName: "",
  company: "",
  jobTitle: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  source: "manual",
  notes: "",
}

export function LeadsView() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const invalidateLeads = () =>
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() })

  const { data: leads, isLoading } = useListLeads()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<LeadInput>(emptyForm)

  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const qualifyLead = useQualifyLead()
  const convertLead = useConvertLead()

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: leads?.length || 0,
    new: leads?.filter((l) => l.status === "new").length || 0,
    qualified: leads?.filter((l) => l.status === "qualified").length || 0,
    converted: leads?.filter((l) => l.status === "converted").length || 0,
  }

  const handleCreate = () => {
    if (!form.firstName.trim()) {
      toast({ title: "First name is required", variant: "destructive" })
      return
    }
    const payload: LeadInput = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== "" && v != null),
    ) as LeadInput
    createLead.mutate(
      { data: payload },
      {
        onSuccess: (lead) => {
          invalidateLeads()
          setDialogOpen(false)
          setForm(emptyForm)
          toast({
            title: "Lead added",
            description: `${lead.firstName} ${lead.lastName ?? ""}`.trim(),
          })
        },
        onError: () =>
          toast({ title: "Could not add lead", variant: "destructive" }),
      },
    )
  }

  const setStatus = (lead: Lead, status: string, label: string) => {
    updateLead.mutate(
      { id: lead.id, data: { status } },
      {
        onSuccess: () => {
          invalidateLeads()
          toast({ title: label, description: `${lead.firstName} ${lead.lastName ?? ""}`.trim() })
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      },
    )
  }

  const handleQualify = (lead: Lead) => {
    qualifyLead.mutate(
      { id: lead.id, data: {} },
      {
        onSuccess: () => {
          invalidateLeads()
          toast({ title: "Lead qualified", description: `${lead.firstName} ${lead.lastName ?? ""}`.trim() })
        },
        onError: () => toast({ title: "Qualify failed", variant: "destructive" }),
      },
    )
  }

  const handleConvert = (lead: Lead) => {
    convertLead.mutate(
      { id: lead.id, data: {} },
      {
        onSuccess: (result) => {
          invalidateLeads()
          queryClient.invalidateQueries({ queryKey: ["/api/clients"] })
          queryClient.invalidateQueries({ queryKey: ["/api/deals"] })
          toast({
            title: "Converted to client",
            description: `${result.client.name} + open deal created`,
          })
        },
        onError: () => toast({ title: "Convert failed", variant: "destructive" }),
      },
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Capture, qualify, and convert — your real pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Add a lead</DialogTitle>
              <DialogDescription>Capture a new lead into the pipeline. Only a first name is required.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobTitle">Title</Label>
                <Input id="jobTitle" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input id="linkedinUrl" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="source">Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="apollo">Apollo</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="cold_outreach">Outreach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createLead.isPending}>
                {createLead.isPending ? "Adding…" : "Add Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      ) : filteredLeads && filteredLeads.length > 0 ? (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const status = statusConfig[lead.status] || statusConfig.new
            const sourceLabel = sourceLabels[lead.source] || lead.source
            return (
              <Card key={lead.id} className="bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/leads/${lead.id}`} className="flex items-center gap-4 group flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-semibold text-primary">
                          {lead.firstName?.[0]}
                          {lead.lastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {lead.firstName} {lead.lastName}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          {lead.company && (
                            <span className="flex items-center gap-1 truncate">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                              {lead.company}
                            </span>
                          )}
                          {lead.jobTitle && <span className="text-muted-foreground/60 truncate">• {lead.jobTitle}</span>}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center hidden md:block">
                        <div className="flex items-center gap-2">
                          <Progress value={lead.score} className="w-16 h-2" />
                          <span className="text-sm font-medium text-foreground">{lead.score}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Score</p>
                      </div>

                      <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                        {sourceLabel}
                      </Badge>

                      <Badge className={`${status.color} text-white`}>{status.label}</Badge>

                      <div className="flex items-center gap-2">
                        {lead.linkedinUrl && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4 text-blue-500" />
                            </a>
                          </Button>
                        )}
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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setStatus(lead, "contacted", "Marked as contacted")}>
                            Mark as Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleQualify(lead)}>
                            Qualify
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvert(lead)}>
                            Convert to Client
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500" onClick={() => setStatus(lead, "lost", "Marked as lost")}>
                            Mark as Lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 pl-16">
                      {lead.tags.map((tag) => (
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
      ) : (
        <Card className="bg-card">
          <CardContent className="p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-foreground font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first lead to start building the pipeline.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
