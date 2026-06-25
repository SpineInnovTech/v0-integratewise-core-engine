/**
 * Secure JWT Helper using Web Crypto APIs (RS256)
 */

export interface JWTPayload {
  iss: string;
  aud: string;
  sub: string;
  tenant_id: string;
  role: string;
  scope: string;
  exp: number;
  iat: number;
  nbf?: number;
  [key: string]: any;
}

// Canonical Public JWK used for token verification
export const PUBLIC_JWK = {
  kty: "RSA",
  n: "tHFqV3Q9zlkvFsjTXm0bhlwDoND4OJSbmyahtehe-x_kGgYfzmF9oHFAD7ptrIDQCEcepjccDRvm-LdSZBshsnFyAYFmwbWU9G8nE5iIQ0lsZIRsUnDNDi6mr82GQOPYlRnJ5wHFrMajD5ApsmfrPiZYDAddb7Dv84ptaCKq1oQ4iOJ1UsN4PtMg3CajOjpP7VftU_r5b86OQYUp7gajzcaNAjw09-78QO7XA5GO4zO-BSzpI7dV8LfJMDfnYPc1XzHqd3kqbzoBYp1X97nGXGPwKLlSab1IfXsl3crfmqc1CCd4EGCE4dDFstt3eBErdQfSRRjLeZhA5XwUyYQ3Hw",
  e: "AQAB",
  kid: "iw-oauth-key-1",
  alg: "RS256",
  use: "sig",
};

// SECURITY: No hardcoded private keys. OAUTH_PRIVATE_KEY MUST be set via
// Cloudflare Secrets Store. If unset, JWT signing is disabled (fail-closed).
// The public JWK above is used for verification only — it is NOT a secret.

// Base64URL encoding/decoding helper utilities
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(str: string): string {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  return atob(padded);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

function base64UrlToArrayBuffer(str: string): ArrayBuffer {
  const binary = base64UrlDecode(str);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Sign a JWT payload using RS256 with the private key
 */
export async function signJWT(
  payload: Omit<JWTPayload, "iat">,
  privateJwkInput?: string | any
): Promise<string> {
  // Support both plain string and Cloudflare Secrets Store binding { get(): Promise<string> }
  let privateJwkJson = "";
  if (privateJwkInput) {
    if (typeof privateJwkInput === "string") {
      privateJwkJson = privateJwkInput;
    } else if (typeof privateJwkInput.get === "function") {
      try {
        privateJwkJson = (await privateJwkInput.get()) || "";
      } catch {
        privateJwkJson = "";
      }
    }
  }
  if (!privateJwkJson) {
    throw new Error(
      "CRITICAL: OAUTH_PRIVATE_KEY is not configured. JWT signing is disabled. " +
        "Set OAUTH_PRIVATE_KEY in Cloudflare Secrets Store before deploying."
    );
  }
  const privateJwk = JSON.parse(privateJwkJson);

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: privateJwk.kid || "iw-oauth-key-1",
  };

  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  } as JWTPayload;

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));

  const signingData = `${headerB64}.${payloadB64}`;
  const dataBytes = new TextEncoder().encode(signingData);

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, dataBytes);

  const signatureB64 = arrayBufferToBase64Url(signatureBuffer);
  return `${signingData}.${signatureB64}`;
}

/**
 * Verify a JWT token signature and return the verified payload if valid
 */
export async function verifyJWT(
  token: string,
  expectedIssuer: string = "https://auth.integratewise.ai",
  expectedAudience: string = "https://mcp.integratewise.ai"
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Invalid token format" };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64UrlDecode(headerB64));
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JWTPayload;

    // Verify key ID
    if (header.kid !== PUBLIC_JWK.kid) {
      return { valid: false, error: `Invalid key ID: ${header.kid}` };
    }

    // Verify standard claims
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return { valid: false, error: "Token expired" };
    }
    if (payload.nbf && now < payload.nbf) {
      return { valid: false, error: "Token not active yet" };
    }
    if (payload.iss !== expectedIssuer) {
      return { valid: false, error: `Invalid issuer: ${payload.iss}` };
    }
    if (payload.aud !== expectedAudience) {
      return { valid: false, error: `Invalid audience: ${payload.aud}` };
    }

    // Cryptographic signature verification
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      PUBLIC_JWK,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlToArrayBuffer(signatureB64);
    const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      dataBytes
    );

    if (!isValid) {
      return { valid: false, error: "Invalid cryptographic signature" };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || String(err) };
  }
}
