export interface ClientTemplate {
  id: string
  name: string
  description: string
  fields: TemplateField[]
}

export interface TemplateField {
  key: string
  label: string
  type: "text" | "email" | "phone" | "url" | "select" | "multiselect"
  required: boolean
  options?: string[]
}

const defaultClientTemplate: ClientTemplate = {
  id: "default-client",
  name: "Standard Client",
  description: "Default client template with essential fields",
  fields: [
    { key: "company_name", label: "Company Name", type: "text", required: true },
    {
      key: "industry",
      label: "Industry",
      type: "select",
      required: false,
      options: ["Technology", "Healthcare", "Finance", "Retail", "Other"],
    },
    { key: "website", label: "Website", type: "url", required: false },
    { key: "annual_revenue", label: "Annual Revenue", type: "text", required: false },
    {
      key: "employee_count",
      label: "Employee Count",
      type: "select",
      required: false,
      options: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },
  ],
}

export function getClientTemplate(templateId = "default-client"): ClientTemplate {
  if (templateId === "default-client") {
    return defaultClientTemplate
  }
  return defaultClientTemplate
}

export function validateClientData(
  data: Record<string, any>,
  template: ClientTemplate,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  template.fields.forEach((field) => {
    if (field.required && !data[field.key]) {
      errors.push(`${field.label} is required`)
    }
  })

  return { valid: errors.length === 0, errors }
}

export default getClientTemplate
