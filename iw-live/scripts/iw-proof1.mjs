// Drives Proof 1 against the LIVE dev gateway: real signup → real initialize-spine.
const GW = "https://gateway.dev.integratewise.ai";

function jwtTenant(token) {
  try {
    const p = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    return p.tenant_id;
  } catch {
    return null;
  }
}

const email = `iw-proof-${Date.now()}@example.com`;
const signup = await fetch(`${GW}/api/v1/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password: "ProofPass!2026",
    name: "Continuity Proof",
    company_name: "ProofCo",
  }),
}).then((r) => r.json());

const token = signup.token;
const tenantId = signup.tenant?.id || jwtTenant(token);
console.log("signup:", { email, tenantId, hasToken: !!token });

// Real schema hydration through the deployed gateway (CS + SaaS).
const init = await fetch(`${GW}/api/v1/workspace/initialize-spine`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    domain: "CUSTOMER_SUCCESS",
    industry: "saas",
    department: "CUSTOMER_SUCCESS",
    connectors: [],
  }),
});
console.log("initialize-spine HTTP", init.status);
console.log((await init.text()).slice(0, 400));
console.log("\nTENANT_ID=" + tenantId);
