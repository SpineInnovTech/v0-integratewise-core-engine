import { Heart, Loader2, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";

export function SatisfactionView() {
  const { data: projection, loading } = useHydrateProjection<any>("service");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const satisfaction = projection?.satisfaction || {};
  const csatScore = satisfaction.csat || 87;
  const npsScore = satisfaction.nps || 42;
  const recentFeedback = satisfaction.recent || [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Customer Satisfaction
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          CSAT and NPS scores with recent feedback.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-6 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">CSAT Score</div>
          <div className="text-4xl font-bold text-iw-forest-mid mt-2">{csatScore}%</div>
          <div className="text-xs text-muted-foreground mt-1">Customer satisfaction</div>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">NPS</div>
          <div className="text-4xl font-bold text-iw-slate-mid mt-2">{npsScore}</div>
          <div className="text-xs text-muted-foreground mt-1">Net promoter score</div>
        </div>
        <div className="rounded-lg border p-6 text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Responses</div>
          <div className="text-4xl font-bold text-iw-slate-mid mt-2">
            {recentFeedback.length || 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">This period</div>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Recent Feedback</h3>
        </div>
        <div className="divide-y">
          {recentFeedback.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No recent feedback
            </div>
          ) : (
            recentFeedback.map((fb: any, i: number) => (
              <div key={fb.id || i} className="px-4 py-3 flex items-start gap-3">
                <div
                  className={`mt-0.5 ${fb.sentiment === "positive" ? "text-iw-forest-bright" : fb.sentiment === "negative" ? "text-iw-red" : "text-gray-400"}`}
                >
                  {fb.sentiment === "positive" ? (
                    <ThumbsUp className="w-4 h-4" />
                  ) : fb.sentiment === "negative" ? (
                    <ThumbsDown className="w-4 h-4" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{fb.comment || "No comment"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {fb.customer || "Anonymous"} · {fb.date || "—"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default SatisfactionView;
