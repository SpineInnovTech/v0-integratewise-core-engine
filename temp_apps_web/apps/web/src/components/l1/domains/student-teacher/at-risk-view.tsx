/**
 * Student / Teacher — At-risk students
 * Spine-hydrated view for students flagged for attendance, grades, or engagement.
 * L2-wired: insights + recommendations.
 */
import { useState, useMemo } from "react";
import { useAuth } from "@/components/core/auth/auth-provider";
import { useL2Insights, useL2Recommendations } from "@/hooks/use-l2";
import { AlertTriangle, Search, TrendingDown, Clock, Users } from "lucide-react";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";

export function StudentTeacherAtRiskView() {
  const auth = useAuth();
  const userId = auth?.user?.id ?? "";
  const ctx = useMemo(
    () => (userId ? { userId, domain: "STUDENT_TEACHER" as const, viewId: "at-risk" } : null),
    [userId]
  );
  useL2Insights(ctx);
  useL2Recommendations(ctx);

  const { data: proj } = useHydrateProjection<any>("student_teacher");
  const students = proj?.students || [];
  const interventions = proj?.interventions || [];
  const [search, setSearch] = useState("");

  // Filter to at-risk students only
  const atRiskStudents = useMemo(() => {
    let list = students.filter((s: any) => s.at_risk);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s: any) =>
          s.student_name?.toLowerCase().includes(q) || s.program?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, search]);

  const riskReasonColor = (reason: string) => {
    switch (reason?.toLowerCase()) {
      case "attendance":
        return "var(--iw-warning)";
      case "grades":
        return "var(--iw-danger)";
      case "engagement":
        return "var(--iw-forest-mid)";
      default:
        return "var(--muted-foreground)";
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              At-Risk Students
            </h2>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(244,67,54,0.1)",
                color: "var(--iw-danger)",
                fontWeight: 600,
              }}
            >
              {atRiskStudents.length} flagged
            </span>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search at-risk students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Students flagged for attendance, grades, or engagement. AI-suggested interventions can be
          reviewed and approved here.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {students.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No student data yet. Connect your LMS to detect at-risk students.
            </p>
          </div>
        ) : atRiskStudents.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No at-risk students detected. All students are performing within acceptable
              thresholds.
            </p>
          </div>
        ) : (
          atRiskStudents.map((s: any) => {
            // Find related interventions
            const studentInterventions = interventions.filter(
              (i: any) => i.student_id === s.student_id || i.student_id === s.id
            );
            return (
              <div
                key={s.student_id || s.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full bg-iw-red/10 flex items-center justify-center text-iw-red text-sm shrink-0"
                      style={{ fontWeight: 700 }}
                    >
                      {(s.student_name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm" style={{ fontWeight: 600 }}>
                        {s.student_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.program || s.grade_level || "—"} · {s.cohort || "—"} · Advisor:{" "}
                        {s.advisor || "—"}
                      </p>
                    </div>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)] shrink-0" />
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">GPA:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          (s.gpa ?? 0) < 2.0
                            ? "var(--iw-danger)"
                            : (s.gpa ?? 0) < 2.5
                              ? "var(--iw-warning)"
                              : "var(--muted-foreground)",
                      }}
                    >
                      {s.gpa?.toFixed(2) ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Attendance:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          (s.attendance_rate ?? 100) < 75
                            ? "var(--iw-danger)"
                            : (s.attendance_rate ?? 100) < 85
                              ? "var(--iw-warning)"
                              : "var(--muted-foreground)",
                      }}
                    >
                      {s.attendance_rate != null ? `${s.attendance_rate}%` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">Engagement:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          (s.engagement_score ?? 100) < 40
                            ? "var(--iw-danger)"
                            : (s.engagement_score ?? 100) < 60
                              ? "var(--iw-warning)"
                              : "var(--muted-foreground)",
                      }}
                    >
                      {s.engagement_score != null ? `${s.engagement_score}%` : "—"}
                    </span>
                  </div>
                </div>
                {studentInterventions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <p
                      className="text-[10px] text-muted-foreground mb-1"
                      style={{ fontWeight: 600 }}
                    >
                      Interventions ({studentInterventions.length})
                    </p>
                    {studentInterventions.slice(0, 2).map((i: any, idx: number) => (
                      <p key={idx} className="text-[11px] text-muted-foreground">
                        {i.type}: {i.recommended_action || i.notes || "—"} ({i.status || "pending"})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
