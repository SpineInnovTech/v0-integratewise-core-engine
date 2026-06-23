import type { Lead } from "@workspace/db";
import { GetLeadIntelligenceResponse } from "@workspace/api-zod";

// Lead Intelligence ("Obtain It") is a privileged, read-only relay.
//
// Doctrine (see replit.md): Customer Zero does NOT own connectors, ICP, or
// strategy. It must never store a copy of the org's ICP/policy (copies go
// stale) and never fabricate. So this service holds no Apollo/Notion keys and
// does NO local scoring. It reads everything LIVE, at lead-open time, through
// the platform intelligence gateway, which owns truth and stamps freshness.
//
// When the gateway is not configured or unreachable we degrade honestly:
// status "gateway_unavailable" (HTTP 200), verdict "unknown", every answer is
// literally "unknown — needs enrichment". We never return a guessed verdict or
// stale data.

const QUESTIONS = [
  "why_qualified",
  "why_first_fit",
  "problem",
  "current_solution",
  "in_our_track",
  "recommended_action",
] as const;

const GATEWAY_TIMEOUT_MS = 6000;

function domainFromEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain || null;
}

function buildUnavailable(
  leadId: string,
  status: "gateway_unavailable" | "error",
  message: string,
) {
  return {
    status,
    leadId,
    verdict: "unknown",
    fitScore: null,
    computedAt: new Date().toISOString(),
    summary: null,
    signals: [],
    answers: QUESTIONS.map((question) => ({
      question,
      basis: "unknown",
      answer: "unknown — needs enrichment",
      citations: [],
      unknownReason: message,
    })),
    sources: [
      { name: "Apollo", kind: "company_facts", asOf: null, url: null, status: "unavailable" },
      { name: "Notion", kind: "icp", asOf: null, url: null, status: "unavailable" },
      { name: "Notion", kind: "policy", asOf: null, url: null, status: "unavailable" },
    ],
    gateway: { status: "unavailable", message, retryAfterSeconds: null },
  };
}

export async function getLeadIntelligence(lead: Lead): Promise<unknown> {
  const baseUrl = process.env["INTELLIGENCE_GATEWAY_URL"];

  if (!baseUrl) {
    return buildUnavailable(
      lead.id,
      "gateway_unavailable",
      "Intelligence gateway not connected. Set INTELLIGENCE_GATEWAY_URL so Customer Zero can read ICP, policy and company facts live through the platform. Nothing is stored or guessed here.",
    );
  }

  // The gateway owns the connectors and the wiki. We hand it only the lead
  // context it needs to look the company up live; it returns the grounded
  // result already tagged evidence/inference with freshness stamps.
  const context = {
    leadId: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName ?? null,
    company: lead.company ?? null,
    domain: domainFromEmail(lead.email ?? null),
    jobTitle: lead.jobTitle ?? null,
    email: lead.email ?? null,
  };

  const url = `${baseUrl.replace(/\/$/, "")}/leads/intelligence`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(context),
      signal: controller.signal,
    });

    if (!resp.ok) {
      return buildUnavailable(
        lead.id,
        "gateway_unavailable",
        `Intelligence gateway responded ${resp.status}.`,
      );
    }

    const payload = (await resp.json()) as Record<string, unknown>;
    // Validate the gateway's response against the contract. If it does not
    // match, we report an honest error rather than passing through or guessing.
    const validated = GetLeadIntelligenceResponse.safeParse({
      ...payload,
      leadId: lead.id,
    });
    if (!validated.success) {
      return buildUnavailable(
        lead.id,
        "error",
        "Intelligence gateway returned an unexpected shape.",
      );
    }

    // Guard the "answers all six questions" guarantee: a ready response that
    // silently omits questions would let the panel show a partial read. If the
    // gateway under-delivers, we degrade honestly rather than render a gap.
    if (validated.data.status === "ready") {
      const present = new Set(validated.data.answers.map((a) => a.question));
      const missing = QUESTIONS.filter((q) => !present.has(q));
      if (missing.length > 0) {
        return buildUnavailable(
          lead.id,
          "error",
          `Intelligence gateway omitted answers: ${missing.join(", ")}.`,
        );
      }
    }

    return validated.data;
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Intelligence gateway timed out."
        : "Intelligence gateway is unreachable.";
    return buildUnavailable(lead.id, "gateway_unavailable", message);
  } finally {
    clearTimeout(timer);
  }
}
