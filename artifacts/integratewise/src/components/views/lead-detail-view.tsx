import { useState } from "react"
import { Link } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import {
  useGetLead,
  useQualifyLead,
  useConvertLead,
  useUpdateLead,
  useCreateLeadActivity,
  useTwinChat,
  getGetLeadQueryKey,
  getListLeadsQueryKey,
  type TwinSuggestion,
} from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Building2,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  ListTodo,
  Bot,
  Send,
  Sparkles,
  Briefcase,
  UserCheck,
} from "lucide-react"
import { LeadIntelligencePanel } from "@/components/views/lead-intelligence-panel"
import { LeadRecentEmails } from "@/components/views/lead-recent-emails"

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-500" },
  contacted: { label: "Contacted", color: "bg-yellow-500" },
  qualified: { label: "Qualified", color: "bg-green-500" },
  unqualified: { label: "Unqualified", color: "bg-gray-500" },
  converted: { label: "Converted", color: "bg-primary" },
  lost: { label: "Lost", color: "bg-red-500" },
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

interface TwinTurn {
  role: "user" | "assistant"
  content: string
  suggestions?: TwinSuggestion[]
}

export function LeadDetailView({ leadId }: { leadId: string }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data, isLoading } = useGetLead(leadId)

  const qualifyLead = useQualifyLead()
  const convertLead = useConvertLead()
  const updateLead = useUpdateLead()
  const createActivity = useCreateLeadActivity()
  const twinChat = useTwinChat()

  const [note, setNote] = useState("")
  const [twinInput, setTwinInput] = useState("")
  const [turns, setTurns] = useState<TwinTurn[]>([])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(leadId) })
    queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <Link href="/leads" className="text-sm text-primary flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>
        <p className="mt-6 text-muted-foreground">Lead not found.</p>
      </div>
    )
  }

  const { lead, client, deal, activities, tasks } = data
  const status = statusConfig[lead.status] || statusConfig.new
  const fullName = `${lead.firstName} ${lead.lastName ?? ""}`.trim()

  const handleQualify = () => {
    qualifyLead.mutate(
      { id: lead.id, data: {} },
      {
        onSuccess: () => {
          refresh()
          toast({ title: "Lead qualified" })
        },
        onError: () => toast({ title: "Qualify failed", variant: "destructive" }),
      },
    )
  }

  const handleConvert = () => {
    convertLead.mutate(
      { id: lead.id, data: {} },
      {
        onSuccess: (result) => {
          refresh()
          queryClient.invalidateQueries({ queryKey: ["/api/clients"] })
          queryClient.invalidateQueries({ queryKey: ["/api/deals"] })
          toast({ title: "Converted to client", description: `${result.client.name} + open deal created` })
        },
        onError: () => toast({ title: "Convert failed", variant: "destructive" }),
      },
    )
  }

  const handleSetStatus = (newStatus: string, label: string) => {
    updateLead.mutate(
      { id: lead.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          refresh()
          toast({ title: label })
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      },
    )
  }

  const handleAddNote = () => {
    if (!note.trim()) return
    createActivity.mutate(
      { id: lead.id, data: { type: "note", summary: note.trim() } },
      {
        onSuccess: () => {
          setNote("")
          refresh()
          toast({ title: "Note logged" })
        },
        onError: () => toast({ title: "Could not log note", variant: "destructive" }),
      },
    )
  }

  const askTwin = (message: string) => {
    if (!message.trim()) return
    setTurns((prev) => [...prev, { role: "user", content: message }])
    setTwinInput("")
    twinChat.mutate(
      { data: { message, entityType: "lead", entityId: lead.id } },
      {
        onSuccess: (reply) => {
          setTurns((prev) => [
            ...prev,
            { role: "assistant", content: reply.reply, suggestions: reply.suggestions },
          ])
        },
        onError: () =>
          setTurns((prev) => [
            ...prev,
            { role: "assistant", content: "I could not reach the lead context just now. Try again." },
          ]),
      },
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Link href="/leads" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-semibold text-primary">
              {lead.firstName?.[0]}
              {lead.lastName?.[0]}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
              <Badge className={`${status.color} text-white`}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {lead.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {lead.company}
                </span>
              )}
              {lead.jobTitle && <span>• {lead.jobTitle}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.linkedinUrl && (
            <Button variant="outline" size="icon" asChild>
              <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /></a>
            </Button>
          )}
          {lead.email && (
            <Button variant="outline" size="icon" asChild>
              <a href={`mailto:${lead.email}`}><Mail className="h-4 w-4" /></a>
            </Button>
          )}
          {lead.phone && (
            <Button variant="outline" size="icon" asChild>
              <a href={`tel:${lead.phone}`}><Phone className="h-4 w-4" /></a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: context + execute */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow actions */}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 mr-auto">
                <Progress value={lead.score} className="w-24 h-2" />
                <span className="text-sm font-medium">{lead.score} score</span>
              </div>
              {lead.status !== "contacted" && lead.status !== "converted" && (
                <Button variant="outline" size="sm" onClick={() => handleSetStatus("contacted", "Marked as contacted")} disabled={updateLead.isPending}>
                  <UserCheck className="h-4 w-4 mr-2" /> Mark Contacted
                </Button>
              )}
              {lead.status !== "qualified" && lead.status !== "converted" && (
                <Button variant="outline" size="sm" onClick={handleQualify} disabled={qualifyLead.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Qualify
                </Button>
              )}
              {lead.status !== "converted" ? (
                <Button size="sm" onClick={handleConvert} disabled={convertLead.isPending}>
                  <ArrowUpRight className="h-4 w-4 mr-2" /> Convert to Client
                </Button>
              ) : (
                <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Converted</Badge>
              )}
            </CardContent>
          </Card>

          {/* Linked entities */}
          {(client || deal) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {client && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" /> Linked Client
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/clients/${client.id}`} className="font-semibold text-foreground hover:text-primary">
                      {client.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{client.status} • {formatCents(client.mrrCents)} MRR</p>
                  </CardContent>
                </Card>
              )}
              {deal && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <Briefcase className="h-4 w-4" /> Open Deal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-foreground">{deal.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">{deal.stage} • {formatCents(deal.valueCents)} • {deal.probability}%</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Notes / contact */}
          {lead.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-line">{lead.notes}</p></CardContent>
            </Card>
          )}

          {/* Activity timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Log a note or interaction…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                />
                <Button onClick={handleAddNote} disabled={createActivity.isPending || !note.trim()}>Log</Button>
              </div>
              <Separator />
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet. Log the first touch above.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((a) => (
                    <div key={a.id} className="flex gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{a.summary}</p>
                        {a.body && <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {a.actor ? `${a.actor} • ` : ""}{formatDate(a.occurredAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          {tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><ListTodo className="h-4 w-4" /> Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{t.title}</span>
                    <Badge variant="outline" className="capitalize">{t.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: proactive intelligence + grounded Twin */}
        <div className="space-y-6">
          <LeadIntelligencePanel leadId={lead.id} />
          <LeadRecentEmails email={lead.email} />
          <Card className="border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" /> Twin
                <Badge variant="secondary" className="ml-auto text-[10px] font-normal">drafts only</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Grounded in this lead. Suggestions are drafts — you stay in control of every action.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => askTwin("What should I do next with this lead?")} disabled={twinChat.isPending}>
                  <Sparkles className="h-3 w-3 mr-1" /> Next step
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => askTwin("Is this lead ready to qualify?")} disabled={twinChat.isPending}>
                  Ready to qualify?
                </Button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto">
                {turns.map((turn, i) => (
                  <div key={i} className={turn.role === "user" ? "text-right" : ""}>
                    <div className={`inline-block rounded-2xl px-3 py-2 text-sm max-w-[90%] text-left ${turn.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {turn.content}
                    </div>
                    {turn.suggestions && turn.suggestions.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {turn.suggestions.map((s, j) => (
                          <div key={j} className="rounded-lg border border-border p-2 text-left">
                            <p className="text-xs font-medium text-foreground">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {twinChat.isPending && (
                  <div className="bg-muted rounded-2xl px-3 py-2 text-sm inline-block text-muted-foreground">Thinking…</div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Ask about this lead…"
                  value={twinInput}
                  onChange={(e) => setTwinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askTwin(twinInput)}
                  className="text-sm"
                />
                <Button size="icon" onClick={() => askTwin(twinInput)} disabled={twinChat.isPending || !twinInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
