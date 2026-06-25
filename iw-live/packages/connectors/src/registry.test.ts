import { describe, it, expect } from "vitest";
import {
  validateRegistry,
  getConnectorById,
  DOMAIN_CONNECTOR_MAP,
  CONNECTOR_CATALOG,
  getSerializableCatalog,
} from "./registry";

const MIN_CATALOG_SIZE = 50;

describe("registry", () => {
  it("validates accelerator and MCP required_connector_ids against catalog", () => {
    expect(() => validateRegistry()).not.toThrow();
  });

  it("getConnectorById returns entry for known id", () => {
    expect(getConnectorById("salesforce")).toBeDefined();
    expect(getConnectorById("stripe")).toBeDefined();
    expect(getConnectorById("unknown-id")).toBeUndefined();
  });

  it("DOMAIN_CONNECTOR_MAP has connector ids per domain", () => {
    expect(DOMAIN_CONNECTOR_MAP.crm).toContain("salesforce");
    expect(DOMAIN_CONNECTOR_MAP.finance).toContain("stripe");
  });

  it("CONNECTOR_CATALOG has authType on every entry", () => {
    for (const c of CONNECTOR_CATALOG) {
      expect(c.authType).toMatch(/^(oauth|api_key)$/);
    }
  });

  it("CONNECTOR_CATALOG has expected size and unique ids", () => {
    expect(CONNECTOR_CATALOG.length).toBeGreaterThanOrEqual(MIN_CATALOG_SIZE);
    const ids = new Set(CONNECTOR_CATALOG.map((c) => c.id));
    expect(ids.size).toBe(CONNECTOR_CATALOG.length);
  });

  it("every catalog entry has id, name, domain, category, authType and instantiable class", () => {
    for (const c of CONNECTOR_CATALOG) {
      expect(c.id).toBeDefined();
      expect(c.name).toBeDefined();
      expect(c.domain).toBeDefined();
      expect(c.category).toBeDefined();
      expect(c.authType).toMatch(/^(oauth|api_key)$/);
      expect(typeof c.class).toBe("function");
      const instance = new c.class({});
      expect(instance).toBeDefined();
      expect(typeof instance.testConnection).toBe("function");
      expect(typeof instance.getMetadata).toBe("function");
    }
  });

  it("getSerializableCatalog returns same count and no class references", () => {
    const serial = getSerializableCatalog();
    expect(serial).toHaveLength(CONNECTOR_CATALOG.length);
    for (const s of serial) {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("name");
      expect(s).toHaveProperty("domain");
      expect(s).toHaveProperty("category");
      expect(s).toHaveProperty("authType");
      expect(s).not.toHaveProperty("class");
    }
  });
});
