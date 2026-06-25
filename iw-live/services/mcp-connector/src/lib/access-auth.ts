/**
 * Cloudflare Access OAuth validation for MCP Server
 *
 * Validates CF-Access-JWT-Assertion tokens from Cloudflare Access.
 * Falls back to existing API key auth for backward compatibility.
 *
 * @see https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/
 */

interface AccessPayload {
  sub: string;
  email?: string;
  name?: string;
  aud: string[];
  iss: string;
  iat: number;
  exp: number;
  nbf?: number;
  type?: string;
  identity_nonce?: string;
  country?: string;
  [key: string]: any;
}

interface AccessJWK {
  kty: string;
  kid: string;
  use?: string;
  alg?: string;
  x5c?: string[];
  n?: string;
  e?: string;
  x5t?: string;
}

interface AccessJWKSet {
  keys: AccessJWK[];
}

/**
 * Cache for Access public keys per team domain
 */
const keyCache = new Map<string, { keys: AccessJWKSet; expires: number }>();
const KEY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch Cloudflare Access public keys
 */
async function fetchAccessKeys(teamDomain: string): Promise<AccessJWKSet> {
  const cacheKey = teamDomain;
  const cached = keyCache.get(cacheKey);

  if (cached && Date.now() < cached.expires) {
    return cached.keys;
  }

  const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;
  const response = await fetch(certsUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch Access certs: ${response.status}`);
  }

  const keys = (await response.json()) as AccessJWKSet;
  keyCache.set(cacheKey, { keys, expires: Date.now() + KEY_CACHE_TTL });

  return keys;
}

/**
 * Convert x5c certificate to CryptoKey
 */
async function certToCryptoKey(x5c: string): Promise<CryptoKey> {
  const cert = `-----BEGIN CERTIFICATE-----\n${x5c.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;

  // Cloudflare Workers supports PEM import via subtle.importKey with spki format
  const binaryString = atob(
    cert.replace(/-----(BEGIN|END) CERTIFICATE-----/g, "").replace(/\s/g, "")
  );
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "spki",
    bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

/**
 * Base64URL decode
 */
function base64UrlDecode(str: string): string {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

/**
 * Verify a Cloudflare Access JWT token
 *
 * @param token - The CF-Access-JWT-Assertion token
 * @param teamDomain - Your Cloudflare Access team domain (e.g., "integratewise.cloudflareaccess.com" — this is the CF team domain, product uses *.integratewise.ai)
 * @param aud - Optional: expected audience (application ID) to validate
 * @returns Decoded payload if valid, null otherwise
 */
export async function verifyAccessToken(
  token: string,
  teamDomain: string,
  aud?: string
): Promise<AccessPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("[Access] Invalid token format");
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header
    const header = JSON.parse(base64UrlDecode(headerB64));
    if (!header.kid) {
      console.warn("[Access] Missing kid in header");
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AccessPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn("[Access] Token expired");
      return null;
    }

    if (payload.nbf && payload.nbf > now) {
      console.warn("[Access] Token not yet valid");
      return null;
    }

    // Validate audience if provided
    if (aud && (!payload.aud || !payload.aud.includes(aud))) {
      console.warn("[Access] Audience mismatch");
      return null;
    }

    // Validate issuer
    const expectedIssuer = `https://${teamDomain}`;
    if (!payload.iss || !payload.iss.startsWith(expectedIssuer)) {
      console.warn("[Access] Invalid issuer");
      return null;
    }

    // Fetch keys and find matching kid
    const jwks = await fetchAccessKeys(teamDomain);
    const jwk = jwks.keys.find((k) => k.kid === header.kid);

    if (!jwk) {
      console.warn("[Access] Unknown key ID:", header.kid);
      return null;
    }

    // Verify signature
    if (!jwk.x5c || jwk.x5c.length === 0) {
      console.warn("[Access] No x5c certificate in JWK");
      return null;
    }

    const cryptoKey = await certToCryptoKey(jwk.x5c[0]);

    // Decode signature
    const sigPadding = "=".repeat((4 - (signatureB64.length % 4)) % 4);
    const sigBase64 = (signatureB64 + sigPadding).replace(/-/g, "+").replace(/_/g, "/");
    const sigBinary = atob(sigBase64);
    const sigBytes = new Uint8Array(sigBinary.length);
    for (let i = 0; i < sigBinary.length; i++) {
      sigBytes[i] = sigBinary.charCodeAt(i);
    }

    const message = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, sigBytes, message);

    if (!isValid) {
      console.warn("[Access] Signature verification failed");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("[Access] Verification error:", error);
    return null;
  }
}

/**
 * Extract actor info from Access token payload
 */
export function extractActorFromAccess(payload: AccessPayload): {
  user_id: string;
  email: string;
  name?: string;
} {
  return {
    user_id: payload.sub,
    email: payload.email || payload.sub,
    name: payload.name,
  };
}

/**
 * Get Cloudflare Access team domain from environment or config
 */
export function getAccessTeamDomain(): string | undefined {
  // In Cloudflare Workers, this would come from wrangler.toml vars
  // For now, return undefined to allow runtime configuration
  return undefined;
}
