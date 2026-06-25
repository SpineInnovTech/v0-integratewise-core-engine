"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/components/core/auth/auth-provider";
import { support } from "@/lib/api-client";
import {
  BookOpen,
  Bug,
  ChevronLeft,
  ExternalLink,
  HelpCircle,
  Keyboard,
  Lightbulb,
  Loader2,
  MessageSquare,
  Send,
  SmilePlus,
  TrendingUp,
  X,
} from "lucide-react";

interface HelpWidgetProps {
  position?: "bottom-right" | "bottom-left";
}

type View = "home" | "shortcuts" | "ticket" | "feedback";
type FeedbackKind = "bug" | "feature_request" | "general_feedback" | "csat" | "nps";

const SHORTCUTS = [
  { keys: ["Cmd", "K"], description: "Open the command palette" },
  { keys: ["Cmd", "J"], description: "Open Brainstorm" },
  { keys: ["E"], description: "Toggle the evidence drawer" },
  { keys: ["Cmd", "."], description: "Toggle the workspace sidebar" },
  { keys: ["Esc"], description: "Close the active panel" },
];

export function HelpWidget({ position = "bottom-right" }: HelpWidgetProps) {
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>("bug");
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activity, setActivity] = useState<{
    tickets: Array<Record<string, any>>;
    feedback: Array<Record<string, any>>;
  }>({
    tickets: [],
    feedback: [],
  });

  const [ticketForm, setTicketForm] = useState({
    email: auth.user?.email || "",
    subject: "",
    description: "",
    category: "general",
    priority: "normal",
  });
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const [feedbackForm, setFeedbackForm] = useState({
    subject: "",
    message: "",
    severity: "medium",
    score: 8,
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (auth.user?.email) {
      setTicketForm((current) => ({ ...current, email: auth.user?.email || current.email }));
    }
  }, [auth.user?.email]);

  useEffect(() => {
    if (!isOpen || !auth.accessToken) return;

    let cancelled = false;

    const loadActivity = async () => {
      setLoadingActivity(true);
      setActivityError(null);

      try {
        const data = await support.me();
        if (!cancelled) {
          setActivity({
            tickets: data.tickets || [],
            feedback: data.feedback || [],
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setActivityError(err.message || "We couldn't load your recent support activity.");
        }
      } finally {
        if (!cancelled) {
          setLoadingActivity(false);
        }
      }
    };

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [auth.accessToken, isOpen, ticketSuccess, feedbackSuccess]);

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  const recentRequests = useMemo(() => {
    const tickets = activity.tickets.map((ticket) => ({
      id: ticket.id,
      label: ticket.subject,
      meta: `${formatKind(ticket.category)} • ${formatKind(ticket.status)}`,
      createdAt: ticket.created_at,
    }));

    const feedback = activity.feedback.map((item) => ({
      id: item.id,
      label: item.subject || formatKind(item.request_kind),
      meta:
        item.score !== null && item.score !== undefined
          ? `${formatKind(item.request_kind)} • Score ${item.score}`
          : `${formatKind(item.request_kind)} • ${formatKind(item.status)}`,
      createdAt: item.created_at,
    }));

    return [...tickets, ...feedback]
      .sort((left, right) => Date.parse(right.createdAt || "") - Date.parse(left.createdAt || ""))
      .slice(0, 5);
  }, [activity.feedback, activity.tickets]);

  const resetFeedbackForm = (kind: FeedbackKind) => {
    setFeedbackKind(kind);
    setFeedbackError(null);
    setFeedbackSuccess(null);
    setFeedbackForm({
      subject:
        kind === "bug"
          ? "Bug report"
          : kind === "feature_request"
            ? "Feature request"
            : kind === "csat"
              ? "Support CSAT"
              : kind === "nps"
                ? "Product NPS"
                : "Product feedback",
      message: "",
      severity: kind === "bug" ? "high" : "medium",
      score: kind === "csat" ? 4 : 8,
    });
    setView("feedback");
  };

  const handleTicketSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTicketSubmitting(true);
    setTicketError(null);
    setTicketSuccess(null);

    try {
      const response = await support.createTicket({
        email: ticketForm.email,
        subject: ticketForm.subject,
        description: ticketForm.description,
        category: ticketForm.category,
        priority: ticketForm.priority,
        severity: ticketForm.priority === "urgent" ? "critical" : ticketForm.priority,
        source_surface: "in_app_help_widget",
      });

      setTicketSuccess(response.ticket_id || "submitted");
      setTicketForm((current) => ({
        ...current,
        subject: "",
        description: "",
        category: "general",
        priority: "normal",
      }));
    } catch (err: any) {
      setTicketError(err.message || "We couldn't create your support ticket.");
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      let response: any;

      if (feedbackKind === "csat") {
        response = await support.submitCsat({
          score: feedbackForm.score,
          subject: feedbackForm.subject,
          message: feedbackForm.message,
          source_surface: "in_app_help_widget",
        });
      } else if (feedbackKind === "nps") {
        response = await support.submitNps({
          score: feedbackForm.score,
          subject: feedbackForm.subject,
          message: feedbackForm.message,
          source_surface: "in_app_help_widget",
        });
      } else {
        response = await support.submitFeedback({
          request_kind: feedbackKind,
          subject: feedbackForm.subject,
          message: feedbackForm.message,
          severity: feedbackForm.severity,
          source_surface: "in_app_help_widget",
          create_ticket:
            feedbackKind === "bug" && ["high", "critical"].includes(feedbackForm.severity),
        });
      }

      setFeedbackSuccess(response.id || "submitted");
      setFeedbackForm((current) => ({
        ...current,
        message: "",
      }));
    } catch (err: any) {
      setFeedbackError(err.message || "We couldn't submit your feedback.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      {isOpen ? (
        <div className="absolute bottom-16 right-0 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-slate-950 px-4 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Help and Feedback</h3>
                <p className="mt-1 text-xs text-white/70">
                  Docs, support tickets, and product feedback in one place.
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {view === "home" ? (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setTicketError(null);
                    setTicketSuccess(null);
                    setView("ticket");
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <MessageSquare className="h-4 w-4 text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Create ticket</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Account, connector, or billing help.
                  </p>
                </button>

                <button
                  onClick={() => resetFeedbackForm("bug")}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Bug className="h-4 w-4 text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Report bug</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Route product issues into the queue.
                  </p>
                </button>

                <button
                  onClick={() => resetFeedbackForm("feature_request")}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Lightbulb className="h-4 w-4 text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Request feature</p>
                  <p className="mt-1 text-xs text-slate-500">Tell us what should exist next.</p>
                </button>

                <button
                  onClick={() => setView("shortcuts")}
                  className="rounded-xl border border-slate-200 px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Keyboard className="h-4 w-4 text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Shortcuts</p>
                  <p className="mt-1 text-xs text-slate-500">Quick keyboard reference.</p>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => resetFeedbackForm("csat")}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <SmilePlus className="h-4 w-4 text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Rate support</p>
                </button>
                <button
                  onClick={() => resetFeedbackForm("nps")}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <TrendingUp className="h-4 w-4 text-slate-700" />
                  <p className="mt-2 text-sm font-semibold text-slate-900">Product NPS</p>
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Self-serve help</p>
                    <p className="text-xs text-slate-500">
                      Start with docs before opening a ticket.
                    </p>
                  </div>
                  <BookOpen className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-3 space-y-2">
                  <Link
                    to="/docs"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                  >
                    Documentation
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                  >
                    Contact the team
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </Link>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Recent requests</p>
                  {loadingActivity ? (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  ) : null}
                </div>
                {activityError ? (
                  <p className="mt-2 text-xs text-red-600">{activityError}</p>
                ) : recentRequests.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {recentRequests.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 px-3 py-2">
                        <p className="text-sm font-medium text-slate-900">{item.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Your recent support tickets and feedback will show up here.
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {view === "shortcuts" ? (
            <PanelBack title="Keyboard shortcuts" onBack={() => setView("home")}>
              <div className="space-y-2">
                {SHORTCUTS.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-600"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PanelBack>
          ) : null}

          {view === "ticket" ? (
            <PanelBack title="Create support ticket" onBack={() => setView("home")}>
              <form onSubmit={handleTicketSubmit} className="space-y-3">
                <FieldLabel label="Email">
                  <input
                    type="email"
                    required
                    value={ticketForm.email}
                    onChange={(event) =>
                      setTicketForm((current) => ({ ...current, email: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                  />
                </FieldLabel>
                <FieldLabel label="Subject">
                  <input
                    type="text"
                    required
                    value={ticketForm.subject}
                    onChange={(event) =>
                      setTicketForm((current) => ({ ...current, subject: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                  />
                </FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FieldLabel label="Category">
                    <select
                      value={ticketForm.category}
                      onChange={(event) =>
                        setTicketForm((current) => ({ ...current, category: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="general">General</option>
                      <option value="account_help">Account help</option>
                      <option value="connector_issue">Connector issue</option>
                      <option value="billing_issue">Billing issue</option>
                    </select>
                  </FieldLabel>
                  <FieldLabel label="Priority">
                    <select
                      value={ticketForm.priority}
                      onChange={(event) =>
                        setTicketForm((current) => ({ ...current, priority: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </FieldLabel>
                </div>
                <FieldLabel label="Describe the issue">
                  <textarea
                    required
                    rows={4}
                    value={ticketForm.description}
                    onChange={(event) =>
                      setTicketForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                  />
                </FieldLabel>
                {ticketError ? <InlineError message={ticketError} /> : null}
                {ticketSuccess ? (
                  <InlineSuccess message={`Ticket created. Reference: ${ticketSuccess}`} />
                ) : null}
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ticketSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {ticketSubmitting ? "Submitting..." : "Submit ticket"}
                </button>
              </form>
            </PanelBack>
          ) : null}

          {view === "feedback" ? (
            <PanelBack title={feedbackTitle(feedbackKind)} onBack={() => setView("home")}>
              <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                <FieldLabel label="Subject">
                  <input
                    type="text"
                    required
                    value={feedbackForm.subject}
                    onChange={(event) =>
                      setFeedbackForm((current) => ({ ...current, subject: event.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                  />
                </FieldLabel>

                {feedbackKind === "csat" || feedbackKind === "nps" ? (
                  <FieldLabel label={feedbackKind === "csat" ? "Score (1-5)" : "Score (0-10)"}>
                    <input
                      type="range"
                      min={feedbackKind === "csat" ? 1 : 0}
                      max={feedbackKind === "csat" ? 5 : 10}
                      value={feedbackForm.score}
                      onChange={(event) =>
                        setFeedbackForm((current) => ({
                          ...current,
                          score: Number(event.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <div className="mt-1 text-xs font-medium text-slate-600">
                      Selected score: {feedbackForm.score}
                    </div>
                  </FieldLabel>
                ) : (
                  <FieldLabel label="Severity">
                    <select
                      value={feedbackForm.severity}
                      onChange={(event) =>
                        setFeedbackForm((current) => ({ ...current, severity: event.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </FieldLabel>
                )}

                <FieldLabel
                  label={
                    feedbackKind === "csat" || feedbackKind === "nps"
                      ? "Tell us more (optional)"
                      : "Details"
                  }
                >
                  <textarea
                    rows={4}
                    value={feedbackForm.message}
                    onChange={(event) =>
                      setFeedbackForm((current) => ({ ...current, message: event.target.value }))
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                  />
                </FieldLabel>

                {feedbackError ? <InlineError message={feedbackError} /> : null}
                {feedbackSuccess ? (
                  <InlineSuccess message={`Feedback submitted. Reference: ${feedbackSuccess}`} />
                ) : null}
                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {feedbackSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {feedbackSubmitting ? "Submitting..." : "Submit feedback"}
                </button>
              </form>
            </PanelBack>
          ) : null}
        </div>
      ) : null}

      <button
        onClick={() => {
          setIsOpen((current) => !current);
          setView("home");
        }}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
          isOpen ? "bg-slate-800 text-white" : "bg-slate-950 text-white hover:bg-slate-800"
        }`}
        aria-label={isOpen ? "Close help" : "Open help"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function PanelBack({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-xs font-medium text-slate-500 transition hover:text-slate-700"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

function InlineSuccess({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {message}
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

function feedbackTitle(kind: FeedbackKind) {
  switch (kind) {
    case "bug":
      return "Report a bug";
    case "feature_request":
      return "Request a feature";
    case "csat":
      return "Rate support";
    case "nps":
      return "Product NPS";
    default:
      return "Share feedback";
  }
}
