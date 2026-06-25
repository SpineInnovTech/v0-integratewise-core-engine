/**
 * bindings.ts — Service binding interface wrapper
 * Enforces worker-to-worker communication via Service Bindings.
 */

export async function serviceFetch(
  binding: Fetcher | undefined,
  path: string,
  init?: RequestInit
): Promise<Response> {
  if (!binding) {
    throw new Error(`Service binding is not configured for: ${path}`);
  }

  // Ensure absolute path
  const targetPath = path.startsWith("/") ? path : `/${path}`;
  const requestUrl = `http://internal${targetPath}`;
  const request = new Request(requestUrl, init);

  try {
    const response = await binding.fetch(request);
    if (!response.ok) {
      console.error(`[Service Binding Failure] ${path} returned status: ${response.status}`);
    }
    return response;
  } catch (error: any) {
    console.error(`[Service Binding Error] Fetch failed for ${path}:`, error.message);
    throw new Error(`SERVICE_UNAVAILABLE: Service binding invocation failed for path ${path}`);
  }
}
