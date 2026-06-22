import type { Lead } from "@workspace/db";

export interface Suggestion {
  title: string;
  detail: string;
  kind?: string;
}

// The Twin stays grounded in a real record. These helpers turn the lead's
// actual state into a read (understand), a data check (validate), and a single
// recommended next step (react) — never an executed action.

function nextActionLine(lead: Lead): string {
  switch (lead.status) {
    case "new":
      return "Recommended next step: log a first touch, then qualify if they match your ICP.";
    case "contacted":
      return "Recommended next step: capture the reply, then decide qualify or disqualify.";
    case "qualified":
      return "Recommended next step: convert to a client and open a discovery deal when they commit.";
    case "converted":
      return "This lead is converted — continue the work in its client and deal records.";
    case "unqualified":
    case "lost":
      return "Recommended next step: archive or revisit later; no active work needed.";
    default:
      return "Recommended next step: review the record and set a clear status.";
  }
}

export function buildLeadReply(
  lead: Lead,
  activityCount: number,
  _message: string,
): string {
  const name =
    [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "this lead";
  const company = lead.company ? ` at ${lead.company}` : "";

  const gaps: string[] = [];
  if (!lead.email) gaps.push("no email on file");
  if (!lead.phone) gaps.push("no phone");
  if (!lead.linkedinUrl) gaps.push("no LinkedIn");

  const grounding = `Reading ${name}${company}: status "${lead.status}", score ${lead.score}, source ${lead.source}, ${activityCount} logged ${activityCount === 1 ? "activity" : "activities"}.`;
  const validate = gaps.length
    ? ` Data check: ${gaps.join(", ")}.`
    : " Data check: contact details look complete.";
  const react = ` ${nextActionLine(lead)}`;

  return `${grounding}${validate}${react}`;
}

export function buildLeadSuggestions(lead: Lead): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (!lead.email && !lead.phone) {
    suggestions.push({
      title: "Find a way to reach them",
      detail:
        "No email or phone is on file. Enrich the contact before any outreach so the first touch can actually land.",
      kind: "enrich",
    });
  }

  if (lead.status === "new" || lead.status === "contacted") {
    suggestions.push({
      title: "Qualify this lead",
      detail: `Score is ${lead.score}. If they fit your ICP, mark qualified to move them forward. You stay in control — this is a draft, not an action.`,
      kind: "qualify",
    });
  }

  if (lead.status === "qualified") {
    suggestions.push({
      title: "Convert to client and deal",
      detail:
        "They are qualified. Converting will create a client and an open discovery deal linked to this lead.",
      kind: "convert",
    });
  }

  suggestions.push({
    title: "Draft a first outreach",
    detail: `A short, specific opener for ${[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "this lead"}${lead.company ? ` at ${lead.company}` : ""}. Review and send it yourself.`,
    kind: "draft",
  });

  return suggestions.slice(0, 3);
}
