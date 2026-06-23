import type { Industry, IndustryProfile } from "./types";

/**
 * Industry dimension — extends the OrgType seed into a richer lens.
 *
 * Selecting an industry injects industry-specific topics (surfaced on Home),
 * terminology overrides (relabel generic entities), and module emphasis.
 * Adding an industry is a config change here.
 */
export const INDUSTRIES: Record<Industry, IndustryProfile> = {
  SAAS: {
    label: "SaaS / Software",
    orgType: "PRODUCT",
    topics: ["Net revenue retention", "Product-led growth", "Activation & onboarding", "Churn prediction", "Usage-based expansion"],
    terminology: { customer: "Account", deal: "Subscription", product: "Plan", team: "Squad" },
    emphasis: ["pipeline", "deals", "metrics", "clients"],
  },
  FINANCIAL_SERVICES: {
    label: "Financial Services",
    orgType: "HYBRID",
    topics: ["Regulatory compliance", "Risk & exposure", "KYC / AML", "Portfolio performance", "Audit readiness"],
    terminology: { customer: "Client", deal: "Mandate", product: "Instrument", team: "Desk" },
    emphasis: ["clients", "deals", "knowledge", "metrics"],
  },
  HEALTHCARE: {
    label: "Healthcare / Life Sciences",
    orgType: "SERVICES",
    topics: ["Patient outcomes", "HIPAA compliance", "Care coordination", "Clinical workflows", "Provider network"],
    terminology: { customer: "Patient", deal: "Care plan", product: "Service line", team: "Care team" },
    emphasis: ["clients", "sessions", "knowledge", "projects"],
  },
  ECOMMERCE: {
    label: "E-commerce / Retail",
    orgType: "PRODUCT",
    topics: ["Conversion rate", "Cart abandonment", "Inventory turns", "LTV / CAC", "Fulfilment SLAs"],
    terminology: { customer: "Shopper", deal: "Order", product: "SKU", team: "Crew" },
    emphasis: ["products", "campaigns", "metrics", "clients"],
  },
  MANUFACTURING: {
    label: "Manufacturing",
    orgType: "PRODUCT",
    topics: ["OEE & throughput", "Supply chain risk", "Quality control", "Maintenance windows", "Lead times"],
    terminology: { customer: "Buyer", deal: "Purchase order", product: "Part", team: "Line" },
    emphasis: ["products", "projects", "metrics", "data-sources"],
  },
  PROFESSIONAL_SERVICES: {
    label: "Professional Services",
    orgType: "SERVICES",
    topics: ["Utilization & billability", "Project margin", "Engagement health", "Scope & change orders", "Resourcing"],
    terminology: { customer: "Client", deal: "Engagement", product: "Offering", team: "Practice" },
    emphasis: ["projects", "sessions", "clients", "services"],
  },
  AGENCY: {
    label: "Agency / Creative",
    orgType: "SERVICES",
    topics: ["Retainer health", "Campaign ROI", "Creative pipeline", "Client satisfaction", "Capacity planning"],
    terminology: { customer: "Client", deal: "Retainer", product: "Service", team: "Pod" },
    emphasis: ["campaigns", "content", "clients", "projects"],
  },
  EDUCATION: {
    label: "Education / EdTech",
    orgType: "SERVICES",
    topics: ["Enrolment & retention", "Learner outcomes", "Course engagement", "Accreditation", "Cohort progress"],
    terminology: { customer: "Learner", deal: "Enrolment", product: "Course", team: "Faculty" },
    emphasis: ["clients", "sessions", "content", "knowledge"],
  },
  REAL_ESTATE: {
    label: "Real Estate",
    orgType: "HYBRID",
    topics: ["Listing velocity", "Pipeline by stage", "Occupancy & yield", "Lease renewals", "Market comps"],
    terminology: { customer: "Client", deal: "Listing", product: "Property", team: "Office" },
    emphasis: ["leads", "pipeline", "deals", "clients"],
  },
  LOGISTICS: {
    label: "Logistics / Supply Chain",
    orgType: "SERVICES",
    topics: ["On-time delivery", "Route efficiency", "Carrier performance", "Exception handling", "Cost per shipment"],
    terminology: { customer: "Shipper", deal: "Contract", product: "Lane", team: "Hub" },
    emphasis: ["projects", "metrics", "data-flow", "clients"],
  },
  NONPROFIT: {
    label: "Nonprofit / NGO",
    orgType: "SERVICES",
    topics: ["Donor retention", "Program impact", "Grant pipeline", "Volunteer engagement", "Fund allocation"],
    terminology: { customer: "Donor", deal: "Grant", product: "Program", team: "Chapter" },
    emphasis: ["clients", "campaigns", "projects", "knowledge"],
  },
  MEDIA: {
    label: "Media / Publishing",
    orgType: "HYBRID",
    topics: ["Audience growth", "Subscription churn", "Content velocity", "Ad yield", "Engagement depth"],
    terminology: { customer: "Subscriber", deal: "Sponsorship", product: "Title", team: "Desk" },
    emphasis: ["content", "campaigns", "metrics", "clients"],
  },
};

export const ALL_INDUSTRIES: Industry[] = Object.keys(INDUSTRIES) as Industry[];
