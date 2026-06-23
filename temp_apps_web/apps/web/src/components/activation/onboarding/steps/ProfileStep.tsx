/**
 * Step 2: Profile Selection
 *
 * User selects Industry, Department, and Company Size.
 * This configures the adaptive Spine schema.
 * When selections are made, the spine schema is initialized immediately.
 */

import React, { useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, Database } from "lucide-react";

interface ProfileStepProps {
  onComplete: (data: { industry: string; department: string; companySize: string }) => void;
  onBack: () => void;
  onSpineInit?: (data: { industry: string; department: string }) => void;
}

const INDUSTRIES = [
  { id: "SAAS_TECH", label: "Technology / SaaS" },
  { id: "PROFESSIONAL_SERVICES", label: "Professional Services" },
  { id: "HEALTHCARE", label: "Healthcare" },
  { id: "EDUCATION", label: "Education" },
  { id: "MANUFACTURING", label: "Manufacturing" },
  { id: "AUTOMOTIVE", label: "Automotive / Mobility" },
  { id: "RETAIL_COMMERCE", label: "Retail / E-commerce" },
  { id: "FINANCIAL_SERVICES", label: "Financial Services" },
  { id: "LOGISTICS", label: "Logistics / Supply Chain" },
  { id: "MEDIA", label: "Media / Entertainment" },
  { id: "PUBLIC_SECTOR", label: "Government / Public Sector" },
  { id: "OTHER", label: "Other" },
];

const DEPARTMENT_GROUPS = [
  {
    category: "Revenue & Growth",
    options: [
      { id: "SALES", label: "Sales" },
      { id: "MARKETING", label: "Marketing" },
      { id: "REVOPS", label: "RevOps" },
      { id: "CUSTOMER_SUCCESS", label: "Customer Success" },
    ],
  },
  {
    category: "Technology",
    options: [
      { id: "ENGINEERING", label: "Engineering" },
      { id: "PRODUCT", label: "Product Management" },
      { id: "IT", label: "IT/Technology" },
    ],
  },
  {
    category: "Operations",
    options: [
      { id: "OPERATIONS", label: "Operations" },
      { id: "SUPPLY_CHAIN", label: "Supply Chain" },
      { id: "SERVICE_OPS", label: "Service Operations" },
      { id: "PROJECT_MANAGEMENT", label: "Project Management" },
    ],
  },
  {
    category: "Corporate",
    options: [
      { id: "FINANCE", label: "Finance/Accounting" },
      { id: "LEGAL", label: "Legal" },
      { id: "HR", label: "Human Resources" },
    ],
  },
];

const COMPANY_SIZES = [
  { id: "1", label: "Just me" },
  { id: "2-10", label: "2-10 people" },
  { id: "11-50", label: "11-50 people" },
  { id: "51-200", label: "51-200 people" },
  { id: "201-500", label: "201-500 people" },
  { id: "500+", label: "500+ people" },
];

export function ProfileStep({ onComplete, onBack, onSpineInit }: ProfileStepProps) {
  const [industry, setIndustry] = useState("");
  const [department, setDepartment] = useState("");
  const [companySize, setCompanySize] = useState("51-200");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spineInitialized, setSpineInitialized] = useState(false);
  const [lastInitKey, setLastInitKey] = useState("");

  const triggerSpineInit = useCallback(
    (ind: string, dept: string) => {
      if (!ind || !dept || !onSpineInit) return;
      const key = `${ind}::${dept}`;
      if (key === lastInitKey) return;
      setLastInitKey(key);
      onSpineInit({ industry: ind, department: dept });
      setSpineInitialized(true);
    },
    [onSpineInit, lastInitKey]
  );

  const handleIndustryChange = (value: string) => {
    setIndustry(value);
    if (value && department) {
      triggerSpineInit(value, department);
    }
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    if (industry && value) {
      triggerSpineInit(industry, value);
    }
  };

  const handleContinue = async () => {
    if (!industry || !department) return;

    setIsSubmitting(true);
    if (!spineInitialized && onSpineInit) {
      onSpineInit({ industry, department });
    }
    onComplete({ industry, department, companySize });
    setIsSubmitting(false);
  };

  const canContinue = industry && department;

  return (
    <div className="max-w-5xl mx-auto w-full pt-2 font-iw-sans">
      <div className="text-center mb-10">
        <h2 className="text-[28px] md:text-[36px] leading-[1.08] font-iw-serif text-primary mb-3 tracking-[-0.02em]">
          Tell us about yourself
        </h2>
        <p className="text-[16px] md:text-[18px] leading-[1.12] text-muted-foreground font-medium">
          This configures your adaptive Spine schema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Industry</label>
          <select
            value={industry}
            onChange={(e) => handleIndustryChange(e.target.value)}
            className="w-full px-4 h-[48px] border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-card text-[14px] text-foreground"
          >
            <option value="">Select...</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Department</label>
          <select
            value={department}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="w-full px-4 h-[48px] border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-card text-[14px] text-foreground"
          >
            <option value="">Select...</option>
            {DEPARTMENT_GROUPS.map((group) => (
              <optgroup key={group.category} label={group.category}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Company Size</label>
          <select
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            className="w-full px-4 h-[48px] border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-card text-[14px] text-foreground"
          >
            {COMPANY_SIZES.map((size) => (
              <option key={size.id} value={size.id}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {spineInitialized && (
        <div className="flex items-center gap-2 p-3 bg-iw-forest-bright/10 border border-emerald-500/20 rounded-xl mb-6 animate-in fade-in duration-300">
          <div className="w-2 h-2 bg-iw-forest-bright rounded-full animate-pulse" />
          <p className="text-sm text-iw-forest-mid font-medium">
            Spine schema configured for{" "}
            <strong>{INDUSTRIES.find((i) => i.id === industry)?.label}</strong> +{" "}
            <strong>
              {DEPARTMENT_GROUPS.flatMap((g) => g.options).find((d) => d.id === department)?.label}
            </strong>
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          className="h-[48px] min-w-[100px] flex items-center justify-center gap-2 px-5 text-foreground border border-border hover:bg-muted font-semibold rounded-xl bg-card transition-all text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleContinue}
          disabled={!canContinue || isSubmitting}
          className={`h-[48px] flex-1 flex items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-all ${
            canContinue && !isSubmitting
              ? "bg-primary text-primary-foreground hover:bg-iw-forest-bright"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
          }`}
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() =>
            onComplete({ industry: "OTHER", department: "OPERATIONS", companySize: "51-200" })
          }
          className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default ProfileStep;
