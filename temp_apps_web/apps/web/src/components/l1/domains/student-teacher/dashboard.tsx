/**
 * Student/Teacher Dashboard — Student progress, course performance, at-risk alerts
 * Data from Spine Education projection.
 */
import {
  GraduationCap,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";
import { useWorkspaceEntitiesBatch } from "@/hooks/use-workspace-entities";
import { ReadinessBar } from "@/components/l2/spine/readiness-bar";

export function StudentTeacherDashboard() {
  const { data: projection, loading } = useHydrateProjection<any>("student_teacher");
  const { data: batch } = useWorkspaceEntitiesBatch([
    "student",
    "course",
    "assignment",
    "generated_insight",
  ]);
  const students = batch.student ?? [];
  const courses = batch.course ?? [];
  const assignments = batch.assignment ?? [];
  const insights = batch.generated_insight ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const summary = projection?.summary || {};
  const totalStudents = summary.totalStudents ?? students.length;
  const avgGpa = summary.avgGpa ?? 0;
  const atRiskCount = summary.atRiskCount ?? students.filter((s: any) => s.at_risk).length;
  const activeCourses = summary.activeCourses ?? courses.length;
  const attendanceRate = summary.attendanceRate ?? 0;
  const completionRate = summary.completionRate ?? 0;

  const gradeDistribution = projection?.gradeDistribution || [];
  const atRiskStudents = students.filter((s: any) => s.at_risk).slice(0, 5);
  const newInsights = insights
    .filter((i: any) => i.status === "new" || i.status === "New")
    .slice(0, 4);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <ReadinessBar department="student_teacher" />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI
          label="Students"
          value={String(totalStudents)}
          icon={<Users className="w-4 h-4" />}
          color="var(--iw-forest-mid)"
        />
        <KPI
          label="Avg GPA"
          value={avgGpa > 0 ? avgGpa.toFixed(2) : "—"}
          icon={<GraduationCap className="w-4 h-4" />}
          color="var(--iw-success)"
        />
        <KPI
          label="At Risk"
          value={String(atRiskCount)}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="var(--iw-danger)"
        />
        <KPI
          label="Courses"
          value={String(activeCourses)}
          icon={<BookOpen className="w-4 h-4" />}
          color="var(--iw-gold)"
        />
        <KPI
          label="Attendance"
          value={attendanceRate > 0 ? `${attendanceRate}%` : "—"}
          icon={<CheckCircle className="w-4 h-4" />}
          color="var(--iw-teal)"
        />
        <KPI
          label="Completion"
          value={completionRate > 0 ? `${completionRate}%` : "—"}
          icon={<TrendingUp className="w-4 h-4" />}
          color="var(--iw-warning)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Grade Distribution</h3>
          {gradeDistribution.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="var(--iw-forest-mid)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
              Connect your LMS to see grade distribution
            </div>
          )}
        </div>

        {/* At-Risk Students */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">At-Risk Students</h3>
            <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)]" />
          </div>
          {atRiskStudents.length > 0 ? (
            <div className="space-y-2">
              {atRiskStudents.map((s: any, i: number) => (
                <div
                  key={s.student_id || i}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-iw-red/10 flex items-center justify-center text-iw-red text-xs font-bold">
                    {(s.student_name || "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.student_name || "Unknown"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      GPA: {s.gpa ?? "—"} · Attendance: {s.attendance_rate ?? "—"}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No at-risk students detected
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Active Courses</h3>
          {courses.length > 0 ? (
            <div className="space-y-2">
              {courses.slice(0, 5).map((c: any, i: number) => (
                <div
                  key={c.course_id || i}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.course_name || "Untitled"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.instructor || "—"} · {c.enrollment_count ?? 0} enrolled
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{c.completion_rate ?? 0}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Connect your LMS to see courses
            </p>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">AI Insights</h3>
          {newInsights.length > 0 ? (
            <div className="space-y-2">
              {newInsights.map((insight: any, i: number) => (
                <div
                  key={insight.insight_id || i}
                  className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <p className="text-sm">{insight.insight_text || insight.recommended_action}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{insight.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              AI insights appear as data flows through the Spine
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

export default StudentTeacherDashboard;
