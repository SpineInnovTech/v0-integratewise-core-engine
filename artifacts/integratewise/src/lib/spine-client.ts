import { apiFetch } from "./api-client";

export interface SpineRecord {
  id: string;
  object_type: string;
  tenant_id: string;
  data: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SpineEntity extends SpineRecord {
  completeness_score?: number;
  fields_present?: number;
  fields_expected?: number;
}

export interface CompletenessScore {
  score: number;
  missing_fields: string[];
  completeness_score?: number;
  fields_present?: number;
  fields_expected?: number;
  missing_expected?: string[];
  missing_required?: string[];
}

export interface SchemaField {
  name?: string;
  field_key?: string;
  type?: string;
  data_type?: string;
  required?: boolean;
  description?: string;
  status?: "required" | "observed" | "optional";
  occurrence_count?: number;
  last_seen_at?: string;
}

export async function spineQuery(
  objectType: string,
  filters?: Record<string, any>
): Promise<SpineRecord[]> {
  try {
    const qs = filters
      ? "?" + new URLSearchParams(filters as Record<string, string>).toString()
      : "";
    const data = await apiFetch<SpineRecord[]>(`/api/v1/pipeline/spine/${objectType}${qs}`);
    return data || [];
  } catch (err) {
    console.error("Spine query error:", err);
    return [];
  }
}

export async function spineGet(objectType: string, id: string): Promise<SpineRecord | null> {
  try {
    const data = await apiFetch<SpineRecord>(`/api/v1/pipeline/spine/${objectType}/${id}`);
    return data || null;
  } catch (err) {
    console.error("Spine get error:", err);
    return null;
  }
}

export async function ingestCSV(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const data = await apiFetch("/api/v1/pipeline/ingest/csv", {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (err) {
    console.error("CSV ingest error:", err);
    throw err;
  }
}

async function getEntity(objectType: string, id: string): Promise<SpineEntity | null> {
  return spineGet(objectType, id) as Promise<SpineEntity | null>;
}

async function getCompleteness(objectType: string, id: string): Promise<CompletenessScore | null> {
  try {
    const data = await apiFetch<CompletenessScore>(
      `/api/v1/pipeline/spine/${objectType}/${id}/completeness`
    );
    return data || null;
  } catch (err) {
    console.error("Get completeness error:", err);
    return null;
  }
}

async function getSchema(objectType: string): Promise<SchemaField[]> {
  try {
    const data = await apiFetch<SchemaField[]>(`/api/v1/pipeline/spine/${objectType}/schema`);
    return data || [];
  } catch (err) {
    console.error("Get schema error:", err);
    return [];
  }
}

export const spineClient = {
  query: spineQuery,
  get: spineGet,
  getEntity,
  getCompleteness,
  getSchema,
  ingestCSV,
};

export function useSpineData(objectType: string, filters?: Record<string, any>) {
  return { data: [] as SpineRecord[], isLoading: false, error: null };
}
