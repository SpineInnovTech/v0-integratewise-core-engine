/**
 * Unit tests for the pure context resolver (CS/BizOps coherence fix).
 * Run: node --import tsx --test src/lib/projection/context-resolver.test.ts
 * Spec: role-industry-projection (R4).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveContext } from "./context-resolver.ts";

test("Customer Success role resolves CS workbench, never BizOps", () => {
  const r = resolveContext({ role: "CUSTOMER_SUCCESS" });
  assert.equal(r.domain, "CUSTOMER_SUCCESS");
  assert.equal(r.ctx, "CTX_CS");
  assert.equal(r.department, "Customer Success");
  assert.notEqual(r.domain, "BIZOPS");
  assert.equal(r.isDefault, false);
});

test("role wins when department/domain disagree (the reported bug)", () => {
  // Reproduces: cached domain says BIZOPS / department defaulted, but role is CS.
  const r = resolveContext({ role: "CUSTOMER_SUCCESS", department: "bizops", domain: "BIZOPS" });
  assert.equal(r.domain, "CUSTOMER_SUCCESS");
  assert.equal(r.department, "Customer Success");
  assert.equal(r.ctx, "CTX_CS");
});

test("same CTX whether resolved from domain or from department", () => {
  const fromDomain = resolveContext({ domain: "FINANCE" });
  const fromDept = resolveContext({ department: "Finance" });
  assert.equal(fromDomain.ctx, fromDept.ctx);
  assert.equal(fromDomain.domain, fromDept.domain);
});

test("aliases normalize (CS, Customer Success, business ops)", () => {
  assert.equal(resolveContext({ role: "CS" }).domain, "CUSTOMER_SUCCESS");
  assert.equal(resolveContext({ role: "Customer Success" }).domain, "CUSTOMER_SUCCESS");
  assert.equal(resolveContext({ role: "business ops" }).domain, "BIZOPS");
});

test("missing role => documented default with isDefault flag", () => {
  const r = resolveContext({});
  assert.equal(r.isDefault, true);
  assert.equal(r.domain, "BIZOPS");
  assert.equal(r.ctx, "CTX_BIZOPS");
});

test("department-only resolution still coheres", () => {
  const r = resolveContext({ department: "Sales" });
  assert.equal(r.domain, "SALES");
  assert.equal(r.ctx, "CTX_SALES");
  assert.equal(r.department, "Sales");
  assert.equal(r.isDefault, false);
});
