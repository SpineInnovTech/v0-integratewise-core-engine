/**
 * useProjection — Canonical Projection Engine
 *
 * Computes the user-specific slice of Spine based on:
 *   - Role (owner, admin, manager, practitioner/readonly)
 *   - Department (primary dept from profile)
 *   - Industry (tenant's vertical + subsector)
 *   - Depth matrix (cross-dept visibility depth)
 *   - Twin tier (AI capability level)
 *   - Product entitlements (tenant_products)
 *
 * Doctrine: No Workbench component may query raw tables directly.
 * Every read must go through the Projection Layer.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { spineClient } from "@/utils/spine/client";
import type { RoleName } from "@/lib/rbac/roles";
import { projectRole, projectCapabilities, projectEntitlements } from "./rbac-projection"; // Doctrine: Workbench never consumes raw canonical enums
import { resolveContext, type ResolvedContext } from "./context-resolver";
import {
  selectConnectors,
  type ProjectedConnector,
  type ConnectorCatalogEntry,
} from "./connector-projection";
import { connector as connectorApi } from "@/lib/api-client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserContext {
  userId: string;
  role: RoleName;
  department: string;
  orgRole?: string;
  capabilities: ReturnType<typeof projectCapabilities>;
  entitlements: ReturnType<typeof projectEntitlements>;
}

export interface TenantContext {
  tenantId: string;
  industryVertical: string;
  industrySubsector: string | null;
  depthMatrix: Record<string, Record<string, number>>;
  twinTier: "no_twin" | "basic_twin" | "full_twin";
}

export interface ProjectedModule {
  id: string;
  label: string;
  path: string;
  icon: string;
  entityTypes: string[];
  depth: number;
  badge?: string;
}

export interface ProjectedEntityType {
  name: string;
  label: string;
  icon: string;
  priorityFields: string[];
  allowedFields: string[];
  requiredFields: string[];
  searchableFields: string[];
  aiReadableFields: string[];
  architecture: "A" | "B";
}

export interface ProjectedMetric {
  id: string;
  label: string;
  entityType: string;
  field: string;
  aggregation: "sum" | "avg" | "count" | "max" | "min";
  type: "number" | "currency" | "percentage" | "trend";
  priority: number;
}

export interface ProjectionResult {
  user: UserContext;
  tenant: TenantContext;
  modules: ProjectedModule[];
  entityTypes: ProjectedEntityType[];
  metrics: ProjectedMetric[];
  canAct: boolean;
  canApprove: boolean;
  canAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  /** Single coherent role→domain→department→ctx context (fixes CS/BizOps mismatch). */
  context: ResolvedContext;
  /** Exactly five role+industry-matched connectors (fewer only if catalog is smaller). */
  projectedConnectors: ProjectedConnector[];
  connectorsLoading: boolean;
  connectorsError: string | null;
  refetchConnectors: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProjection(seed?: { department?: string; domain?: string }): ProjectionResult {
  // Single-authority seed: the gateway-resolved department/domain (held by AppShell and
  // passed down) is authoritative. When provided, it overrides the independently-queried
  // profile.department so the nav can never diverge from the workbench/content
  // (see docs/architecture/PROJECTION_MODEL.md §5, CURRENT_CONTEXT_FLOW.md).
  const seedDepartment = seed?.department || seed?.domain;
  const isPersonal =
    (seedDepartment || "").toLowerCase() === "personal" ||
    (seed?.domain || "").toUpperCase() === "PERSONAL";
  const [result, setResult] = useState<Omit<
    ProjectionResult,
    | "isLoading"
    | "error"
    | "refetch"
    | "context"
    | "projectedConnectors"
    | "connectorsLoading"
    | "connectorsError"
    | "refetchConnectors"
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  // ── Single coherent context (role authoritative) — fixes CS/BizOps mismatch ──
  const context = useMemo(
    () => resolveContext({ role: seed?.domain, department: seedDepartment, domain: seed?.domain }),
    [seedDepartment, seed?.domain]
  );

  // ── Role + industry connector projection (exactly five, gateway catalog) ──────
  const [projectedConnectors, setProjectedConnectors] = useState<ProjectedConnector[]>([]);
  const [connectorsLoading, setConnectorsLoading] = useState(true);
  const [connectorsError, setConnectorsError] = useState<string | null>(null);
  const [connectorsReload, setConnectorsReload] = useState(0);
  const refetchConnectors = useCallback(() => setConnectorsReload((v) => v + 1), []);

  const industryVertical = result?.tenant.industryVertical;

  useEffect(() => {
    let cancelled = false;
    setConnectorsLoading(true);
    setConnectorsError(null);

    (async () => {
      try {
        const [catalog, statusList] = await Promise.all([
          connectorApi.catalog() as Promise<ConnectorCatalogEntry[]>,
          (connectorApi.list() as Promise<any[]>).catch(() => [] as any[]),
        ]);

        const connectedSet = new Set(
          (statusList || [])
            .filter(
              (c: any) => c?.status === "active" || c?.status === "healthy" || c?.connected === true
            )
            .map((c: any) => String(c.provider || c.tool_name || "").toLowerCase())
        );

        const enriched: ConnectorCatalogEntry[] = (catalog || []).map((c) => ({
          ...c,
          connected: connectedSet.has(String(c.provider || "").toLowerCase()),
        }));

        // Role-authoritative matching input; industry falls back to neutral when unknown.
        const picked = selectConnectors({
          catalog: enriched,
          role: context.isDefault ? "" : context.domain,
          industry: industryVertical || "",
        });

        if (!cancelled) setProjectedConnectors(picked);
      } catch (e: any) {
        if (!cancelled) {
          setConnectorsError(e?.message || "Failed to load connector catalog");
          setProjectedConnectors([]);
        }
      } finally {
        if (!cancelled) setConnectorsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [context.domain, context.isDefault, industryVertical, connectorsReload]);

  useEffect(() => {
    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        // 1. Resolve user context from auth + profiles
        const { data: sessionData } = await spineClient.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) {
          if (!cancelRef.current) setError("Not authenticated");
          return;
        }

        const { data: profile, error: profileError } = await spineClient
          .from("profiles")
          .select("role, department, tenant_id, org_role")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          if (!cancelRef.current) setError(profileError?.message || "Profile not found");
          return;
        }

        const feRole = projectRole(profile.role);
        const capabilities = projectCapabilities(feRole);
        const entitlements = projectEntitlements(feRole);

        const userContext: UserContext = {
          userId,
          role: feRole as RoleName,
          department: seedDepartment || profile.department || undefined,
          orgRole: profile.org_role,
          capabilities,
          entitlements,
        };

        // 2. Resolve tenant spine config
        const { data: tenantConfig, error: tenantError } = await spineClient
          .from("tenant_spine_config")
          .select("tenant_id, industry_vertical, industry_subsector, depth_matrix, twin_tier")
          .eq("tenant_id", profile.tenant_id)
          .single();

        if (tenantError || !tenantConfig) {
          if (!cancelRef.current) setError(tenantError?.message || "Tenant config not found");
          return;
        }

        const tenantContext: TenantContext = {
          tenantId: tenantConfig.tenant_id,
          industryVertical: tenantConfig.industry_vertical || "saas",
          industrySubsector: tenantConfig.industry_subsector,
          depthMatrix: (tenantConfig.depth_matrix as Record<string, Record<string, number>>) || {},
          twinTier: (tenantConfig.twin_tier as TenantContext["twinTier"]) || "no_twin",
        };

        // 3. Resolve product entitlements
        const { data: tenantProducts } = await spineClient
          .from("tenant_products")
          .select("product_id, status")
          .eq("tenant_id", profile.tenant_id)
          .eq("status", "active");

        const entitledProductIds = new Set(tenantProducts?.map((p) => p.product_id) || []);

        // 4. Resolve schema registry for user's department + industry
        const { data: schemaEntries } = await spineClient
          .from("c3BpbmVfc2NoZW1hX3JlZ2lzdHJ5")
          .select("entity_type, priority_fields, field_policies, department, industry_relevance")
          .or(`department.eq.${userContext.department},department.is.null`)
          .or(
            `industry_relevance.cs.{${tenantContext.industryVertical}},industry_relevance.is.null`
          );

        // 5. Resolve entity type map for architecture (A vs B)
        const { data: entityTypeMap } = await spineClient
          .from("entity_type_map")
          .select("entity_type, architecture, department_mapping, label, icon")
          .or(`department_mapping.eq.${userContext.department},department_mapping.is.null`);

        // 6. Build projected entity types
        const projectedEntityTypes: ProjectedEntityType[] = [];
        for (const entry of schemaEntries || []) {
          const mapEntry = entityTypeMap?.find((m) => m.entity_type === entry.entity_type);
          const policies = (entry.field_policies || {}) as Record<string, any>;

          projectedEntityTypes.push({
            name: entry.entity_type,
            label: mapEntry?.label || entry.entity_type,
            icon: mapEntry?.icon || "box",
            priorityFields: (entry.priority_fields as string[]) || [],
            allowedFields: policies.allowed_fields || (entry.priority_fields as string[]) || [],
            requiredFields: policies.required_fields || [],
            searchableFields: policies.searchable || [],
            aiReadableFields: policies.ai_readable || [],
            architecture: (mapEntry?.architecture as "A" | "B") || "B",
          });
        }

        // 7. Build projected modules from product catalog + tenant products
        // This is where we replace hardcoded DOMAIN_CONTENT_MAP
        const { data: productCatalog } = await spineClient
          .from("product_catalog")
          .select("id, name, surface, twin_tier, entity_types, nav_items")
          .eq("surface", userContext.department)
          .lte(
            "twin_tier",
            tenantContext.twinTier === "full_twin"
              ? 3
              : tenantContext.twinTier === "basic_twin"
                ? 2
                : 1
          );

        const projectedModules: ProjectedModule[] = [];
        for (const product of productCatalog || []) {
          if (!entitledProductIds.has(product.id)) continue;

          const navItems = (product.nav_items as any[]) || [];
          for (const nav of navItems) {
            // Filter by depth matrix
            const depth =
              tenantContext.depthMatrix[tenantContext.industryVertical]?.[userContext.department] ||
              1;
            if ((nav.min_depth || 1) > depth) continue;

            projectedModules.push({
              id: nav.id,
              label: nav.label,
              path: nav.path,
              icon: nav.icon || "box",
              entityTypes: (product.entity_types as string[]) || [],
              depth,
            });
          }
        }

        // 8. Build projected metrics from domain config + schema registry
        const projectedMetrics: ProjectedMetric[] = [];
        for (const et of projectedEntityTypes.slice(0, 5)) {
          for (const field of et.priorityFields.slice(0, 3)) {
            projectedMetrics.push({
              id: `${et.name}_${field}`,
              label: field.replace(/_/g, " "),
              entityType: et.name,
              field,
              aggregation: field.includes("count")
                ? "count"
                : field.includes("avg")
                  ? "avg"
                  : "sum",
              type: field.includes("score") || field.includes("rate") ? "percentage" : "number",
              priority: 1,
            });
          }
        }

        if (!cancelRef.current) {
          setResult({
            user: userContext,
            tenant: tenantContext,
            modules: projectedModules,
            entityTypes: projectedEntityTypes,
            metrics: projectedMetrics,
            canAct: feRole !== "viewer",
            canApprove: ["owner", "admin", "manager"].includes(feRole),
            canAdmin: ["owner", "admin"].includes(feRole),
          });
        }
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Projection failed");
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelRef.current = true;
    };
  }, [reloadToken, seedDepartment]);

  // Personal is handled D1-direct via gateway; skip legacy supabase adapter to avoid hangs
  if (isPersonal) {
    const ctx = resolveContext({ role: "personal", department: "personal", domain: "PERSONAL" });
    return {
      user: {
        userId: "",
        role: "personal",
        department: "personal",
        capabilities: {
          canRead: true,
          canWrite: false,
          canApprove: false,
          canAdmin: false,
          canDelete: false,
          canExport: false,
          canInvite: false,
          canConfigure: false,
        },
        entitlements: {
          maxModules: 999,
          maxEntities: 999999,
          canUseTwin: true,
          canUseWorkflows: true,
          canUseAdvancedAnalytics: true,
          canExportData: true,
          canManageConnectors: true,
        },
      },
      tenant: {
        tenantId: "",
        industryVertical: "personal",
        depthMatrix: {},
        twinTier: "basic_twin",
      },
      context: ctx,
      isLoading: false,
      error: null,
      refetch: () => {},
      // minimal for personal nav
    } as any;
  }

  return {
    user: result?.user || {
      userId: "",
      role: "viewer",
      department: seedDepartment || "PERSONAL",
      capabilities: {
        canRead: true,
        canWrite: false,
        canApprove: false,
        canAdmin: false,
        canDelete: false,
        canExport: false,
        canInvite: false,
        canConfigure: false,
      },
      entitlements: {
        maxModules: 3,
        maxEntities: 50,
        canUseTwin: false,
        canUseWorkflows: false,
        canUseAdvancedAnalytics: false,
        canExportData: false,
        canManageConnectors: false,
      },
    },
    tenant: result?.tenant || {
      tenantId: "",
      industryVertical: "saas",
      industrySubsector: null,
      depthMatrix: {},
      twinTier: "no_twin",
    },
    modules: result?.modules || [],
    entityTypes: result?.entityTypes || [],
    metrics: result?.metrics || [],
    canAct: result?.canAct || false,
    canApprove: result?.canApprove || false,
    canAdmin: result?.canAdmin || false,
    isLoading,
    error,
    refetch,
    context,
    projectedConnectors,
    connectorsLoading,
    connectorsError,
    refetchConnectors,
  };
}
