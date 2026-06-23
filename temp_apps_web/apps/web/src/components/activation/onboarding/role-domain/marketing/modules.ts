/**
 * Marketing — Role-Domain Module Registry
 *
 * Maps module IDs to lazy-loadable component imports.
 * All components originate from the marketing domain vertical.
 *
 * Folder: /components/onboarding/role-domain/marketing/
 * Domain: MARKETING
 */

// ─── Core Marketing Views ───────────────────────────────────────────────────
export const dashboard = () => import("@/components/l1/domains/marketing/dashboard");
export const campaigns = () =>
  import("@/components/l1/domains/marketing/campaigns-view").then((m) => ({
    default: m.CampaignsView,
  }));
export const attribution = () =>
  import("@/components/l1/domains/marketing/attribution-view").then((m) => ({
    default: m.AttributionView,
  }));
export const emailStudio = () =>
  import("@/components/l1/domains/marketing/email-studio-view").then((m) => ({
    default: m.EmailStudioView,
  }));
export const forms = () =>
  import("@/components/l1/domains/marketing/forms-view").then((m) => ({ default: m.FormsView }));
export const social = () =>
  import("@/components/l1/domains/marketing/social-view").then((m) => ({ default: m.SocialView }));
export const leads = () =>
  import("@/components/l1/domains/marketing/marketing-views").then((m) => ({
    default: m.MarketingLeadsView,
  }));
export const marketingAnalytics = () =>
  import("@/components/l1/domains/marketing/marketing-views").then((m) => ({
    default: m.MarketingAnalyticsView,
  }));
export const blog = () =>
  import("@/components/l1/domains/marketing/marketing-views").then((m) => ({
    default: m.MarketingBlogView,
  }));
export const website = () =>
  import("@/components/l1/domains/marketing/marketing-views").then((m) => ({
    default: m.MarketingWebsiteView,
  }));
// shell moved to _deprecated/domain-shells/ — no content-router key maps to shell
// export const shell = () => import("@/components/l1/domains/marketing/shell");

// ─── Happy Path (L2) ───────────────────────────────────────────────────────
export const marketingToday = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.MarketingTodayView,
  }));
export const marketingQueue = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.MarketingQueueView,
  }));
export const marketingDecisions = () =>
  import("@/components/l2/cognitive/domain-happy-path/domain-happy-path-views").then((m) => ({
    default: m.MarketingDecisionsView,
  }));
