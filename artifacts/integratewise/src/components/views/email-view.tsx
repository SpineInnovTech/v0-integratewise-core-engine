/**
 * Email Workspace — read, triage, and send through the google-mail connector
 * (via the owned api-server relay; source = local-relay, not the platform
 * gateway — honest and correct).
 *
 * Honesty contract:
 *  - Read / search / send use granted scopes (gmail.readonly, gmail.send).
 *  - Mark-read / archive / apply-label / auto-filter-rules need gmail.modify and
 *    gmail.settings.basic, which are NOT granted — they render visibly DISABLED
 *    with a clear reason. Never faked.
 *  - Every send routes through the GovernanceGate: a human approves each message.
 */
import { useState, useMemo, useEffect } from "react";
import { useSearch } from "wouter";
import {
  useGmailMessages,
  useGmailMessage,
  useGmailThread,
  useGmailLabels,
  useSendEmail,
  type GmailEmail,
  type GmailFullMessage,
} from "@/platform/gateway-email";
import { useLeads } from "@/platform/gateway-leads";
import { SOURCE_META } from "@/platform/data-source";
import { useGovernanceGate, GovernanceGate } from "@/platform/governance-gate";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTwinChat } from "@workspace/api-client-react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Mail,
  Search,
  Star,
  Inbox,
  Send,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  CheckCheck,
  Tag,
  Filter,
  Plus,
  Lock,
  X,
  Bot,
  Sparkles,
  Link2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Untrusted HTML sanitization ─────────────────────────────────────────────
// Email bodies are untrusted external content. Strip scripts, event handlers,
// and dangerous URLs before rendering. Force links to open safely in a new tab.
let _hookInstalled = false;
function ensureSafeLinkHook() {
  if (_hookInstalled) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A" && node.getAttribute("href")) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer nofollow");
    }
  });
  _hookInstalled = true;
}

function sanitizeEmailHtml(html: string): string {
  ensureSafeLinkHook();
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "style"],
    ALLOW_DATA_ATTR: false,
  });
}

// ── Saved filter views ──────────────────────────────────────────────────────

interface FilterView {
  id: string;
  label: string;
  labelIds?: string[];
  q?: string;
  builtin?: boolean;
}

const BUILTIN_VIEWS: FilterView[] = [
  { id: "inbox", label: "Inbox", labelIds: ["INBOX"], builtin: true },
  { id: "unread", label: "Unread", labelIds: ["UNREAD"], builtin: true },
  { id: "starred", label: "Starred", labelIds: ["STARRED"], builtin: true },
  { id: "important", label: "Important", labelIds: ["IMPORTANT"], builtin: true },
  { id: "sent", label: "Sent", labelIds: ["SENT"], builtin: true },
];

const SAVED_VIEWS_KEY = "iw.email.savedViews.v1";

function loadSavedViews(): FilterView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_KEY);
    return raw ? (JSON.parse(raw) as FilterView[]) : [];
  } catch {
    return [];
  }
}

