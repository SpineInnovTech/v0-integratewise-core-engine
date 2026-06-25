// Signature verification utilities for webhooks

// Stripe signature verification
export async function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Signature = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1Signature) return false;

  // Check timestamp is within 5 minutes
  const timestampNum = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > 300) return false;

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  return timingSafeEqual(v1Signature, expectedSignature);
}

// HubSpot HMAC signature verification
export async function verifyHubSpotSignature(
  payload: string,
  signature: string | null,
  secret: string,
  requestMethod: string,
  requestUri: string,
  timestamp: string | null
): Promise<boolean> {
  if (!signature || !timestamp) return false;

  // Check timestamp is within 5 minutes
  const timestampMs = parseInt(timestamp, 10);
  const now = Date.now();
  if (Math.abs(now - timestampMs) > 300000) return false;

  // HubSpot v3 signature: HMAC-SHA256(secret, requestMethod + requestUri + body + timestamp)
  const signedPayload = `${requestMethod}${requestUri}${payload}${timestamp}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));

  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return timingSafeEqual(signature, expectedSignature);
}

// Slack signature verification (HMAC-SHA256)
export async function verifySlackSignature(
  payload: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !timestamp) return false;

  // Check timestamp is within 5 minutes (prevents replay attacks)
  const timestampNum = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > 300) return false;

  // Slack signature format: v0=<signature>
  if (!signature.startsWith("v0=")) return false;
  const providedSignature = signature.slice(3);

  // Compute expected signature: HMAC-SHA256(secret, "v0:timestamp:body")
  const signedPayload = `v0:${timestamp}:${payload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  return timingSafeEqual(providedSignature, expectedSignature);
}

// Constant-time string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
