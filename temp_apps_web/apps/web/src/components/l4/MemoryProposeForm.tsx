"use client";

import { useState, useRef } from "react";
import { Send, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useGatewayMutation } from "@/hooks/use-gateway-query";

// ─── Types ───────────────────────────────────────────────────────────────────

type MemoryType = "decision" | "outcome" | "learning" | "episode" | "insight" | "pattern";

type Domain = "engineering" | "product" | "ops" | "strategy" | "finance" | "design";

interface ProposePayload {
  title: string;
  body: string;
  type: MemoryType;
  evidence_refs: string[];
  domain: Domain;
}

interface ProposeResponse {
  id: string;
  status: "proposed";
}

const MEMORY_TYPES: { value: MemoryType; label: string }[] = [
  { value: "decision", label: "Decision" },
  { value: "outcome", label: "Outcome" },
  { value: "learning", label: "Learning" },
  { value: "episode", label: "Episode" },
  { value: "insight", label: "Insight" },
  { value: "pattern", label: "Pattern" },
];

const DOMAINS: { value: Domain; label: string }[] = [
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "ops", label: "Operations" },
  { value: "strategy", label: "Strategy" },
  { value: "finance", label: "Finance" },
  { value: "design", label: "Design" },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MemoryProposeForm — Submit a memory proposal via the governed pathway.
 * Calls memory.propose through gateway → MCP layer.
 * NEVER writes directly to org_memory.
 */
export function MemoryProposeForm() {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<MemoryType>("decision");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [domain, setDomain] = useState<Domain>("engineering");

  const proposeMutation = useGatewayMutation<ProposeResponse, ProposePayload>(
    "/api/v1/memory/propose",
    "POST",
    {
      invalidateKeys: [["memory", "governance"]],
      onSuccess: () => {
        // Reset form on success
        setTitle("");
        setBody("");
        setType("decision");
        setEvidenceRefs("");
        setDomain("engineering");
        titleRef.current?.focus();
      },
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    const refs = evidenceRefs
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    proposeMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      type,
      evidence_refs: refs,
      domain,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl" noValidate>
      {/* Success feedback */}
      {proposeMutation.isSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm"
        >
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          Memory proposed successfully. Awaiting governance review.
        </div>
      )}

      {/* Error feedback */}
      {proposeMutation.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-800 text-sm"
        >
          <XCircle className="w-4 h-4" aria-hidden="true" />
          {proposeMutation.error?.message ?? "Failed to propose memory. Try again."}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="memory-title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          ref={titleRef}
          id="memory-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief descriptive title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
        />
      </div>

      {/* Body */}
      <div className="space-y-1.5">
        <label htmlFor="memory-body" className="block text-sm font-medium text-gray-700">
          Body
        </label>
        <textarea
          id="memory-body"
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Full description of this memory entry..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
        />
      </div>

      {/* Type + Domain row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="memory-type" className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            id="memory-type"
            value={type}
            onChange={(e) => setType(e.target.value as MemoryType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
          >
            {MEMORY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="memory-domain" className="block text-sm font-medium text-gray-700">
            Domain
          </label>
          <select
            id="memory-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value as Domain)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
          >
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Evidence refs */}
      <div className="space-y-1.5">
        <label htmlFor="memory-evidence" className="block text-sm font-medium text-gray-700">
          Evidence References
        </label>
        <input
          id="memory-evidence"
          type="text"
          value={evidenceRefs}
          onChange={(e) => setEvidenceRefs(e.target.value)}
          placeholder="Comma-separated refs (e.g. session-id, commit hash, doc link)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
        />
        <p className="text-xs text-gray-500">
          Optional. Link supporting artifacts for governance reviewers.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={proposeMutation.isPending || !title.trim() || !body.trim()}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-iw-forest text-white text-sm font-medium rounded-lg hover:bg-iw-forest/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-iw-forest"
      >
        {proposeMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="w-4 h-4" aria-hidden="true" />
        )}
        {proposeMutation.isPending ? "Proposing..." : "Propose Memory"}
      </button>
    </form>
  );
}