function persistSavedViews(views: FilterView[]) {
  try {
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(views));
  } catch {
    /* ignore */
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(value: string) {
  const d = new Date(value);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** A control that is intentionally disabled because its Gmail scope isn't granted. */
function GatedControl({
  icon: Icon,
  label,
  reason,
}: {
  icon: typeof Archive;
  label: string;
  reason: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 gap-1.5 text-xs opacity-60 cursor-not-allowed"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              <Lock className="h-3 w-3" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px] text-xs">
          {reason}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const MODIFY_REASON =
  "Needs broader Gmail permission (gmail.modify) — not granted. Read, search, and send are available; changing message state is not.";
const SETTINGS_REASON =
  "Needs broader Gmail permission (gmail.settings.basic) — not granted. Server-side auto-filter rules can't be created.";

// ── Compose ─────────────────────────────────────────────────────────────────

interface ComposeState {
  open: boolean;
  mode: "new" | "reply" | "replyAll" | "forward";
  to: string;
  cc: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

const EMPTY_COMPOSE: ComposeState = {
  open: false,
  mode: "new",
  to: "",
  cc: "",
  subject: "",
  body: "",
};

export function EmailView() {
  const { toast } = useToast();
  const searchString = useSearch();
  const gate = useGovernanceGate();
  const sendEmail = useSendEmail();
  const twinChat = useTwinChat();

  const [savedViews, setSavedViews] = useState<FilterView[]>(loadSavedViews);
  const [activeViewId, setActiveViewId] = useState<string>("inbox");
  const [search, setSearch] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<string[]>([]);
  const [compose, setCompose] = useState<ComposeState>(EMPTY_COMPOSE);
  const [twinDraft, setTwinDraft] = useState<string | null>(null);

  // Deep-link support: /email?q=...&open=<messageId>
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const q = params.get("q");
    const open = params.get("open");
    if (q) {
      setSearch(q);
      setSubmittedQuery(q);
    }
    if (open) setSelectedId(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: labels } = useGmailLabels();

  // Live Gmail labels split into category tabs (Primary/Updates/…) and the
  // user's own custom labels (e.g. "To Respond"). These drive labelIds queries.
  const { categoryLabels, userLabels } = useMemo(() => {
    const cats: { id: string; label: string }[] = [];
    const users: { id: string; label: string }[] = [];
    (labels ?? []).forEach((l) => {
      if (l.id.startsWith("CATEGORY_")) {
        cats.push({
          id: l.id,
          label: l.id
            .replace("CATEGORY_", "")
            .toLowerCase()
            .replace(/^\w/, (c) => c.toUpperCase()),
        });
      } else if (l.type === "user") {
        users.push({ id: l.id, label: l.name });
      }
    });
    cats.sort((a, b) => a.label.localeCompare(b.label));
    users.sort((a, b) => a.label.localeCompare(b.label));
    return { categoryLabels: cats, userLabels: users };
  }, [labels]);

  const allViews = useMemo(
    () => [...BUILTIN_VIEWS, ...savedViews],
    [savedViews],
  );

  // Resolve the active view. `label:<id>` ids resolve against live Gmail labels.
  const activeView: FilterView = useMemo(() => {
    if (activeViewId.startsWith("label:")) {
      const labelId = activeViewId.slice("label:".length);
      const match =
        categoryLabels.find((l) => l.id === labelId) ??
        userLabels.find((l) => l.id === labelId);
      return {
        id: activeViewId,
        label: match?.label ?? labelId,
        labelIds: [labelId],
      };
    }
    return allViews.find((v) => v.id === activeViewId) ?? BUILTIN_VIEWS[0];
  }, [activeViewId, allViews, categoryLabels, userLabels]);

  const queryParams = submittedQuery
    ? { q: submittedQuery, pageToken: pageTokens[pageTokens.length - 1] }
    : {
        labelIds: activeView.labelIds,
        q: activeView.q,
        pageToken: pageTokens[pageTokens.length - 1],
      };

  const { data, isPending, isError, error, refetch, isFetching } =
    useGmailMessages(queryParams);

  const { data: leads } = useLeads();

  // sender email → lead id (for CRM chips / deep-linking)
  const leadByEmail = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (leads ?? []).forEach((l) => {
      if (l.email) {
        map.set(l.email.toLowerCase(), {
          id: l.id,
          name: `${l.firstName} ${l.lastName ?? ""}`.trim(),
        });
      }
    });
    return map;
  }, [leads]);

  const emails = data?.emails ?? [];
  const selectedStub = emails.find((e) => e.id === selectedId) ?? null;

  const resetPaging = () => setPageTokens([]);

  const selectView = (id: string) => {
    setActiveViewId(id);
    setSubmittedQuery(null);
    setSearch("");
    setSelectedId(null);
    resetPaging();
  };

  const runSearch = () => {
    if (!search.trim()) {
      setSubmittedQuery(null);
    } else {
      setSubmittedQuery(search.trim());
    }
    setSelectedId(null);
    resetPaging();
  };

  const saveCurrentSearch = () => {
    if (!submittedQuery) return;
    const view: FilterView = {
      id: `saved-${Date.now()}`,
      label: submittedQuery.length > 24 ? `${submittedQuery.slice(0, 24)}…` : submittedQuery,
      q: submittedQuery,
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    persistSavedViews(next);
    setActiveViewId(view.id);
    toast({ title: "View saved", description: view.label });
  };

  const removeSavedView = (id: string) => {
    const next = savedViews.filter((v) => v.id !== id);
    setSavedViews(next);
    persistSavedViews(next);
    if (activeViewId === id) selectView("inbox");
  };

  // ── Compose / send ──
  const openReply = (
    msg: GmailFullMessage,
    mode: "reply" | "replyAll" | "forward",
  ) => {
    const cleanSubject = msg.subject.replace(/^(re:|fwd:)\s*/i, "");
    const prefix = mode === "forward" ? "Fwd: " : "Re: ";
    const quoted = `\n\n----- On ${msg.date}, ${msg.sender_name} <${msg.sender_email}> wrote: -----\n${(msg.body_text || msg.preview).slice(0, 2000)}`;

    // Reply-all: gather the To + Cc recipients, drop the primary reply target
    // (the original sender) and de-duplicate so nobody appears twice.
    const replyAllCc = [msg.to, msg.cc]
      .filter(Boolean)
      .join(",")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter(
        (addr) =>
          !addr.toLowerCase().includes(msg.sender_email.toLowerCase()),
      );
    const dedupedCc = Array.from(
      new Map(replyAllCc.map((a) => [a.toLowerCase(), a])).values(),
    ).join(", ");

    setTwinDraft(null);
    setCompose({
      open: true,
      mode,
      to: mode === "forward" ? "" : msg.sender_email,
      cc: mode === "replyAll" ? dedupedCc : "",
      subject: `${prefix}${cleanSubject}`,
      body: mode === "forward" ? quoted : "",
      threadId: mode === "forward" ? undefined : msg.threadId,
      inReplyTo: mode === "forward" ? undefined : msg.messageIdHeader,
      references: mode === "forward"
        ? undefined
        : [msg.references, msg.messageIdHeader].filter(Boolean).join(" "),
    });
  };

  const openCompose = () => {
    setTwinDraft(null);
    setCompose({ ...EMPTY_COMPOSE, open: true });
  };

  const submitSend = () => {
    if (!compose.to.trim() || !compose.body.trim()) {
      toast({ title: "Recipient and message are required", variant: "destructive" });
      return;
    }
    gate.request({
      operation: "Send email",
      entity: `To: ${compose.to}`,
      impact: `This sends a real email via Gmail${
        compose.cc ? ` (cc ${compose.cc})` : ""
      } with subject "${compose.subject || "(no subject)"}". Outbound messages cannot be unsent.`,
      onConfirm: () => {
        sendEmail.mutate(
          {
            to: compose.to,
            cc: compose.cc || undefined,
            subject: compose.subject,
            body: compose.body,
            threadId: compose.threadId,
            inReplyTo: compose.inReplyTo,
            references: compose.references,
          },
          {
            onSuccess: () => {
              toast({ title: "Email sent", description: compose.to });
              setCompose(EMPTY_COMPOSE);
            },
            onError: (err) =>
              toast({
                title: "Send failed",
                description: err.message,
                variant: "destructive",
              }),
          },
        );
      },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <GovernanceGate gate={gate} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-light tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" /> Email
          </h1>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
            style={{
              background: SOURCE_META["local-relay"].bg,
              color: SOURCE_META["local-relay"].fg,
            }}
            title={SOURCE_META["local-relay"].description}
          >
            {SOURCE_META["local-relay"].label}
          </span>
        </div>
        <Button onClick={openCompose} className="rounded-full px-5">
          <Plus className="h-4 w-4 mr-1.5" /> Compose
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left rail — saved filter views */}
        <aside className="w-52 border-r border-border/50 p-3 hidden md:flex flex-col gap-1 overflow-y-auto">
          <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Views
          </p>
          {BUILTIN_VIEWS.map((v) => {
            const Icon =
              v.id === "starred"
                ? Star
                : v.id === "sent"
                  ? Send
                  : v.id === "unread"
                    ? Mail
                    : Inbox;
            return (
              <button
                key={v.id}
                onClick={() => selectView(v.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors",
                  activeViewId === v.id && !submittedQuery
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <Icon className="h-4 w-4" /> {v.label}
              </button>
            );
          })}

          {categoryLabels.length > 0 && (
            <>
              <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Categories
              </p>
              {categoryLabels.map((l) => {
                const viewId = `label:${l.id}`;
                return (
                  <button
                    key={viewId}
                    onClick={() => selectView(viewId)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors",
                      activeViewId === viewId && !submittedQuery
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    <Tag className="h-4 w-4" /> {l.label}
                  </button>
                );
              })}
            </>
          )}

          {userLabels.length > 0 && (
            <>
              <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Labels
              </p>
              {userLabels.map((l) => {
                const viewId = `label:${l.id}`;
                return (
                  <button
                    key={viewId}
                    onClick={() => selectView(viewId)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left transition-colors",
                      activeViewId === viewId && !submittedQuery
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-secondary",
                    )}
                  >
                    <Tag className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{l.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {savedViews.length > 0 && (
            <>
              <p className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Saved
              </p>
              {savedViews.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-1 rounded-lg pl-2.5 pr-1 py-1.5 text-sm group transition-colors",
                    activeViewId === v.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-secondary",
                  )}
                >
                  <button
                    onClick={() => {
                      setActiveViewId(v.id);
                      setSubmittedQuery(v.q ?? null);
                      setSearch(v.q ?? "");
                      setSelectedId(null);
                      resetPaging();
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <Filter className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{v.label}</span>
                  </button>
                  <button
                    onClick={() => removeSavedView(v.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive"
                    title="Remove saved view"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Honest gated capability */}
          <div className="mt-auto pt-3">
            <GatedControl
              icon={Filter}
              label="Auto-filter rules"
              reason={SETTINGS_REASON}
            />
          </div>
        </aside>

        {/* Middle — message list */}
        <section className="w-full max-w-md border-r border-border/50 flex flex-col min-h-0">
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mail (e.g. from:acme is:unread)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                className="pl-9 h-9"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSubmittedQuery(null);
                    resetPaging();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {submittedQuery ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={saveCurrentSearch}
                >
                  <Plus className="h-3 w-3 mr-1" /> Save this view
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground truncate">
                  {activeView.label}
                </span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 ml-auto"
                onClick={() => refetch()}
                title="Refresh"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {isError ? (
              <div className="p-6 text-sm text-destructive text-center">
                <p className="font-semibold">Gmail unavailable</p>
                {error && <p className="mt-1 text-destructive/80">{error.message}</p>}
              </div>
            ) : isPending ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No messages in this view.
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {emails.map((m) => (
                  <MessageRow
                    key={m.id}
                    email={m}
                    active={selectedId === m.id}
                    linkedLead={leadByEmail.get(m.sender_email.toLowerCase())}
                    onClick={() => setSelectedId(m.id)}
                  />
                ))}
              </ul>
            )}
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between p-2 border-t border-border/50">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              disabled={pageTokens.length === 0}
              onClick={() => {
                setPageTokens((prev) => prev.slice(0, -1));
                setSelectedId(null);
              }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {data?.resultSizeEstimate
                ? `~${data.resultSizeEstimate} results`
                : ""}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              disabled={!data?.nextPageToken}
              onClick={() => {
                if (data?.nextPageToken) {
                  setPageTokens((prev) => [...prev, data.nextPageToken!]);
                  setSelectedId(null);
                }
              }}
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </section>

        {/* Right — reading pane */}
        <section className="flex-1 min-w-0 hidden lg:flex flex-col min-h-0">
          {selectedId ? (
            <ReadingPane
              messageId={selectedId}
              fallback={selectedStub}
              linkedLead={
                selectedStub
                  ? leadByEmail.get(selectedStub.sender_email.toLowerCase())
                  : undefined
              }
              leadByEmail={leadByEmail}
              onReply={openReply}
              twinChat={twinChat}
              twinDraft={twinDraft}
              setTwinDraft={setTwinDraft}
              onUseDraft={(draft) =>
                setCompose((c) =>
                  c.open ? { ...c, body: draft } : c,
                )
              }
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a message to read</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Compose dialog */}
      <Dialog
        open={compose.open}
        onOpenChange={(o) => !o && setCompose(EMPTY_COMPOSE)}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {compose.mode === "new"
                ? "New message"
                : compose.mode === "forward"
                  ? "Forward"
                  : compose.mode === "replyAll"
                    ? "Reply all"
                    : "Reply"}
            </DialogTitle>
            <DialogDescription>
              Every send is reviewed before it goes out — you approve each
              message through the governance gate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                To
              </Label>
              <Input
                value={compose.to}
                onChange={(e) => setCompose({ ...compose, to: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cc
              </Label>
              <Input
                value={compose.cc}
                onChange={(e) => setCompose({ ...compose, cc: e.target.value })}
                placeholder="optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subject
              </Label>
              <Input
                value={compose.subject}
                onChange={(e) =>
                  setCompose({ ...compose, subject: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Message
              </Label>
              <Textarea
                rows={9}
                value={compose.body}
                onChange={(e) =>
                  setCompose({ ...compose, body: e.target.value })
                }
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCompose(EMPTY_COMPOSE)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={submitSend}
              disabled={sendEmail.isPending}
              className="rounded-full px-6"
            >
              <Send className="h-4 w-4 mr-1.5" />
              {sendEmail.isPending ? "Sending…" : "Review & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Message row ─────────────────────────────────────────────────────────────

function MessageRow({
  email,
  active,
  linkedLead,
  onClick,
}: {
  email: GmailEmail;
  active: boolean;
  linkedLead?: { id: string; name: string };
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-4 py-3 transition-colors flex flex-col gap-1",
          active ? "bg-primary/5" : "hover:bg-secondary/40",
          !email.is_read && "bg-blue-500/[0.04]",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold text-foreground/70 flex-shrink-0">
            {initials(email.sender_name)}
          </div>
          <span
            className={cn(
              "text-sm truncate flex-1",
              !email.is_read ? "font-semibold text-foreground" : "text-foreground/80",
            )}
          >
            {email.sender_name}
          </span>
          {email.is_starred && (
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
          )}
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatDate(email.received_at)}
          </span>
        </div>
        <p
          className={cn(
            "text-sm truncate",
            !email.is_read ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {email.subject}
        </p>
        <p className="text-xs text-muted-foreground truncate">{email.preview}</p>
        {linkedLead && (
          <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
            <Link2 className="h-3 w-3" /> {linkedLead.name}
          </span>
        )}
      </button>
    </li>
  );
}

// ── Reading pane ────────────────────────────────────────────────────────────

function ReadingPane({
  messageId,
  fallback,
  linkedLead,
  leadByEmail,
  onReply,
  twinChat,
  twinDraft,
  setTwinDraft,
  onUseDraft,
}: {
  messageId: string;
  fallback: GmailEmail | null;
  linkedLead?: { id: string; name: string };
  leadByEmail: Map<string, { id: string; name: string }>;
  onReply: (msg: GmailFullMessage, mode: "reply" | "replyAll" | "forward") => void;
  twinChat: ReturnType<typeof useTwinChat>;
  twinDraft: string | null;
  setTwinDraft: (v: string | null) => void;
  onUseDraft: (draft: string) => void;
}) {
  // Resolve the thread id from the list stub when present, otherwise fetch the
  // single message (deep-links arrive with only a message id, no stub).
  const { data: single } = useGmailMessage(fallback ? null : messageId);
  const threadId = fallback?.threadId ?? single?.threadId ?? null;

  const { data: thread, isPending, isError, error } = useGmailThread(threadId);

  const latest = thread?.messages?.[thread.messages.length - 1];

  const askTwinDraft = () => {
    if (!latest) return;
    setTwinDraft(null);
    const context = `Draft a reply to this email.\nFROM: ${latest.sender_name} <${latest.sender_email}>\nSUBJECT: ${latest.subject}\nBODY:\n${(latest.body_text || latest.preview).slice(0, 1500)}`;
    twinChat.mutate(
      { data: { message: context, entityType: "email", entityId: latest.id } },
      {
        onSuccess: (reply) => {
          const parts = reply.reply.split("\n---\n");
          setTwinDraft(parts.length > 1 ? parts[1].trim() : reply.reply);
        },
        onError: () => setTwinDraft("Couldn't reach the Twin just now."),
      },
    );
  };

  const headerSubject =
    thread?.messages[0]?.subject ?? fallback?.subject ?? single?.subject ?? "";

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Action bar */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={!latest}
          onClick={() => latest && onReply(latest, "reply")}
        >
          <Reply className="h-3.5 w-3.5" /> Reply
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={!latest}
          onClick={() => latest && onReply(latest, "replyAll")}
        >
          <ReplyAll className="h-3.5 w-3.5" /> Reply all
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          disabled={!latest}
          onClick={() => latest && onReply(latest, "forward")}
        >
          <Forward className="h-3.5 w-3.5" /> Forward
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        {/* Honest gated controls */}
        <GatedControl icon={CheckCheck} label="Mark read" reason={MODIFY_REASON} />
        <GatedControl icon={Archive} label="Archive" reason={MODIFY_REASON} />
        <GatedControl icon={Tag} label="Apply label" reason={MODIFY_REASON} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {isError ? (
            <p className="text-sm text-destructive">
              Couldn't load this thread. {error?.message}
            </p>
          ) : isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-medium text-foreground">
                  {headerSubject}
                </h2>
                {linkedLead ? (
                  <Link
                    href={`/leads/${linkedLead.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20 transition-colors whitespace-nowrap"
                  >
                    <Link2 className="h-3.5 w-3.5" /> {linkedLead.name}
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    No CRM match
                  </span>
                )}
              </div>

              {(thread?.messages ?? []).map((msg) => {
                const senderLead = leadByEmail.get(
                  msg.sender_email.toLowerCase(),
                );
                return (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-border/60 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 border-b border-border/40">
                      <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground/70">
                        {initials(msg.sender_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {msg.sender_name}{" "}
                          {senderLead && (
                            <Link
                              href={`/leads/${senderLead.id}`}
                              className="text-primary text-xs font-normal hover:underline"
                            >
                              · {senderLead.name}
                            </Link>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {msg.sender_email}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(msg.received_at)}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      {msg.body_html ? (
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert text-sm [&_a]:text-primary"
                          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(msg.body_html) }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">
                          {msg.body_text || msg.preview}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Twin draft */}
              <div className="rounded-xl border border-primary/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Twin</span>
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    drafts only
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs ml-auto"
                    onClick={askTwinDraft}
                    disabled={twinChat.isPending || !latest}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Draft a reply
                  </Button>
                </div>
                {twinChat.isPending && (
                  <p className="text-sm text-muted-foreground">Drafting…</p>
                )}
                {twinDraft && (
                  <div className="space-y-2">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 bg-muted/50 rounded-lg p-3">
                      {twinDraft}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        if (latest) onReply(latest, "reply");
                        // populate compose body after it opens
                        setTimeout(() => onUseDraft(twinDraft), 0);
                      }}
                    >
                      Use this draft in a reply
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
