/**
 * Spine Substrate Configuration
 *
 * Reads from env vars (sourced from Doppler / Pages at build time).
 *
 * Supported keys:
 *  - VITE_SPINE_URL, VITE_SPINE_ANON_KEY
 */

const envUrl = import.meta.env.VITE_SPINE_URL || "";
const envKey = import.meta.env.VITE_SPINE_ANON_KEY || "";

// Extract project ID from URL (https://<projectId>.spine.ai or database url)
function extractProjectId(url: string): string {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : "";
}

if (!envUrl || !envKey) {
  console.warn(
    "[Spine] Missing public Spine env vars. Set either VITE_SPINE_URL or VITE_SPINE_ANON_KEY values. " +
      "Run with Doppler: doppler run --config dev_web-unified -- pnpm dev"
  );
}

export const projectId = extractProjectId(envUrl);
export const publicAnonKey = envKey;
