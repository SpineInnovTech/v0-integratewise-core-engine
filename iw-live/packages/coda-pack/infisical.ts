// Infisical Zero-Dependency Secret Fetcher using REST API
// Works on both local Node.js and Cloudflare Workers runtime

export async function fetchInfisicalSecrets(env: {
  INFISICAL_CLIENT_ID?: string;
  INFISICAL_CLIENT_SECRET?: string;
  INFISICAL_PROJECT_ID?: string;
  INFISICAL_ENV?: string;
  INFISICAL_SITE_URL?: string;
}): Promise<Record<string, string>> {
  const clientId = env.INFISICAL_CLIENT_ID || process.env.INFISICAL_CLIENT_ID;
  const clientSecret = env.INFISICAL_CLIENT_SECRET || process.env.INFISICAL_CLIENT_SECRET;
  const projectId = env.INFISICAL_PROJECT_ID || process.env.INFISICAL_PROJECT_ID;
  const infisicalEnv = env.INFISICAL_ENV || process.env.INFISICAL_ENV || "dev";
  const siteUrl =
    env.INFISICAL_SITE_URL || process.env.INFISICAL_SITE_URL || "https://app.infisical.com";

  if (!clientId || !clientSecret || !projectId) {
    // Silent return if Infisical is not configured to avoid cluttering logs
    return {};
  }

  try {
    console.log("🔒 Connecting to Infisical Vault...");

    // 1. Universal Auth Login
    const loginRes = await fetch(`${siteUrl}/api/v1/auth/universal-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(
        `Authentication failed (${loginRes.status}): ${errText || loginRes.statusText}`
      );
    }

    const authData = (await loginRes.json()) as { accessToken: string };
    const token = authData.accessToken;

    // 2. Fetch raw secrets from the root folder
    const query = new URLSearchParams({
      workspaceId: projectId,
      environment: infisicalEnv,
      secretPath: "/",
    });

    const secretsUrl = `${siteUrl}/api/v3/secrets/raw?${query.toString()}`;
    const secretsRes = await fetch(secretsUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!secretsRes.ok) {
      const errText = await secretsRes.text();
      throw new Error(
        `Fetch secrets failed (${secretsRes.status}): ${errText || secretsRes.statusText}`
      );
    }

    const data = (await secretsRes.json()) as {
      secrets?: Array<{ secretKey: string; secretValue: string }>;
    };

    const secretsMap: Record<string, string> = {};

    if (data.secrets && Array.isArray(data.secrets)) {
      for (const item of data.secrets) {
        secretsMap[item.secretKey.toUpperCase()] = item.secretValue;
      }
    }

    console.log(`✅ Successfully loaded ${Object.keys(secretsMap).length} secrets from Infisical.`);
    return secretsMap;
  } catch (error) {
    console.error(
      "❌ Infisical integration error:",
      error instanceof Error ? error.message : String(error)
    );
    return {};
  }
}

export async function pushInfisicalSecret(
  secretKey: string,
  secretValue: string,
  env: {
    INFISICAL_CLIENT_ID?: string;
    INFISICAL_CLIENT_SECRET?: string;
    INFISICAL_PROJECT_ID?: string;
    INFISICAL_ENV?: string;
    INFISICAL_SITE_URL?: string;
  }
): Promise<boolean> {
  const clientId = env.INFISICAL_CLIENT_ID || process.env.INFISICAL_CLIENT_ID;
  const clientSecret = env.INFISICAL_CLIENT_SECRET || process.env.INFISICAL_CLIENT_SECRET;
  const projectId = env.INFISICAL_PROJECT_ID || process.env.INFISICAL_PROJECT_ID;
  const infisicalEnv = env.INFISICAL_ENV || process.env.INFISICAL_ENV || "dev";
  const siteUrl =
    env.INFISICAL_SITE_URL || process.env.INFISICAL_SITE_URL || "https://app.infisical.com";

  if (!clientId || !clientSecret || !projectId) {
    throw new Error(
      "Missing Infisical credentials (INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, or INFISICAL_PROJECT_ID)"
    );
  }

  try {
    // 1. Universal Auth Login to get token
    const loginRes = await fetch(`${siteUrl}/api/v1/auth/universal-auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!loginRes.ok) {
      const errText = await loginRes.text();
      throw new Error(`Authentication failed (${loginRes.status}): ${errText}`);
    }

    const authData = (await loginRes.json()) as { accessToken: string };
    const token = authData.accessToken;

    // 2. Check if secret exists to decide POST vs PATCH
    const existingSecrets = await fetchInfisicalSecrets(env);
    const exists = existingSecrets[secretKey.toUpperCase()] !== undefined;

    const url = `${siteUrl}/api/v3/secrets/raw/${secretKey}`;
    const method = exists ? "PATCH" : "POST";

    const payload: any = {
      environment: infisicalEnv,
      workspaceId: projectId,
      secretValue,
      secretPath: "/",
    };

    if (!exists) {
      payload.type = "shared";
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    return true;
  } catch (error) {
    console.error(
      `❌ Infisical push error for ${secretKey}:`,
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
