/**
 * Founder Today — L2 insights for founder/operator persona
 * Founder happy path: high-leverage nudges (investor emails, demo follow-ups).
 * L2: useL2Insights(domain=PERSONAL, viewId=founder-today).
 */
import { useState } from "react";
import { Calendar, Zap, ThumbsUp, X } from "lucide-react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2DismissInsight } from "@/hooks/use-l2";
import type { L2Insight } from "@/lib/l2-client";

function SuggestedCard({
  insight,
  onApprove,
  onDismiss,
  isLoading,
}: {
  insight: L2Insight;
  onApprove: () => void;
  onDismiss: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="l2-suggested-card rounded-xl p-6 mb-6 border">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-iw-paper-deep/50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-6 h-6 text-iw-gold-light" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-iw-gold-light/90 uppercase tracking-wide">
            Suggested by IntegrateWise
          </span>
          <h2 className="text-lg font-bold text-white mt-2 mb-2">{insight.title}</h2>
          {insight.whyItMatters && (
            <p className="text-sm text-muted-foreground/80 mb-4">{insight.whyItMatters}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-2 px-4 py-2 bg-iw-paper-warm text-iw-forest rounded-lg font-semibold hover:shadow-lg transition-shadow text-sm border border-iw-rule"
            >
              <ThumbsUp className="w-4 h-4" />
              Show me the path
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-iw-paper-deep/30 text-iw-ink/90 rounded-lg font-medium hover:bg-iw-paper-deep/50 transition-colors text-sm border border-iw-rule/30"
            >
              <X className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FounderTodayView() {
  const auth = useAuth();
  const l2Ctx = auth.user?.id
    ? { userId: auth.user.id, domain: "PERSONAL" as const, viewId: "founder-today" }
    : null;
  const { data: insights = [] } = useL2Insights(l2Ctx);
  const dismissMutation = useL2DismissInsight(l2Ctx);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const visibleInsights = insights.filter((i) => !dismissedIds.has(i.id));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 md:p-8 min-h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[var(--iw-text-secondary)] mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{today}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{greeting}</h1>
          <p className="text-sm text-[var(--iw-text-secondary)]">
            High-leverage nudges for your day
          </p>
        </div>
        {visibleInsights.length > 0 ? (
          visibleInsights.map((insight) => (
            <SuggestedCard
              key={insight.id}
              insight={insight}
              onApprove={() => {
                window.dispatchEvent(
                  new CustomEvent("open-cognitive-layer", { detail: { insightId: insight.id } })
                );
              }}
              onDismiss={() => {
                setDismissedIds((prev) => new Set(prev).add(insight.id));
                dismissMutation.mutate(insight.id);
              }}
              isLoading={dismissMutation.isPending}
            />
          ))
        ) : (
          <div className="l2-suggested-card rounded-xl p-6 border">
            <h2 className="text-lg font-bold text-white mb-2">Today&apos;s insight</h2>
            <p className="text-sm text-foreground/90">
              No high-leverage nudges right now. Check back after your connectors sync.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
