import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import { config } from "../config";
import type { SearchQuery } from "../types";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

/**
 * Upsert a document to Vertex AI Search using REST API
 */
export async function upsertSearchDocument(
  tenantId: string,
  sessionId: string,
  title: string,
  content: string,
  topics: string[],
  createdAt: string
): Promise<void> {
  const parent = `projects/${config.gcp.projectId}/locations/${config.gcp.vertexSearchLocation}/collections/default_collection/dataStores/${config.gcp.vertexSearchDatastoreId}/branches/default_branch`;

  const document = {
    id: `${tenantId}_${sessionId}`,
    structData: {
      title,
      content,
      tenant_id: tenantId,
      topics,
      created_at: createdAt,
    },
  };

  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `https://${config.gcp.vertexSearchLocation}-discoveryengine.googleapis.com/v1/${parent}/documents:import`;

    await axios.post(
      url,
      {
        inlineSource: {
          documents: [document],
        },
        reconciliationMode: "INCREMENTAL",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error upserting document to Vertex AI Search:", error.message);
    // Non-fatal error - log but don't throw to allow ingestion to continue
  }
}

/**
 * Search documents in Vertex AI Search using REST API
 */
export async function searchDocuments(query: SearchQuery): Promise<any[]> {
  const servingConfig = `projects/${config.gcp.projectId}/locations/${config.gcp.vertexSearchLocation}/collections/default_collection/dataStores/${config.gcp.vertexSearchDatastoreId}/servingConfigs/default_config`;

  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    let filter = `tenant_id: ANY("${query.tenant_id}")`;

    // Add topic filter if specified
    if (query.topic) {
      filter += ` AND topics: ANY("${query.topic}")`;
    }

    // Add date range filters if specified
    if (query.from) {
      filter += ` AND created_at >= "${query.from}"`;
    }
    if (query.to) {
      filter += ` AND created_at <= "${query.to}"`;
    }

    const url = `https://${config.gcp.vertexSearchLocation}-discoveryengine.googleapis.com/v1/${servingConfig}:search`;

    const response = await axios.post(
      url,
      {
        query: query.q,
        pageSize: 20,
        filter,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return (response.data.results || []).map((result: any) => ({
      id: result.document?.id || "",
      title: result.document?.structData?.title || "",
      content: result.document?.structData?.content || "",
      topics: result.document?.structData?.topics || [],
      created_at: result.document?.structData?.created_at || "",
    }));
  } catch (error: any) {
    console.error("Error searching documents:", error.message);
    throw new Error("Search failed: " + error.message);
  }
}

/**
 * Check if Vertex AI Search is accessible
 */
export async function checkSearchAccess(): Promise<boolean> {
  try {
    const servingConfig = `projects/${config.gcp.projectId}/locations/${config.gcp.vertexSearchLocation}/collections/default_collection/dataStores/${config.gcp.vertexSearchDatastoreId}/servingConfigs/default_config`;

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `https://${config.gcp.vertexSearchLocation}-discoveryengine.googleapis.com/v1/${servingConfig}:search`;

    await axios.post(
      url,
      {
        query: "test",
        pageSize: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error: any) {
    console.error("Error checking Vertex AI Search access:", error.message);
    return false;
  }
}
