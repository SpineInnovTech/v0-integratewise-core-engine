import { useEffect, useMemo, useState } from "react";
import { admin } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ContactSubmission = Record<string, any>;
type SupportTicket = Record<string, any>;
type FeedbackSubmission = Record<string, any>;

export default function FabricAdminView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSubmission[]>([]);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

  const loadSupportOps = async () => {
    setLoading(true);
    setError(null);

    try {
      const [contactsResponse, ticketsResponse, feedbackResponse] = await Promise.all([
        admin.contactSubmissions({ limit: 12 }),
        admin.supportTickets({ limit: 12 }),
        admin.feedbackSubmissions({ limit: 12 }),
      ]);

      setContactSubmissions(contactsResponse.submissions || []);
      setTickets(ticketsResponse.tickets || []);
      setFeedback(feedbackResponse.feedback || []);
    } catch (err: any) {
      setError(err.message || "We couldn't load support operations right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSupportOps();
  }, []);

  const summary = useMemo(() => {
    const openTickets = tickets.filter(
      (ticket) => ticket.status !== "resolved" && ticket.status !== "closed"
    ).length;
    const pendingZendesk =
      contactSubmissions.filter((item) => item.external_status === "pending_config").length +
      tickets.filter((item) => item.external_status === "pending_config").length +
      feedback.filter((item) => item.external_status === "pending_config").length;

    return {
      contactVolume: contactSubmissions.length,
      openTickets,
      feedbackVolume: feedback.length,
      pendingZendesk,
    };
  }, [contactSubmissions, feedback, tickets]);

  const updateTicket = async (ticketId: string, patch: Record<string, unknown>) => {
    setUpdatingTicketId(ticketId);
    setError(null);

    try {
      await admin.updateSupportTicket(ticketId, patch);
      await loadSupportOps();
    } catch (err: any) {
      setError(err.message || "We couldn't update that support ticket.");
    } finally {
      setUpdatingTicketId(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Support Ops
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Customer enquiries, tickets, and feedback
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Gateway intake, admin persistence, and Zendesk linkage now converge here. Use this
              view to spot backlog, sync gaps, and customer signal volume.
            </p>
          </div>
          <Button onClick={() => void loadSupportOps()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        {error ? (
          <div className="rounded-xl border border-iw-red/20 bg-iw-red/5 px-4 py-3 text-sm text-iw-red">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="New enquiries"
            value={summary.contactVolume}
            copy="Latest contact intake"
          />
          <SummaryCard
            title="Open tickets"
            value={summary.openTickets}
            copy="Active customer support work"
          />
          <SummaryCard
            title="Feedback events"
            value={summary.feedbackVolume}
            copy="Product signal captured"
          />
          <SummaryCard
            title="Zendesk pending"
            value={summary.pendingZendesk}
            copy="Records waiting on external sync config"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Support Tickets</CardTitle>
            <Badge variant="secondary">{tickets.length} loaded</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.length === 0 ? (
              <EmptyState copy="No support tickets have been created yet." />
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border border-border px-4 py-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatKind(ticket.category)} • {ticket.user_email || "Unknown requester"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Zendesk: {formatKind(ticket.external_status)}
                        {ticket.external_ticket_id ? ` • #${ticket.external_ticket_id}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{formatKind(ticket.status)}</Badge>
                      <Badge variant="secondary">{formatKind(ticket.priority)}</Badge>
                      {ticket.owner ? <Badge>{ticket.owner}</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingTicketId === ticket.id || ticket.status === "in_progress"}
                      onClick={() =>
                        void updateTicket(ticket.id, {
                          status: "in_progress",
                        })
                      }
                    >
                      {updatingTicketId === ticket.id ? "Updating..." : "Mark in progress"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={updatingTicketId === ticket.id || ticket.status === "resolved"}
                      onClick={() =>
                        void updateTicket(ticket.id, {
                          status: "resolved",
                          external_status: ticket.external_status || "resolved",
                        })
                      }
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Submissions</CardTitle>
              <Badge variant="secondary">{contactSubmissions.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactSubmissions.length === 0 ? (
                <EmptyState copy="No public enquiries have been submitted yet." />
              ) : (
                contactSubmissions.map((submission) => (
                  <div key={submission.id} className="rounded-xl border border-border px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{submission.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {submission.email} •{" "}
                          {formatKind(submission.request_kind || submission.inquiry_type)}
                        </p>
                      </div>
                      <Badge variant="outline">{formatKind(submission.external_status)}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {submission.message}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Feedback Stream</CardTitle>
              <Badge variant="secondary">{feedback.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {feedback.length === 0 ? (
                <EmptyState copy="No product feedback has been captured yet." />
              ) : (
                feedback.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {item.subject || formatKind(item.request_kind)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatKind(item.request_kind)}
                          {item.score !== null && item.score !== undefined
                            ? ` • Score ${item.score}`
                            : ""}
                        </p>
                      </div>
                      <Badge variant="outline">{formatKind(item.external_status)}</Badge>
                    </div>
                    {item.message ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.message}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, copy }: { title: string; value: number; copy: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{copy}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ copy }: { copy: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
      {copy}
    </p>
  );
}

function formatKind(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
