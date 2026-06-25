/**
 * Client-side Template Management
 * 
 * Manages template configuration in browser storage
 * Defers database writes until user enables server integrations
 */

import type { IndustryTemplate } from "./industry-templates";

export interface TemplateConfig {
  id: string;
  name: string;
  icon: string;
  selectedAt: string;
  pipeline: Array<{
    name: string;
    probability: number;
    daysInStage: number;
    color: string;
  }>;
  defaultCurrency: string;
  fiscalYearStart: string;
}

const STORAGE_KEY = "integratewise_template";
const ONBOARDING_KEY = "integratewise_onboarding_complete";

/**
 * Get the currently selected template from localStorage
 */
export function getSelectedTemplate(): TemplateConfig | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as TemplateConfig;
  } catch (error) {
    console.error("Error reading template from localStorage:", error);
    return null;
  }
}

/**
 * Save template selection to localStorage
 */
export function saveTemplateSelection(template: IndustryTemplate): void {
  if (typeof window === "undefined") return;
  
  const config: TemplateConfig = {
    id: template.id,
    name: template.name,
    icon: template.icon,
    selectedAt: new Date().toISOString(),
    pipeline: template.pipeline,
    defaultCurrency: template.defaultCurrency,
    fiscalYearStart: template.fiscalYearStart,
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch (error) {
    console.error("Error saving template to localStorage:", error);
  }
}

/**
 * Check if onboarding has been completed
 */
export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;
  
  const status = localStorage.getItem(ONBOARDING_KEY);
  return status === "true" || status === "skipped";
}

/**
 * Get onboarding status
 */
export function getOnboardingStatus(): "incomplete" | "complete" | "skipped" {
  if (typeof window === "undefined") return "incomplete";
  
  const status = localStorage.getItem(ONBOARDING_KEY);
  if (status === "true") return "complete";
  if (status === "skipped") return "skipped";
  return "incomplete";
}

/**
 * Clear template selection (for testing or reset)
 */
export function clearTemplateSelection(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ONBOARDING_KEY);
}

/**
 * Get domain pages that should be available based on template
 */
export function getAvailableDomainPages(templateId: string): Array<{
  name: string;
  path: string;
  icon: string;
  description: string;
}> {
  // Base pages available to all templates
  const basePages = [
    { name: "Overview", path: "/overview", icon: "🏠", description: "Dashboard overview" },
    { name: "Tasks", path: "/tasks", icon: "✅", description: "Task management" },
    { name: "Insights", path: "/insights", icon: "💡", description: "AI insights" },
    { name: "Normalize", path: "/normalize", icon: "🔄", description: "Data normalization" },
    { name: "OS Pages", path: "/os", icon: "📊", description: "Operating system" },
  ];
  
  // Template-specific pages
  const templatePages: Record<string, Array<any>> = {
    consulting: [
      { name: "Projects", path: "/projects", icon: "📋", description: "Project management" },
      { name: "Clients", path: "/clients", icon: "👥", description: "Client management" },
      { name: "Pipeline", path: "/pipeline", icon: "💼", description: "Sales pipeline" },
      { name: "Metrics", path: "/metrics", icon: "📈", description: "Business metrics" },
    ],
    ecommerce: [
      { name: "Products", path: "/products", icon: "📦", description: "Product catalog" },
      { name: "Sales", path: "/sales", icon: "💰", description: "Sales tracking" },
      { name: "Metrics", path: "/metrics", icon: "📊", description: "E-commerce metrics" },
    ],
    agency: [
      { name: "Projects", path: "/projects", icon: "📋", description: "Client projects" },
      { name: "Clients", path: "/clients", icon: "👥", description: "Client management" },
      { name: "Services", path: "/services", icon: "🛠️", description: "Service offerings" },
      { name: "Pipeline", path: "/pipeline", icon: "💼", description: "Sales pipeline" },
    ],
    saas: [
      { name: "Products", path: "/products", icon: "💻", description: "Product features" },
      { name: "Metrics", path: "/metrics", icon: "📈", description: "SaaS metrics" },
      { name: "Pipeline", path: "/pipeline", icon: "💼", description: "Sales pipeline" },
    ],
    startup: [
      { name: "Strategy", path: "/strategy", icon: "🎯", description: "Strategic planning" },
      { name: "Metrics", path: "/metrics", icon: "📊", description: "Key metrics" },
    ],
    healthcare: [
      { name: "Clients", path: "/clients", icon: "🏥", description: "Patient management" },
      { name: "Services", path: "/services", icon: "⚕️", description: "Medical services" },
    ],
    education: [
      { name: "Clients", path: "/clients", icon: "📚", description: "Student management" },
      { name: "Services", path: "/services", icon: "🎓", description: "Courses" },
    ],
    construction: [
      { name: "Projects", path: "/projects", icon: "🏗️", description: "Construction projects" },
      { name: "Clients", path: "/clients", icon: "👥", description: "Client management" },
    ],
  };
  
  const specific = templatePages[templateId] || [];
  return [...basePages, ...specific];
}
