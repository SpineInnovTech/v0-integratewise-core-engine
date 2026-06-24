import { useState } from "react"
import { Link } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCreateLead,
  useUpdateLead,
  useQualifyLead,
  useConvertLead,
  getListLeadsQueryKey,
  type Lead,
  type LeadInput,
} from "@workspace/api-client-react"
import { useLeads, GATEWAY_LEADS_QUERY_KEY } from "@/platform/gateway-leads"
import { SOURCE_META } from "@/platform/data-source"
import { useGovernanceGate, GovernanceGate } from "@/platform/governance-gate"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
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
  X,
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
  const invalidateLeads = () => {
    void queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
    void queryClient.invalidateQueries({ queryKey: GATEWAY_LEADS_QUERY_KEY });
  }

  const { data: leads, source, state: resourceState, error: resourceError } = useLeads()
  const isLoading = resourceState === "loading"
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<LeadInput>(emptyForm)

  const gate = useGovernanceGate()
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
    const name = `${lead.firstName} ${lead.lastName ?? ""}`.trim()
    gate.request({
      operation: "Qualify lead",
      entity: name,
      impact:
        "Marks this lead as sales-qualified. Their status changes to Qualified and they move forward in the pipeline.",
      onConfirm: () =>
        qualifyLead.mutate(
          { id: lead.id, data: {} },
          {
            onSuccess: () => {
              invalidateLeads()
              toast({ title: "Lead qualified", description: name })
            },
            onError: () =>
              toast({ title: "Qualify failed", variant: "destructive" }),
          },
        ),
    })
  }

  const handleConvert = (lead: Lead) => {
    const name = `${lead.firstName} ${lead.lastName ?? ""}`.trim()
    gate.request({
      operation: "Convert to client",
      entity: name,
      impact:
        "Creates a new Client record and an open Deal linked to that client. The lead status changes to Converted. This cannot be automatically undone.",
      danger: true,
      onConfirm: () =>
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
            onError: () =>
              toast({ title: "Convert failed", variant: "destructive" }),
          },
        ),
    })
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Governance gate — intercepts qualify/convert before mutation fires */}
      <GovernanceGate gate={gate} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-light text-foreground tracking-tight">Leads Pipeline</h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm tracking-wide uppercase"
              style={{ background: SOURCE_META[source].bg, color: SOURCE_META[source].fg }}
              title={SOURCE_META[source].description}
            >
              {SOURCE_META[source].label}
            </span>
          </div>
          <p className="text-muted-foreground mt-2 font-medium">Capture, qualify, and convert your active pipeline</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 shadow-md transition-all hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Add a lead</DialogTitle>
              <DialogDescription>Capture a new lead into the pipeline. Only a first name is required.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name *</Label>
                <Input id="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</Label>
                <Input id="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</Label>
                <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input id="jobTitle" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="linkedinUrl" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">LinkedIn URL</Label>
                <Input id="linkedinUrl" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="bg-muted/30 focus:bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger id="source" className="bg-muted/30 focus:bg-background">
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
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-muted/30 focus:bg-background resize-none" />
            </div>
            <DialogFooter className="pt-4">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-full">Cancel</Button>
              <Button onClick={handleCreate} disabled={createLead.isPending} className="rounded-full px-6">
                {createLead.isPending ? "Adding…" : "Add Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-light text-foreground mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <Users className="h-5 w-5 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New</p>
                <p className="text-3xl font-light text-blue-600 mt-2">{stats.new}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Qualified</p>
                <p className="text-3xl font-light text-emerald-600 mt-2">{stats.qualified}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary/80">Converted</p>
                <p className="text-3xl font-bold text-primary mt-2">{stats.converted}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-primary" />
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
            placeholder="Search leads..."
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
          {Object.entries(statusConfig)
            .slice(0, 4)
            .map(([key, config]) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "rounded-full px-5 whitespace-nowrap transition-all",
                  statusFilter !== key && "bg-background border-border/50 hover:bg-muted"
                )}
              >
                {config.label}
              </Button>
            ))}
        </div>
      </div>

      {/* Leads List */}
      {resourceState === "error" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive flex flex-col items-center justify-center min-h-[200px]">
          <span className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <X className="h-6 w-6" />
          </span>
          <span className="font-semibold text-base">Data unavailable</span>
          {resourceError && (
            <span className="mt-1 text-destructive/80 text-center">{resourceError}</span>
          )}
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredLeads && filteredLeads.length > 0 ? (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const status = statusConfig[lead.status] || statusConfig.new
            const sourceLabel = sourceLabels[lead.source] || lead.source
            return (
              <Card key={lead.id} className="bg-card hover:shadow-md transition-all border border-border/60 hover:border-border group rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch justify-between">
                    <Link href={`/leads/${lead.id}`} className="flex items-center gap-5 flex-1 min-w-0 p-5 pl-6 hover:bg-secondary/20 transition-colors">
                      <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border border-border shadow-sm">
                        <span className="text-xl font-bold text-foreground opacity-80 uppercase tracking-widest">
                          {lead.firstName?.[0]}
                          {lead.lastName?.[0]}
                        </span>
                      </div>
                      <div className="min-w-0 py-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors truncate">
                            {lead.firstName} {lead.lastName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm font-medium text-muted-foreground">
                          {lead.company && (
                            <span className="flex items-center gap-1.5 truncate bg-secondary px-2.5 py-0.5 rounded-full text-foreground/80">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                              {lead.company}
                            </span>
                          )}
                          {lead.jobTitle && <span className="truncate">{lead.jobTitle}</span>}
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-6 flex-shrink-0 pr-6 pl-4 border-l border-border/50 bg-secondary/5 group-hover:bg-secondary/10 transition-colors">
                      <div className="text-center hidden lg:block w-24">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Score</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-bold text-foreground">{lead.score}</span>
                          <Progress value={lead.score} className="w-12 h-1.5" />
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] font-bold tracking-wider uppercase hidden md:inline-flex bg-background border-border/50 px-2 py-0.5 rounded-sm">
                        {sourceLabel}
                      </Badge>

                      <Badge className={cn("px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-sm shadow-none", status.color, "text-white")}>
                        {status.label}
                      </Badge>

                      <div className="flex items-center gap-1">
                        {lead.linkedinUrl && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" asChild>
                            <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.email && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-secondary" asChild>
                            <a href={`mailto:${lead.email}`}>
                              <Mail className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-secondary" asChild>
                            <a href={`tel:${lead.phone}`}>
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-secondary">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-border/50 p-1">
                          <DropdownMenuItem className="rounded-lg font-medium py-2 cursor-pointer" onClick={() => setStatus(lead, "contacted", "Marked as contacted")}>
                            Mark as Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg font-medium py-2 cursor-pointer" onClick={() => handleQualify(lead)}>
                            Qualify Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg font-medium py-2 cursor-pointer text-primary" onClick={() => handleConvert(lead)}>
                            Convert to Client
                          </DropdownMenuItem>
                          <div className="h-px bg-border/50 my-1 mx-1" />
                          <DropdownMenuItem className="rounded-lg font-medium py-2 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => setStatus(lead, "lost", "Marked as lost")}>
                            Mark as Lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex items-center gap-2 px-6 pb-5 pl-[92px]">
                      {lead.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm bg-secondary/50">
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
        <div className="bg-card border border-dashed border-border/60 rounded-3xl p-16 text-center flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No leads in the pipeline</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
            Your pipeline is currently empty. Add your first lead manually or connect a data source to begin capturing leads automatically.
          </p>
          <Button onClick={() => setDialogOpen(true)} className="rounded-full px-8 py-6 h-auto font-semibold text-base shadow-lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Lead
          </Button>
        </div>
      )}
    </div>
  )
}
