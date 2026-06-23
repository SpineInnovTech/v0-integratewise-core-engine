/**
 * IT Admin / IT Operations — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the it-admin domain vertical.
 *
 * NOTE: Views align with DOMAIN_SPINE_CONFIG IT_ADMIN entity types:
 * system, device, incident, change_request, vulnerability, backup,
 * certificate, network_device, license, it_metric, generated_insight
 *
 * Folder: /components/onboarding/role-domain/it-admin/
 * Domain: IT_ADMIN
 */

// ─── Core Views ─────────────────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/it-admin/dashboard");

// ─── Individual IT Admin Views (from it-admin-views.tsx) ─────────────────
export const systems = () =>
  import("@/components/l1/domains/it-admin/it-admin-views").then((m) => ({
    default: m.SystemsView,
  }));
export const incidents = () =>
  import("@/components/l1/domains/it-admin/it-admin-views").then((m) => ({
    default: m.IncidentsView,
  }));
export const vulnerabilities = () =>
  import("@/components/l1/domains/it-admin/it-admin-views").then((m) => ({
    default: m.VulnerabilitiesView,
  }));
export const certificates = () =>
  import("@/components/l1/domains/it-admin/it-admin-views").then((m) => ({
    default: m.CertificatesView,
  }));
export const licenses = () =>
  import("@/components/l1/domains/it-admin/it-admin-views").then((m) => ({
    default: m.LicensesView,
  }));

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const itAdminToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ItAdminTodayView,
  }));
export const itAdminQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ItAdminQueueView,
  }));
export const itAdminDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.ItAdminDecisionsView,
  }));
