import { describe, it, expect } from "vitest";
import { SchemaAccessor } from "@integratewise/types";

describe("Cross-Industry Schema Validation (12 Departments * 11 Industries)", () => {
  const accessor = new SchemaAccessor();
  const tenantId = "test-tenant-123";

  // List of all 12 canonical departments
  const departments = [
    "CUSTOMER_SUCCESS",
    "REVOPS",
    "SALES",
    "MARKETING",
    "PRODUCT_ENGINEERING",
    "FINANCE",
    "SERVICE",
    "PROCUREMENT",
    "IT_ADMIN",
    "STUDENT_TEACHER",
    "BIZOPS",
    "PERSONAL",
  ];

  // List of all 11 canonical industries
  const industries = [
    "SAAS_TECH",
    "PROFESSIONAL_SERVICES",
    "HEALTHCARE",
    "EDUCATION",
    "MANUFACTURING",
    "AUTOMOTIVE",
    "RETAIL_COMMERCE",
    "FINANCIAL_SERVICES",
    "LOGISTICS",
    "MEDIA",
    "PUBLIC_SECTOR",
  ];

  it("should have exactly 12 departments and 11 industries to test", () => {
    expect(departments).toHaveLength(12);
    expect(industries).toHaveLength(11);
  });

  // Test all 12 * 11 = 132 combinations
  describe("Matrix resolution tests", () => {
    for (const dept of departments) {
      for (const ind of industries) {
        it(`should successfully resolve schema for department=${dept} and industry=${ind}`, async () => {
          const schema = await accessor.resolveSchema(tenantId, dept, ind);

          // Verify basic schema properties
          expect(schema).toBeDefined();
          expect(schema.tenant_id).toBe(tenantId);
          expect(schema.industry).toBe(ind);
          expect(schema.entity_types).toBeInstanceOf(Array);
          expect(schema.priority_fields).toBeDefined();

          // Department name should be normalized
          expect(schema.department).toBeDefined();

          // Verify that industry overlays are correctly applied
          if (ind === "HEALTHCARE") {
            // Healthcare adds 'equipment_maintenance' and 'patient_encounter'
            expect(schema.entity_types).toContain("equipment_maintenance");
            expect(schema.entity_types).toContain("patient_encounter");

            // Healthcare overrides 'account' priority fields with HIPAA-specific ones
            if (schema.priority_fields.account) {
              expect(schema.priority_fields.account).toContain("hipaa_status");
              expect(schema.priority_fields.account).toContain("compliance_score");
            }
          }

          if (ind === "AUTOMOTIVE") {
            expect(schema.entity_types).toContain("vehicle");
            expect(schema.entity_types).toContain("warranty");
            expect(schema.entity_types).toContain("service_appointment");
          }

          if (ind === "MANUFACTURING") {
            expect(schema.entity_types).toContain("work_order");
            expect(schema.entity_types).toContain("supplier");
            expect(schema.entity_types).toContain("asset");
          }

          if (ind === "FINANCIAL_SERVICES") {
            expect(schema.entity_types).toContain("compliance_item");
            expect(schema.entity_types).toContain("risk_assessment");
            if (schema.priority_fields.account) {
              expect(schema.priority_fields.account).toContain("kyc_status");
            }
          }

          if (ind === "LOGISTICS") {
            expect(schema.entity_types).toContain("shipment");
            expect(schema.entity_types).toContain("carrier");
            expect(schema.entity_types).toContain("warehouse");
          }

          if (ind === "PROFESSIONAL_SERVICES") {
            expect(schema.entity_types).toContain("project");
            expect(schema.entity_types).toContain("timesheet");
          }

          if (ind === "EDUCATION") {
            expect(schema.entity_types).toContain("student");
            expect(schema.entity_types).toContain("course");
          }

          if (ind === "MEDIA") {
            expect(schema.entity_types).toContain("content_asset");
            expect(schema.entity_types).toContain("royalty");
          }

          if (ind === "PUBLIC_SECTOR") {
            expect(schema.entity_types).toContain("grant");
            if (schema.priority_fields.account) {
              expect(schema.priority_fields.account).toContain("procurement_stage");
            }
          }
        });
      }
    }
  });

  describe("Department normalization and alias resolution", () => {
    it("should normalize CSM and support CS department entity types", async () => {
      const schema = await accessor.resolveSchema(tenantId, "CSM", "SAAS_TECH");
      expect(schema.department).toBe("CUSTOMER_SUCCESS");
      expect(schema.entity_types).toContain("success_plan");
      expect(schema.entity_types).toContain("engagement");
    });

    it("should normalize SUPPORT and support SERVICE department entity types", async () => {
      const schema = await accessor.resolveSchema(tenantId, "SUPPORT", "SAAS_TECH");
      expect(schema.department).toBe("SERVICE");
      expect(schema.entity_types).toContain("ticket");
      expect(schema.entity_types).toContain("sla_policy");
    });

    it("should normalize HR and BIZOPS department entity types", async () => {
      const schema = await accessor.resolveSchema(tenantId, "HR", "SAAS_TECH");
      expect(schema.department).toBe("BIZOPS");
      expect(schema.entity_types).toContain("project");
      expect(schema.entity_types).toContain("workflow");
    });
  });
});
