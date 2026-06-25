import { Storage } from "@google-cloud/storage";
import { config } from "../config";

const storage = new Storage({
  projectId: config.gcp.projectId,
});

const bucket = storage.bucket(config.gcp.bucketName);

/**
 * Upload session summary to GCS
 * Path: gs://<bucket>/<tenant_id>/sessions/<session_id>/summary.md
 */
export async function uploadSessionSummary(
  tenantId: string,
  sessionId: string,
  summaryMarkdown: string
): Promise<string> {
  const filePath = `${tenantId}/sessions/${sessionId}/summary.md`;
  const file = bucket.file(filePath);

  await file.save(summaryMarkdown, {
    contentType: "text/markdown",
    metadata: {
      cacheControl: "public, max-age=3600",
    },
  });

  return `gs://${config.gcp.bucketName}/${filePath}`;
}

/**
 * Download session summary from GCS
 */
export async function downloadSessionSummary(gcsPath: string): Promise<string> {
  // Extract bucket and file path from gs:// URL
  const match = gcsPath.match(/^gs:\/\/([^\/]+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid GCS path");
  }

  const [, bucketName, filePath] = match;
  const file = storage.bucket(bucketName).file(filePath);

  const [contents] = await file.download();
  return contents.toString("utf-8");
}

/**
 * Check if bucket exists and is accessible
 */
export async function checkBucketAccess(): Promise<boolean> {
  try {
    const [exists] = await bucket.exists();
    return exists;
  } catch (error) {
    console.error("Error checking bucket access:", error);
    return false;
  }
}
