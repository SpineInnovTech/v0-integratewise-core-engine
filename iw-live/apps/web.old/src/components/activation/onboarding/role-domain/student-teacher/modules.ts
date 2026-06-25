/**
 * Student / Teacher — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the student-teacher domain vertical.
 *
 * Folder: /components/onboarding/role-domain/student-teacher/
 * Domain: STUDENT_TEACHER
 */

// ─── Core Views ─────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/student-teacher/dashboard");
export const atRisk = () => import("@/components/l1/domains/student-teacher/at-risk-view");

// ─── Individual Student-Teacher Views (from student-teacher-views.tsx) ───
export const students = () =>
  import("@/components/l1/domains/student-teacher/student-teacher-views").then((m) => ({
    default: m.StudentsView,
  }));
export const courses = () =>
  import("@/components/l1/domains/student-teacher/student-teacher-views").then((m) => ({
    default: m.CoursesView,
  }));
export const assignments = () =>
  import("@/components/l1/domains/student-teacher/student-teacher-views").then((m) => ({
    default: m.AssignmentsView,
  }));
export const gradebook = () =>
  import("@/components/l1/domains/student-teacher/student-teacher-views").then((m) => ({
    default: m.GradebookView,
  }));

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const studentToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.StudentTeacherTodayView,
  }));
export const studentQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.StudentTeacherQueueView,
  }));
export const studentDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.StudentTeacherDecisionsView,
  }));
