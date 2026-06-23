/**
 * Student-Teacher Inner Views — Students, Courses, Assignments, Gradebook
 * All data from Spine SSOT student_teacher projection.
 *
 * Entity types from DOMAIN_SPINE_CONFIG.STUDENT_TEACHER:
 * student, course, assignment, grade, attendance, discussion, project,
 * learning_objective, intervention, student_metric, generated_insight
 */
import { useState, useMemo } from "react";
import {
  Users,
  BookOpen,
  FileText,
  BarChart3,
  Search,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  GraduationCap,
  TrendingUp,
  Calendar,
  Star,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useHydrateProjection } from "@/components/core/hydration/use-hydrate-projection";

/* ═══════════ Students Directory ═══════════ */
export function StudentsView() {
  const { data: proj } = useHydrateProjection<any>("student_teacher");
  const students = proj?.students || [];
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = students;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s: any) =>
          s.student_name?.toLowerCase().includes(q) ||
          s.program?.toLowerCase().includes(q) ||
          s.cohort?.toLowerCase().includes(q)
      );
    }
    if (riskFilter === "at-risk") {
      list = list.filter((s: any) => s.at_risk);
    } else if (riskFilter === "healthy") {
      list = list.filter((s: any) => !s.at_risk);
    }
    return list;
  }, [students, search, riskFilter]);

  const gpaColor = (gpa: number | null) => {
    if (gpa === null || gpa === undefined) return "var(--muted-foreground)";
    if (gpa >= 3.5) return "var(--iw-success)";
    if (gpa >= 2.5) return "var(--iw-warning)";
    return "var(--iw-danger)";
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Students
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
            {["all", "at-risk", "healthy"].map((f) => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${riskFilter === f ? "bg-[var(--iw-gold)]/15 text-[var(--iw-gold)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: riskFilter === f ? 600 : 400 }}
              >
                {f === "all"
                  ? `All (${students.length})`
                  : f === "at-risk"
                    ? `At Risk (${students.filter((s: any) => s.at_risk).length})`
                    : "Healthy"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-gold)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> Add Student
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s: any) => (
            <div
              key={s.student_id || s.id}
              onClick={() => setSelectedStudent(s)}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                  style={{
                    fontWeight: 600,
                    backgroundColor: s.at_risk ? "rgba(244,67,54,0.1)" : "rgba(94, 146, 119,0.1)",
                    color: s.at_risk ? "var(--iw-danger)" : "var(--iw-gold)",
                  }}
                >
                  {(s.student_name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm truncate" style={{ fontWeight: 600 }}>
                    {s.student_name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {s.program || s.grade_level || "—"} · {s.cohort || "—"}
                  </p>
                </div>
                {s.at_risk && (
                  <AlertTriangle className="w-4 h-4 text-[var(--iw-danger)] shrink-0" />
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  GPA:{" "}
                  <span style={{ fontWeight: 600, color: gpaColor(s.gpa) }}>
                    {s.gpa?.toFixed(2) ?? "—"}
                  </span>
                </span>
                <span>Attendance: {s.attendance_rate != null ? `${s.attendance_rate}%` : "—"}</span>
                <span className="capitalize">{s.enrollment_status || "—"}</span>
              </div>
              {s.engagement_score != null && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(s.engagement_score, 100)}%`,
                        backgroundColor:
                          s.engagement_score >= 70 ? "var(--iw-success)" : "var(--iw-warning)",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">
                    {s.engagement_score}% engaged
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {students.length === 0
              ? "No students yet. Connect your LMS to populate."
              : "No students match your search"}
          </p>
        )}
      </div>
      {selectedStudent && (
        <StudentDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}

/* ═══════════ Courses ═══════════ */
export function CoursesView() {
  const { data: proj } = useHydrateProjection<any>("student_teacher");
  const courses = proj?.courses || [];
  const [search, setSearch] = useState("");

  const filtered = courses.filter(
    (c: any) =>
      !search ||
      c.course_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Courses
            </h2>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-none outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-gold)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Course
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div
            className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 600 }}
          >
            <span>Course</span>
            <span>Instructor</span>
            <span>Enrolled</span>
            <span>Avg Grade</span>
            <span>Completion</span>
            <span>Credits</span>
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {courses.length === 0
                ? "No courses yet. Connect your LMS."
                : "No courses match your search"}
            </p>
          )}
          {filtered.map((c: any) => (
            <div
              key={c.course_id || c.id}
              className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 cursor-pointer items-center"
            >
              <div className="min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                  {c.course_name}
                </p>
                <p className="text-[10px] text-muted-foreground">{c.semester || "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground truncate">{c.instructor || "—"}</span>
              <span className="text-sm" style={{ fontWeight: 600 }}>
                {c.enrollment_count ?? "—"}
              </span>
              <span
                className="text-sm"
                style={{
                  fontWeight: 600,
                  color:
                    (c.avg_grade ?? 0) >= 80
                      ? "var(--iw-success)"
                      : (c.avg_grade ?? 0) >= 60
                        ? "var(--iw-warning)"
                        : c.avg_grade
                          ? "var(--iw-danger)"
                          : "var(--muted-foreground)",
                }}
              >
                {c.avg_grade != null ? `${c.avg_grade}%` : "—"}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary max-w-[60px]">
                  <div
                    className="h-full rounded-full bg-[var(--iw-gold)]"
                    style={{ width: `${c.completion_rate ?? 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{c.completion_rate ?? 0}%</span>
              </div>
              <span className="text-xs text-muted-foreground">{c.credits ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════ Assignments ═══════════ */
export function AssignmentsView() {
  const { data: proj } = useHydrateProjection<any>("student_teacher");
  const assignments = proj?.assignments || [];
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return assignments;
    return assignments.filter((a: any) => a.status === statusFilter);
  }, [assignments, statusFilter]);

  const statusColor: Record<string, string> = {
    active: "var(--iw-success)",
    upcoming: "var(--iw-forest-bright)",
    grading: "var(--iw-warning)",
    completed: "var(--iw-gold)",
    overdue: "var(--iw-danger)",
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg" style={{ fontWeight: 600 }}>
              Assignments
            </h2>
            {["all", "active", "upcoming", "grading", "completed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-full capitalize ${statusFilter === s ? "bg-[var(--iw-gold)]/15 text-[var(--iw-gold)]" : "bg-secondary text-muted-foreground"}`}
                style={{ fontWeight: statusFilter === s ? 600 : 400 }}
              >
                {s === "all" ? `All (${assignments.length})` : s}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[var(--iw-gold)] text-white hover:opacity-90">
            <Plus className="w-3.5 h-3.5" /> New Assignment
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            {assignments.length === 0
              ? "No assignments yet. Connect your LMS to populate."
              : "No assignments match this filter"}
          </p>
        )}
        {filtered.map((a: any) => (
          <div
            key={a.assignment_id || a.id}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(94, 146, 119,0.1)" }}
                >
                  <FileText className="w-4 h-4 text-[var(--iw-gold)]" />
                </div>
                <div>
                  <p className="text-sm" style={{ fontWeight: 600 }}>
                    {a.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Due: {a.due_date || "—"} · {a.submissions ?? 0} submissions
                  </p>
                </div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                style={{
                  backgroundColor: `${statusColor[a.status] || "var(--muted-foreground)"}15`,
                  color: statusColor[a.status] || "var(--muted-foreground)",
                  fontWeight: 600,
                }}
              >
                {a.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
              {a.avg_score != null && <span>Avg score: {a.avg_score}%</span>}
              {a.late_submissions != null && a.late_submissions > 0 && (
                <span className="text-[var(--iw-warning)]">
                  {a.late_submissions} late submission{a.late_submissions > 1 ? "s" : ""}
                </span>
              )}
              {a.course_id && <span>Course: {a.course_id}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ Gradebook ═══════════ */
export function GradebookView() {
  const { data: proj } = useHydrateProjection<any>("student_teacher");
  const grades = proj?.grades || [];
  const gradeDistribution = proj?.gradeDistribution || [];
  const courses = proj?.courses || [];

  // Build summary by course
  const courseSummary = useMemo(() => {
    const map = new Map<string, { name: string; grades: number[]; count: number }>();
    for (const g of grades) {
      const key = g.course_id || "unknown";
      if (!map.has(key)) {
        const course = courses.find((c: any) => c.course_id === key);
        map.set(key, { name: course?.course_name || key, grades: [], count: 0 });
      }
      const entry = map.get(key)!;
      if (g.score != null) entry.grades.push(g.score);
      entry.count++;
    }
    return Array.from(map.values()).map((e) => ({
      ...e,
      avg:
        e.grades.length > 0
          ? Math.round(e.grades.reduce((a, b) => a + b, 0) / e.grades.length)
          : null,
    }));
  }, [grades, courses]);

  const letterGradeColor = (letter: string) => {
    if (letter === "A" || letter === "A+") return "var(--iw-success)";
    if (letter === "B" || letter === "B+") return "var(--iw-forest-bright)";
    if (letter === "C" || letter === "C+") return "var(--iw-warning)";
    return "var(--iw-danger)";
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg" style={{ fontWeight: 600 }}>
        Gradebook
      </h2>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Grades" value={String(grades.length)} color="var(--iw-gold)" />
        <MetricCard
          label="Class Average"
          value={
            grades.length > 0
              ? `${Math.round(grades.reduce((s: number, g: any) => s + (g.score || 0), 0) / grades.length)}%`
              : "—"
          }
          color="var(--iw-forest-bright)"
        />
        <MetricCard
          label="Courses Graded"
          value={String(courseSummary.length)}
          color="var(--iw-teal)"
        />
      </div>

      {/* Grade Distribution */}
      {gradeDistribution.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm mb-4" style={{ fontWeight: 600 }}>
            Grade Distribution
          </h3>
          <div className="h-[200px]">
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
                <Bar dataKey="count" fill="var(--iw-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Grades Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div
          className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider"
          style={{ fontWeight: 600 }}
        >
          <span>Student</span>
          <span>Course</span>
          <span>Assignment</span>
          <span>Score</span>
          <span>Letter</span>
          <span>Graded</span>
        </div>
        {grades.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No grades recorded yet. Grades flow in through your LMS connection.
          </p>
        )}
        {grades.slice(0, 30).map((g: any, idx: number) => (
          <div
            key={g.grade_id || idx}
            className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 items-center"
          >
            <span className="text-sm truncate" style={{ fontWeight: 500 }}>
              {g.student_name || g.student_id || "—"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {g.course_name || g.course_id || "—"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {g.assignment_name || g.assignment_id || "—"}
            </span>
            <span className="text-sm" style={{ fontWeight: 600 }}>
              {g.score != null ? `${g.score}%` : "—"}
            </span>
            <span
              className="text-sm"
              style={{
                fontWeight: 700,
                color: g.grade_letter
                  ? letterGradeColor(g.grade_letter)
                  : "var(--muted-foreground)",
              }}
            >
              {g.grade_letter || "—"}
            </span>
            <span className="text-xs text-muted-foreground">{g.graded_at || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Student Drawer ─── */
function StudentDrawer({ student, onClose }: { student: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg" style={{ fontWeight: 600 }}>
                {student.student_name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {student.program || student.grade_level || "—"} · {student.cohort || "—"}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">GPA</p>
              <p className="text-lg" style={{ fontWeight: 700, color: "var(--iw-gold)" }}>
                {student.gpa?.toFixed(2) ?? "—"}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground">Attendance</p>
              <p className="text-lg" style={{ fontWeight: 700, color: "var(--iw-forest-bright)" }}>
                {student.attendance_rate != null ? `${student.attendance_rate}%` : "—"}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <InfoRow label="Status" value={student.enrollment_status || "—"} />
            <InfoRow label="Advisor" value={student.advisor || "—"} />
            <InfoRow
              label="Engagement"
              value={student.engagement_score != null ? `${student.engagement_score}%` : "—"}
            />
            <InfoRow label="At Risk" value={student.at_risk ? "Yes" : "No"} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared Helpers ─── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm" style={{ fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl" style={{ fontWeight: 700, color }}>
        {value}
      </p>
    </div>
  );
}
