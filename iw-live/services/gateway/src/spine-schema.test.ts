/**
 * Property 1 — Schema is identity-specific (spine-hydration-lifecycle R2.2–2.4).
 * Two identities differing only in Industry yield different entity-type/connector
 * sets; differing only in Role yield different signal/memory sets.
 */
import { describe, it, expect } from "vitest";
import { resolveSpineSchema, SPINE_SCHEMA_VERSION } from "./spine-schema";

const setEq = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

describe("resolveSpineSchema — Property 1 (identity-specific)", () => {
  it("same department, different industry → different entity types AND connector priorities", () => {
    const saas = resolveSpineSchema({
      role: "CUSTOMER_SUCCESS",
      department: "CUSTOMER_SUCCESS",
      industry: "saas",
    });
    const health = resolveSpineSchema({
      role: "CUSTOMER_SUCCESS",
      department: "CUSTOMER_SUCCESS",
      industry: "healthcare",
    });

    expect(setEq(saas.entityTypes, health.entityTypes)).toBe(false);
    expect(setEq(saas.connectorPriorities, health.connectorPriorities)).toBe(false);
  });

  it("same industry, different role/department → different signal AND memory sets", () => {
    const cs = resolveSpineSchema({
      role: "CUSTOMER_SUCCESS",
      department: "CUSTOMER_SUCCESS",
      industry: "saas",
    });
    const sales = resolveSpineSchema({ role: "SALES", department: "SALES", industry: "saas" });

    expect(setEq(cs.signalTypes, sales.signalTypes)).toBe(false);
    expect(setEq(cs.memoryCategories, sales.memoryCategories)).toBe(false);
  });

  it("industry overlay materially changes entity types (saas adds subscription/renewal)", () => {
    const saas = resolveSpineSchema({ department: "CUSTOMER_SUCCESS", industry: "saas" });
    expect(saas.entityTypes).toContain("subscription");
    expect(saas.entityTypes).toContain("renewal");
  });

  it("conservative industries (healthcare/fintech) default to non-auto-promote governance", () => {
    const health = resolveSpineSchema({ department: "CUSTOMER_SUCCESS", industry: "healthcare" });
    const saas = resolveSpineSchema({ department: "CUSTOMER_SUCCESS", industry: "saas" });
    expect(health.governanceDefaults.autoPromote).toBe(false);
    expect(saas.governanceDefaults.autoPromote).toBe(true);
  });

  it("records identity completeness and a real schema version", () => {
    const complete = resolveSpineSchema({ department: "SALES", industry: "saas" });
    const incomplete = resolveSpineSchema({ department: "SALES" });
    expect(complete.identityComplete).toBe(true);
    expect(incomplete.identityComplete).toBe(false);
    expect(complete.schemaVersion).toBe(SPINE_SCHEMA_VERSION);
  });

  it("twinContext carries the resolved identity", () => {
    const s = resolveSpineSchema({ role: "lead", department: "SALES", industry: "saas" });
    expect(s.twinContext.department).toBe("SALES");
    expect(s.twinContext.industry).toBe("saas");
  });

  it("is deterministic (same identity → identical schema)", () => {
    const a = resolveSpineSchema({ role: "SALES", department: "SALES", industry: "saas" });
    const b = resolveSpineSchema({ role: "SALES", department: "SALES", industry: "saas" });
    expect(a).toEqual(b);
  });
});
