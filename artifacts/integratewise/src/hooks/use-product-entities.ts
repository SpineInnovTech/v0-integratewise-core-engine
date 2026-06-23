/**
 * use-product-entities.ts — Adaptive product data hooks
 *
 * Reads entity data for a product via the product_schema adaptive mapping.
 * Entity types are resolved from the DB with cascade:
 *   team → org → tenant → global defaults
 *
 * When a new connector adds entity types, INSERT into product_schema —
 * views adapt automatically without code changes.
 *
 * @see sql-migrations/071_adaptive_product_schema.sql
 * @see sql-migrations/070_workspace_direct_reads.sql (underlying RPC)
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { spineClient } from "@/utils/spine/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ProductCatalogItem {
  product_id: string;
  display_name: string;
  surface: "account_success" | "business_ops" | "personal_space";
  twin_tier: "no_twin" | "basic_twin" | "full_twin";
  l2_components: string[];
  description: string;
  sort_order: number;
}

export interface ProductSchemaItem {
  entity_type: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductEntitiesResult<T = any> {
  /** Keyed by entity type name */
  data: Record<string, T[]>;
  /** The resolved entity types for this product */
  schema: ProductSchemaItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface ProductCatalogResult {
  products: ProductCatalogItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface ProductSchemaResult {
  schema: ProductSchemaItem[];
  entityTypes: string[];
  primaryType: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface QueryOptions {
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// useProductCatalog — Load all 20 products
// ---------------------------------------------------------------------------
export function useProductCatalog(): ProductCatalogResult {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
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
        const { data: result, error: rpcError } = await spineClient.rpc("get_product_catalog");

        if (cancelRef.current) return;

        if (rpcError) {
          setError(rpcError.message || "Failed to load product catalog");
          setProducts([]);
          return;
        }

        setProducts(Array.isArray(result) ? result : []);
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Failed to load product catalog");
          setProducts([]);
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

  return { products, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// useProductSchema — Load entity type mapping for a product
// ---------------------------------------------------------------------------
export function useProductSchema(
  productId: string,
  options?: Pick<QueryOptions, "enabled">
): ProductSchemaResult {
  const [schema, setSchema] = useState<ProductSchemaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const enabled = options?.enabled !== false;
  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    if (!enabled || !productId) {
      setIsLoading(false);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        const { data: result, error: rpcError } = await spineClient.rpc("get_product_schema", {
          p_product_id: productId,
        });

        if (cancelRef.current) return;

        if (rpcError) {
          setError(rpcError.message || "Failed to load product schema");
          setSchema([]);
          return;
        }

        setSchema(Array.isArray(result) ? result : []);
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Failed to load product schema");
          setSchema([]);
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelRef.current = true;
    };
  }, [productId, enabled, reloadToken]);

  const entityTypes = schema.map((s) => s.entity_type);
  const primaryType = schema.find((s) => s.is_primary)?.entity_type ?? null;

  return { schema, entityTypes, primaryType, isLoading, error, refetch };
}

// ---------------------------------------------------------------------------
// useProductEntities — Load all data for a product (schema + entities)
//
// This is the main hook for product views. It:
//   1. Calls get_product_entities() RPC (which resolves schema via cascade)
//   2. Also loads the schema metadata for rendering hints
//
// Example:
//   const { data, schema } = useProductEntities("fin_pulse");
//   const invoices = data.invoice ?? [];
//   const primary = schema.find(s => s.is_primary)?.entity_type;
// ---------------------------------------------------------------------------
export function useProductEntities<T = any>(
  productId: string,
  options?: QueryOptions
): ProductEntitiesResult<T> {
  const [data, setData] = useState<Record<string, T[]>>({});
  const [schema, setSchema] = useState<ProductSchemaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const cancelRef = useRef(false);

  const enabled = options?.enabled !== false;
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;

  const refetch = useCallback(() => setReloadToken((v) => v + 1), []);

  useEffect(() => {
    if (!enabled || !productId) {
      setIsLoading(false);
      return;
    }

    cancelRef.current = false;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        // Parallel: load schema metadata AND entity data
        const [schemaRes, entitiesRes] = await Promise.all([
          spineClient.rpc("get_product_schema", { p_product_id: productId }),
          spineClient.rpc("get_product_entities", {
            p_product_id: productId,
            p_limit: limit,
            p_offset: offset,
          }),
        ]);

        if (cancelRef.current) return;

        if (schemaRes.error) {
          setError(schemaRes.error.message || "Failed to load product schema");
          setSchema([]);
          setData({});
          return;
        }

        if (entitiesRes.error) {
          setError(entitiesRes.error.message || "Failed to load product data");
          setSchema([]);
          setData({});
          return;
        }

        const schemaItems: ProductSchemaItem[] = Array.isArray(schemaRes.data)
          ? schemaRes.data
          : [];
        setSchema(schemaItems);

        // Normalize: ensure every schema entity type has an array in data
        const normalized: Record<string, T[]> = {};
        for (const item of schemaItems) {
          const rows = (entitiesRes.data as any)?.[item.entity_type];
          normalized[item.entity_type] = Array.isArray(rows) ? rows : [];
        }
        setData(normalized);
      } catch (e: any) {
        if (!cancelRef.current) {
          setError(e?.message || "Failed to load product data");
          setSchema([]);
          setData({});
        }
      } finally {
        if (!cancelRef.current) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelRef.current = true;
    };
  }, [productId, limit, offset, enabled, reloadToken]);

  return { data, schema, isLoading, error, refetch };
}
