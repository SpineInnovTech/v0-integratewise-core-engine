"use client";

import { useState } from "react";
import { Eye, EyeOff, Flag, Loader2, CheckCircle } from "lucide-react";
import { useGatewayQuery, useGatewayMutation } from "@/hooks/use-gateway-query";

// ─── Types ───────────────────────────────────────────────────────────────────

type Domain = "engineering" | "product" | "ops" | "strategy" | "finance" | "design";

interface MemoryVisibilityItem {
  id: string;
  title: string;
  domain: Domain;
  shared: boolean;
  cross_domain_visible: boolean;
}

interface VisibilityListResponse {
  items: MemoryVisibilityItem[];
}

interface ToggleSharePayload {
  memory_id: string;
  shared: boolean;
}

interface FlagReviewPayload {
  memory_id: string;
}

interface MutationResponse {
  success: boolean;
}

const DOMAINS: { value: Domain | "all"; label: string }[] = [
  { value: "all", label: "All Domains" },
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "ops", label: "Operations" },
  { value: "strategy", label: "Strategy" },
  { value: "finance", label: "Finance" },
  { value: "design", label: "Design" },
];

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MemoryVisibilityControls — Domain scoping, share/unshare toggle,
 * and flag-for-re-review button. Respects cross-domain visibility rules.
 */
export function MemoryVisibilityControls() {
  const [domainFilter, setDomainFilter] = useState<Domain | "all">("all");
  const [flaggedId, setFlaggedId] = useState<string | null>(null);

  const params: Record<string, string> = {};
  if (domainFilter !== "all") params.domain = domainFilter;

  const { data, isLoading, error } = useGatewayQuery<VisibilityListResponse>(
    ["memory", "visibility", domainFilter],
    "/api/v1/memory/visibility",
    params
  );

  const toggleShareMutation = useGatewayMutation<MutationResponse, ToggleSharePayload>(
    "/api/v1/memory/visibility/toggle-share",
    "POST",
    { invalidateKeys: [["memory", "visibility"]] }
  );

  const flagReviewMutation = useGatewayMutation<MutationResponse, FlagReviewPayload>(
    "/api/v1/memory/visibility/flag-review",
    "POST",
    {
      invalidateKeys: [["memory", "governance"]],
      onSuccess: (_data, variables) => {
        setFlaggedId(variables.memory_id);
        setTimeout(() => setFlaggedId(null), 3000);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" role="status">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-hidden="true" />
        <span className="sr-only">Loading visibility settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">
        Failed to load visibility settings: {error.message ?? "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Domain filter */}
      <div className="space-y-1.5">
        <label
          htmlFor="visibility-domain-filter"
          className="block text-sm font-medium text-gray-700"
        >
          Filter by Domain
        </label>
        <select
          id="visibility-domain-filter"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value as Domain | "all")}
          className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-iw-forest focus:border-transparent"
        >
          {DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Items list */}
      {!data?.items.length ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No memory items found for this domain filter.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100" aria-label="Memory visibility items">
          {data.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 py-3 px-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.domain}
                  {item.cross_domain_visible && " · Cross-domain visible"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Share/Unshare toggle */}
                <button
                  type="button"
                  onClick={() =>
                    toggleShareMutation.mutate({
                      memory_id: item.id,
                      shared: !item.shared,
                    })
                  }
                  disabled={toggleShareMutation.isPending}
                  aria-label={item.shared ? `Unshare "${item.title}"` : `Share "${item.title}"`}
                  aria-pressed={item.shared}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-iw-forest ${
                    item.shared
                      ? "bg-iw-forest/10 text-iw-forest hover:bg-iw-forest/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item.shared ? (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {item.shared ? "Shared" : "Private"}
                </button>

                {/* Flag for re-review */}
                <button
                  type="button"
                  onClick={() => flagReviewMutation.mutate({ memory_id: item.id })}
                  disabled={flagReviewMutation.isPending}
                  aria-label={`Flag "${item.title}" for re-review`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
                >
                  {flaggedId === item.id ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                  ) : (
                    <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {flaggedId === item.id ? "Flagged" : "Re-review"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
