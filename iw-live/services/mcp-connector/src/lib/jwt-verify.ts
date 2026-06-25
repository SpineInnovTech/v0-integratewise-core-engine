/**
 * Secure JWT verification for Supabase Auth tokens
 * Verifies signature using Supabase JWK keys
 */

interface JWTPayload {
  sub?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

interface JWK {
  kty: string;
  kid: string;
  use: string;
  alg: string;
  n: string;
  e: string;
}

interface JWKSet {
  keys: JWK[];
}

class JWTVerifier {
  private supabaseUrl: string;
  private jwks: JWKSet | null = null;
  private jwksCacheExpiry = 0;
  private jwksCacheTtl = 60 * 60 * 1000; // 1 hour

  constructor(supabaseUrl: string) {
    this.supabaseUrl = supabaseUrl.replace(/\/$/, "");
  }

  /**
   * Fetch JWK keys from Supabase
   */
  private async fetchJWKs(): Promise<JWKSet> {
    const now = Date.now();

    // Return cached keys if valid
    if (this.jwks && now < this.jwksCacheExpiry) {
      return this.jwks;
    }

    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/jwks`);

      if (!response.ok) {
        throw new Error(`Failed to fetch JWKs: ${response.status}`);
      }

      this.jwks = (await response.json()) as JWKSet;
      this.jwksCacheExpiry = now + this.jwksCacheTtl;

      return this.jwks;
    } catch (error) {
      throw new Error(
        `JWK fetch failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert JWK to CryptoKey for verification
   */
  private async jwkToCryptoKey(jwk: JWK): Promise<CryptoKey> {
    const keyData = {
      kty: jwk.kty,
      n: jwk.n,
      e: jwk.e,
    };

    return crypto.subtle.importKey(
      "jwk",
      keyData,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
  }

  /**
   * Base64URL decode
   */
  private base64UrlDecode(str: string): string {
    // Add padding if needed
    const padding = "=".repeat((4 - (str.length % 4)) % 4);
    const base64 = (str + padding).replace(/-/g, "+").replace(/_/g, "/");

    try {
      return atob(base64);
    } catch {
      throw new Error("Invalid base64url encoding");
    }
  }

  /**
   * Verify JWT signature
   */
  private async verifySignature(token: string, jwk: JWK): Promise<boolean> {
    try {
      const [header, payload, signature] = token.split(".");

      if (!header || !payload || !signature) {
        return false;
      }

      const message = `${header}.${payload}`;
      const messageData = new TextEncoder().encode(message);

      const cryptoKey = await this.jwkToCryptoKey(jwk);

      // Convert base64url signature to ArrayBuffer
      const sigData = this.base64UrlDecode(signature);
      const sigBuffer = new ArrayBuffer(sigData.length);
      const sigView = new Uint8Array(sigBuffer);

      for (let i = 0; i < sigData.length; i++) {
        sigView[i] = sigData.charCodeAt(i);
      }

      // Verify using RSA-PSS
      return await crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        cryptoKey,
        sigBuffer,
        messageData
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  }

  /**
   * Verify and decode a JWT token
   */
  async verify(token: string): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
    try {
      // Basic format check
      const parts = token.split(".");
      if (parts.length !== 3) {
        return { valid: false, error: "Invalid JWT format" };
      }

      const [header, payload] = parts;

      // Decode header
      let decodedHeader: any;
      try {
        decodedHeader = JSON.parse(this.base64UrlDecode(header));
      } catch {
        return { valid: false, error: "Invalid JWT header" };
      }

      // Decode payload
      let decodedPayload: JWTPayload;
      try {
        decodedPayload = JSON.parse(this.base64UrlDecode(payload));
      } catch {
        return { valid: false, error: "Invalid JWT payload" };
      }

      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
        return { valid: false, error: "Token expired" };
      }

      // Fetch and match JWK
      const jwks = await this.fetchJWKs();
      const kid = decodedHeader.kid;
      const jwk = jwks.keys.find((k) => k.kid === kid);

      if (!jwk) {
        return { valid: false, error: "Unknown key ID" };
      }

      // Verify signature
      const isValid = await this.verifySignature(token, jwk);

      if (!isValid) {
        return { valid: false, error: "Invalid signature" };
      }

      return { valid: true, payload: decodedPayload };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }
}

/**
 * Extract tenant/user info from verified JWT payload
 */
export async function verifySupabaseJWT(
  token: string,
  supabaseUrl: string | undefined,
  supabaseKey: string | undefined
): Promise<{ tenant_id: string; user_id: string; roles: string[] } | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "JWT verification skipped: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured"
    );
    return null;
  }

  try {
    const verifier = new JWTVerifier(supabaseUrl);
    const result = await verifier.verify(token);

    if (!result.valid || !result.payload) {
      console.warn("JWT verification failed:", result.error);
      return null;
    }

    // Extract IntegrateWise tenant from JWT
    const tenant_id = result.payload.tenant_id || result.payload.app_metadata?.tenant_id;
    const user_id = result.payload.sub || result.payload.user_id;
    const role = result.payload.role || result.payload.app_metadata?.role || "Member";

    if (!tenant_id || !user_id) {
      console.warn("Missing tenant_id or user_id in token");
      return null;
    }

    return {
      tenant_id,
      user_id,
      roles: Array.isArray(role) ? role : [role],
    };
  } catch (error: any) {
    console.error("JWT verification error:", error.message);
    return null;
  }
}
