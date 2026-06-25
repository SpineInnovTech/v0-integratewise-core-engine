/**
 * Context Resolver — single source of truth for role → domain → department → CTX.
 *
 * Fixes the "Customer Success department but Business Ops workbench" mismatch by
 * deriving department, workbench domain, and view context (CTX) from ONE resolved
 * role. Role is authoritative; department/domain are realigned to it.
 *
 * Pure module — no network, no React. Fully unit-testable.
 * Spec: role-industry-projection (R4).
 */
import type { Domain } from "@/components/l1/workspace/workspace-config";

export interface ResolvedContext {
  /** Authoritative role (echoed/canonicalized). */
  role: string;
  /** Workbench surface key. */
  domain: Domain;
  /** Human-readable department label, aligned to the domain. */
  department: string;
  /** L2 view context. */
  ctx: string;
  /** True when role/department/domain could not be resolved and a default was used. (Defaults only for personal; work must have explicit chosen domain) */
  isDefault: boolean;
}

const VALID_DOMAINS: Domain[] = [
  "CUSTOMER_SUCCESS",
  "SALES",
  "REVOPS",
  "MARKETING",
  "PRODUCT_ENGINEERING",
  "FINANCE",
  "SERVICE",
  "PROCUREMENT",
  "IT_ADMIN",
  "STUDENT_TEACHER",
  "PERSONAL",
  "BIZOPS",
];

/** Any role/department/domain alias (case/spacing-insensitive) → canonical Domain. */
const ALIAS_TO_DOMAIN: Record<string, Domain> = {
  CUSTOMER_SUCCESS: "CUSTOMER_SUCCESS",
  CS: "CUSTOMER_SUCCESS",
  CSM: "CUSTOMER_SUCCESS",
  ACCOUNT_SUCCESS: "CUSTOMER_SUCCESS",
  SALES: "SALES",
  ACCOUNT_EXECUTIVE: "SALES",
  REVOPS: "REVOPS",
  REVENUE_OPERATIONS: "REVOPS",
  MARKETING: "MARKETING",
  PRODUCT_ENGINEERING: "PRODUCT_ENGINEERING",
  ENGINEERING: "PRODUCT_ENGINEERING",
  PRODUCT: "PRODUCT_ENGINEERING",
  TECH: "PRODUCT_ENGINEERING",
  FINANCE: "FINANCE",
  SERVICE: "SERVICE",
  SUPPORT: "SERVICE",
  SERVICE_OPS: "SERVICE",
  PROCUREMENT: "PROCUREMENT",
  SUPPLY_CHAIN: "PROCUREMENT",
  IT_ADMIN: "IT_ADMIN",
  IT: "IT_ADMIN",
  STUDENT_TEACHER: "STUDENT_TEACHER",
  EDUCATION: "STUDENT_TEACHER",
  PERSONAL: "PERSONAL",
  BIZOPS: "BIZOPS",
  BUSINESS_OPS: "BIZOPS",
  BUSINESS_OPERATIONS: "BIZOPS",
  OPS: "BIZOPS",
};

/** Domain → L2 view context. The ONLY CTX map (replaces AppShell's two divergent maps). */
export const DOMAIN_TO_CTX: Record<Domain, string> = {
  CUSTOMER_SUCCESS: "CTX_CS",
  SALES: "CTX_SALES",
  REVOPS: "CTX_REVOPS",
  MARKETING: "CTX_MARKETING",
  PRODUCT_ENGINEERING: "CTX_TECH",
  FINANCE: "CTX_FINANCE",
  SERVICE: "CTX_SUPPORT",
  PROCUREMENT: "CTX_SUPPLY_CHAIN",
  IT_ADMIN: "CTX_TECH",
  STUDENT_TEACHER: "CTX_PERSONAL",
  PERSONAL: "CTX_PERSONAL",
  BIZOPS: "CTX_BIZOPS",
};

/** Domain → human-readable department label. */
export const DOMAIN_TO_LABEL: Record<Domain, string> = {
  CUSTOMER_SUCCESS: "Customer Success",
  SALES: "Sales",
  REVOPS: "RevOps",
  MARKETING: "Marketing",
  PRODUCT_ENGINEERING: "Product Engineering",
  FINANCE: "Finance",
  SERVICE: "Service",
  PROCUREMENT: "Procurement",
  IT_ADMIN: "IT Admin",
  STUDENT_TEACHER: "Education",
  PERSONAL: "Personal",
  BIZOPS: "Business Ops",
};

/** The ONLY default domain — personal. Per spec: no default domain for any work view. */
export const DEFAULT_DOMAIN: Domain = "PERSONAL";

/** Normalize an arbitrary role/department/domain string to a canonical Domain (or null). */
export function normalizeToDomain(value?: string | null): Domain | null {
  if (!value) return null;
  const key = value
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, "_");
  if (ALIAS_TO_DOMAIN[key]) return ALIAS_TO_DOMAIN[key];
  if (VALID_DOMAINS.includes(key as Domain)) return key as Domain;
  return null;
}

/**
 * Resolve a single coherent context. Precedence: role > department > domain.
 * Whatever resolves first determines domain; department label and CTX are derived
 * from that domain — so they can never disagree.
 */
export function resolveContext(input: {
  role?: string | null;
  department?: string | null;
  domain?: string | null;
}): ResolvedContext {
  const resolved =
    normalizeToDomain(input.role) ??
    normalizeToDomain(input.department) ??
    normalizeToDomain(input.domain);

  if (!resolved) {
    // Per spec: no default domain for work views. Only personal has default.
    // For work, this should not happen if onboarding chose properly; D1 profile is authoritative.
    const fallback = DEFAULT_DOMAIN; // PERSONAL only
    return {
      role: input.role || "",
      domain: fallback,
      department: DOMAIN_TO_LABEL[fallback],
      ctx: DOMAIN_TO_CTX[fallback],
      isDefault: true,
    };
  }

  return {
    role: input.role || resolved,
    domain: resolved,
    department: DOMAIN_TO_LABEL[resolved],
    ctx: DOMAIN_TO_CTX[resolved],
    isDefault: false,
  };
}
