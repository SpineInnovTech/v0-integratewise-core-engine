/**
 * use-tenant-products.ts — Product-scoped navigation hooks
 *
 * Reads the tenant's assigned products and their nav items from DB.
 * The sidebar renders nav items for the tenant's work product + personal product
 * instead of showing all domain views.
 *
 * Model:
 *   - Each tenant sees 1 work product + 1 personal product (not all 20)
 *   - The sidebar shows views within that product
 *   - Product assignment is stored in tenant_products table
 *   - Nav items per product are stored in product_nav_items table
 *
 * Fallback:
 *   If the DB tables don't exist yet (migration 072 not run), hooks return
 *   null/empty so the shell can fall back to domain-based nav.
 *
 * @see sql-migrations/072_product_nav_and_tenant_products.sql
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { spineClient } from "@/utils/spine/client";
import type { NavSection, NavItem } from "@/components/l1/workspace/workspace-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TenantProduct {
  product_id: string;
  surface: "account_success" | "business_ops" | "personal_space";
  is_default: boolean;
  display_name: string;
  twin_tier: "no_twin" | "basic_twin" | "full_twin";
  description: string;
  assigned_at: string;
}

export interface ProductNavItem {
  view_id: string;
  label: string;
  icon: string;
  section: string;
  sort_order: number;
  path: string;
}

export interface TenantProductsResult {
  /** The tenant's work product (Account Success or Business Ops surface) */
  workProduct: TenantProduct | null;
  /** The tenant's personal product (Personal Space surface) */
  personalProduct: TenantProduct | null;
  /** All assigned products */
  allProducts: TenantProduct[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface ProductNavResult {
  /** Nav sections grouped by section label, ready for sidebar rendering */
  navSections: NavSection[];
  /** Raw nav items from DB */
  rawItems: ProductNavItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// useTenantProducts — Load the current tenant's assigned products
// ---------------------------------------------------------------------------
export function useTenantProducts(): TenantProductsResult {
  const [allProducts, setAllProducts] = useState<TenantProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const { data: result, error: rpcError } = await spineClient.rpc("get_tenant_products");

        if (cancelRef.current) return;

        if (rpcError) {
          // Table might not exist yet (migration 072 not run)
          // Return empty gracefully so the shell falls back to domain nav
          setError(null);
          setAllProducts([]);
          return;
        }

        setAllProducts(Array.isArray(result) ? result : []);
      } catch {
        // Graceful fallback — DB might not have the table yet
        if (!cancelRef.current) {
          setError(null);
          setAllProducts([]);
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelRef.current = true;
    };
  }, [reloadToken]);

  // Derive work product: first non-personal product (account_success or business_ops)
  const workProduct = useMemo(
    () =>
      allProducts.find((p) => p.surface === "account_success" || p.surface === "business_ops") ??
      null,
    [allProducts]
  );

  // Derive personal product: first personal_space product
  const personalProduct = useMemo(
    () => allProducts.find((p) => p.surface === "personal_space") ?? null,
    [allProducts]
  );

  return { workProduct, personalProduct, allProducts, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// useProductNav — Load nav items for a product, grouped into NavSection[]
// ---------------------------------------------------------------------------
export function useProductNav(productId: string | null): ProductNavResult {
  const [rawItems, setRawItems] = useState<ProductNavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      setRawItems([]);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const { data: result, error: rpcError } = await spineClient.rpc("get_product_nav_items", {
          p_product_id: productId,
        });

        if (cancelRef.current) return;

        if (rpcError) {
          // Table might not exist yet — graceful fallback
          setError(null);
          setRawItems([]);
          return;
        }

        setRawItems(Array.isArray(result) ? result : []);
      } catch {
        if (!cancelRef.current) {
          setError(null);
          setRawItems([]);
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelRef.current = true;
    };
  }, [productId, reloadToken]);

  // Group raw items into NavSection[] matching the workspace-config.ts shape
  const navSections: NavSection[] = useMemo(() => {
    if (rawItems.length === 0) return [];

    // Group by section, preserving sort_order
    const grouped = new Map<string, NavItem[]>();

    for (const item of rawItems) {
      if (!grouped.has(item.section)) {
        grouped.set(item.section, []);
      }
      grouped.get(item.section)!.push({
        id: item.view_id,
        label: item.label,
        icon: item.icon,
        path: item.path,
      });
    }

    // Convert to NavSection[], ordered by the min sort_order in each group
    const sectionOrder = new Map<string, number>();
    for (const item of rawItems) {
      const existing = sectionOrder.get(item.section) ?? Infinity;
      sectionOrder.set(item.section, Math.min(existing, item.sort_order));
    }

    const sections: NavSection[] = [];
    const sortedSectionNames = [...grouped.keys()].sort(
      (a, b) => (sectionOrder.get(a) ?? 0) - (sectionOrder.get(b) ?? 0)
    );

    for (const sectionName of sortedSectionNames) {
      sections.push({
        label: sectionName,
        items: grouped.get(sectionName)!,
      });
    }

    return sections;
  }, [rawItems]);

  return { navSections, rawItems, isLoading, error, refetch };
}
