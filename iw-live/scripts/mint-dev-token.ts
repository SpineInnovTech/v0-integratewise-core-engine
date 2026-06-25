/**
 * Mint a dev/test JWT for headless dashboard repro (e.g. inject into /dev/unified preview
 * or set localStorage token for AppShell to treat as "restored session").
 *
 * Usage (tsx friendly):
 *   npx tsx scripts/mint-dev-token.ts
 *
 * The script uses main() wrapper because top-level await can trip tsx in some envs.
 *
 * For real token: hit the gateway /api/v1/auth/login or /signup with test creds.
 * Then use the returned token as Bearer or store in localStorage under the app's auth key.
 */

async function main() {
  const gatewayBase = process.env.GATEWAY_BASE || "http://localhost:8787"; // or your dev gateway
  const email = process.env.DEV_EMAIL || "test+c0@integratewise.ai";
  const password = process.env.DEV_PASSWORD || "TestPass123!";

  console.log("Minting dev token against", gatewayBase);
  console.log(" (Provide DEV_EMAIL / DEV_PASSWORD via env for real login, or use signup.)");

  try {
    // Try login first
    const loginRes = await fetch(`${gatewayBase}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      console.log("✅ Login success. Token:", data.token);
      console.log("Use in shell (localStorage example for preview):");
      console.log(`  localStorage.setItem('iw_token', '${data.token}');`);
      console.log("Then navigate to /dev/unified/work/dashboard or the workspace.");
      return;
    }

    console.warn("Login failed, trying signup (dev only)...");

    const signupRes = await fetch(`${gatewayBase}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Dev Tester", workspace: "c0-test" }),
    });

    if (signupRes.ok) {
      const data = await signupRes.json();
      console.log("✅ Signup success. Token:", data.token || data);
      console.log("Token ready for injection.");
    } else {
      console.error("Both login and signup failed. Use manual curl or existing JWT.");
      console.log("Example manual:");
      console.log(
        `curl -X POST ${gatewayBase}/api/v1/auth/login -d '{"email":"...","password":"..."}'`
      );
    }
  } catch (err) {
    console.error("Mint failed (is gateway running on", gatewayBase, "?)", err);
    console.log("For pure preview (no real backend): the /dev/unified/* route bypasses auth.");
    console.log(
      "To force 'workspace' mode in Mock shell, you may patch the preview component temporarily."
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
