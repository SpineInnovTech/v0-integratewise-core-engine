import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || "",
    bucketName: process.env.GCS_BUCKET_NAME || "integratewise-kb",
    vertexSearchLocation: process.env.VERTEX_SEARCH_LOCATION || "global",
    vertexSearchDatastoreId:
      process.env.VERTEX_SEARCH_DATASTORE_ID || "knowledge-bank_default_data_store",
  },
  firestore: {
    collectionPrefix: process.env.FIRESTORE_COLLECTION_PREFIX || "tenants",
  },
};

// Validate required config
if (!config.gcp.projectId && config.nodeEnv === "production") {
  throw new Error("GCP_PROJECT_ID is required in production");
}
