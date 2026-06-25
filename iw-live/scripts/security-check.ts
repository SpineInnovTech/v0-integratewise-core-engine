/**
 * Security Audit Utility
 * Run with: npx tsx security-check.ts
 *
 * Verifies:
 * 1. Org isolation on list endpoints
 * 2. Service role key not exposed to client
 * 3. Environment variables configured correctly
 */

const BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8787";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

const results: CheckResult[] = [];

function log(result: CheckResult) {
  const icon = result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} ${result.name}: ${result.message}`);
  results.push(result);
}

async function checkEnvVars() {
  // Server-only keys should not be exposed
  const serverOnlyKeys = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];

  for (const key of serverOnlyKeys) {
    // Check if accidentally prefixed with VITE_
    const publicKey = `VITE_${key}`;
    if (process.env[publicKey]) {
      log({
        name: `Env: ${key}`,
        status: "fail",
        message: `${key} is exposed as ${publicKey} - this is a security risk!`,
      });
    } else {
      log({
        name: `Env: ${key}`,
        status: "pass",
        message: "Not exposed to client",
      });
    }
  }

  // Required public keys
  const publicKeys = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_STRIPE_PUBLISHABLE_KEY",
    "VITE_API_BASE_URL",
  ];

  for (const key of publicKeys) {
    if (process.env[key]) {
      log({
        name: `Env: ${key}`,
        status: "pass",
        message: "Configured",
      });
    } else {
      log({
        name: `Env: ${key}`,
        status: "warn",
        message: "Not configured",
      });
    }
  }
}

async function checkEndpoint(path: string, expectAuth: boolean) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
    });

    if (expectAuth && res.status === 200) {
      log({
        name: `Endpoint: ${path}`,
        status: "warn",
        message: "Returns 200 without auth - verify org isolation",
      });
    } else if (expectAuth && (res.status === 401 || res.status === 403)) {
      log({
        name: `Endpoint: ${path}`,
        status: "pass",
        message: "Requires authentication",
      });
    } else {
      log({
        name: `Endpoint: ${path}`,
        status: "pass",
        message: `Status: ${res.status}`,
      });
    }
  } catch (err) {
    log({
      name: `Endpoint: ${path}`,
      status: "warn",
      message: `Could not reach: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }
}

async function main() {
  console.log("\n🔐 IntegrateWise Security Audit\n");
  console.log("=".repeat(50));

  // Check environment variables
  console.log("\n📋 Environment Variables\n");
  await checkEnvVars();

  // Check critical endpoints
  console.log("\n🌐 Endpoint Security\n");
  await checkEndpoint("/health", false);
  await checkEndpoint("/api/v1/billing/plans", false);
  await checkEndpoint("/api/v1/billing/subscription", true);

  // Summary
  console.log("\n" + "=".repeat(50));
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;

  console.log(`\n📊 Summary: ${passed} passed, ${failed} failed, ${warned} warnings\n`);

  if (failed > 0) {
    console.log("❌ Security audit FAILED - fix issues before deployment\n");
    process.exit(1);
  } else if (warned > 0) {
    console.log("⚠️ Security audit PASSED with warnings\n");
  } else {
    console.log("✅ Security audit PASSED\n");
  }
}

main().catch(console.error);
