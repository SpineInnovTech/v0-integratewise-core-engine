/** Main domain for IntegrateWise */
export const MAIN_DOMAIN = "https://integratewise.ai";

/** App entry URLs — marketing CTAs (Sign in / Sign up). Same app: use relative paths. */
const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env?.VITE_APP_ORIGIN as string) || MAIN_DOMAIN;

export const APP_ORIGIN = origin;
export const APP_ENTRY_URL = "/app";
export const APP_LOGIN_URL = "/app";
export const APP_SIGNUP_URL = "/app?signup=1";

/**
 * Demo booking URL used by some landing components.
 * Override via `VITE_DEMO_CALENDLY_URL` when you want an external Calendly link.
 */
export const DEMO_CALENDLY_URL =
  (import.meta.env?.VITE_DEMO_CALENDLY_URL as string | undefined) || "/demo";

/** Use case IDs from landing → Domain IDs in app */
export const USE_CASE_TO_DOMAIN: Record<string, string> = {
  "revenue-ops": "REVOPS",
  "customer-success": "CUSTOMER_SUCCESS",
  sales: "SALES",
  marketing: "MARKETING",
  product: "PRODUCT_ENGINEERING",
  bizops: "BIZOPS",
  finance: "FINANCE",
};

export function getSignupUrl(useCaseId?: string): string {
  if (!useCaseId) return APP_SIGNUP_URL;
  const domain = USE_CASE_TO_DOMAIN[useCaseId];
  if (!domain) return APP_SIGNUP_URL;
  return `${APP_SIGNUP_URL}&domain=${encodeURIComponent(domain)}`;
}
