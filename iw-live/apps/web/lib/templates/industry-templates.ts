/**
 * Industry Templates for One-Click Setup
 *
 * Each template pre-fills:
 * - Pipeline stages
 * - Chart of accounts
 * - Products/Services catalog
 * - Tax configuration
 * - Dashboard widgets
 * - KPI metrics
 * - Sample workflows
 */

export interface IndustryTemplate {
  id: string
  name: string
  icon: string
  description: string
  color: string
  popular?: boolean

  // Pre-filled data
  pipeline: PipelineStage[]
  chartOfAccounts: AccountTemplate[]
  products: ProductTemplate[]
  services: ServiceTemplate[]
  taxConfig: TaxConfigTemplate
  dashboardWidgets: WidgetTemplate[]
  kpis: KPITemplate[]
  defaultCurrency: string
  fiscalYearStart: string // MM-DD format
}

interface PipelineStage {
  name: string
  probability: number
  daysInStage: number
  color: string
}

interface AccountTemplate {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
}

interface ProductTemplate {
  name: string
  description: string
  category: string
  defaultPrice?: number
  taxable: boolean
}

interface ServiceTemplate {
  name: string
  description: string
  category: string
  hourlyRate?: number
  fixedPrice?: number
  taxable: boolean
}

interface TaxConfigTemplate {
  defaultTaxRate: number
  taxType: 'gst' | 'vat' | 'sales_tax' | 'none'
  includesInPrice: boolean
}

interface WidgetTemplate {
  type: string
  title: string
  size: 'small' | 'medium' | 'large'
  position: number
}

interface KPITemplate {
  name: string
  metric: string
  target?: number
  unit: string
}

// =============================================================================
// INDUSTRY TEMPLATES
// =============================================================================

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  // ---------------------------------------------------------------------------
  // CONSULTING / PROFESSIONAL SERVICES
  // ---------------------------------------------------------------------------
  {
    id: 'consulting',
    name: 'Consulting',
    icon: '💼',
    description: 'Professional services, consulting firms, advisory',
    color: 'blue',
    popular: true,
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Lead', probability: 10, daysInStage: 7, color: '#94a3b8' },
      { name: 'Discovery Call', probability: 25, daysInStage: 5, color: '#60a5fa' },
      { name: 'Proposal Sent', probability: 50, daysInStage: 10, color: '#a78bfa' },
      { name: 'Negotiation', probability: 75, daysInStage: 7, color: '#f59e0b' },
      { name: 'Closed Won', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Closed Lost', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      // Assets
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1200', name: 'Work in Progress', type: 'asset', category: 'Current Assets' },
      { code: '1500', name: 'Office Equipment', type: 'asset', category: 'Fixed Assets' },
      { code: '1510', name: 'Computer Equipment', type: 'asset', category: 'Fixed Assets' },
      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2200', name: 'TDS Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2300', name: 'Deferred Revenue', type: 'liability', category: 'Current Liabilities' },
      // Revenue
      { code: '4000', name: 'Consulting Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4100', name: 'Training Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4200', name: 'Retainer Revenue', type: 'revenue', category: 'Operating Revenue' },
      // Expenses
      { code: '5000', name: 'Salaries & Wages', type: 'expense', category: 'Operating Expenses' },
      { code: '5100', name: 'Contractor Payments', type: 'expense', category: 'Operating Expenses' },
      { code: '5200', name: 'Travel & Lodging', type: 'expense', category: 'Operating Expenses' },
      { code: '5300', name: 'Software Subscriptions', type: 'expense', category: 'Operating Expenses' },
      { code: '5400', name: 'Marketing & Advertising', type: 'expense', category: 'Operating Expenses' },
      { code: '5500', name: 'Professional Development', type: 'expense', category: 'Operating Expenses' },
      { code: '5600', name: 'Office Rent', type: 'expense', category: 'Operating Expenses' },
    ],

    services: [
      { name: 'Strategy Consulting', description: 'Business strategy and planning', category: 'Consulting', hourlyRate: 5000, taxable: true },
      { name: 'Process Improvement', description: 'Operational efficiency consulting', category: 'Consulting', hourlyRate: 4000, taxable: true },
      { name: 'Digital Transformation', description: 'Technology strategy and implementation', category: 'Consulting', hourlyRate: 6000, taxable: true },
      { name: 'Training Workshop', description: 'Corporate training sessions', category: 'Training', fixedPrice: 50000, taxable: true },
      { name: 'Monthly Retainer', description: 'Ongoing advisory services', category: 'Retainer', fixedPrice: 100000, taxable: true },
    ],

    products: [],

    taxConfig: {
      defaultTaxRate: 18,
      taxType: 'gst',
      includesInPrice: false,
    },

    dashboardWidgets: [
      { type: 'revenue_mtd', title: 'Revenue This Month', size: 'small', position: 1 },
      { type: 'pipeline_value', title: 'Pipeline Value', size: 'small', position: 2 },
      { type: 'utilization_rate', title: 'Billable Utilization', size: 'small', position: 3 },
      { type: 'outstanding_invoices', title: 'Outstanding Invoices', size: 'small', position: 4 },
      { type: 'deal_pipeline', title: 'Sales Pipeline', size: 'large', position: 5 },
      { type: 'revenue_trend', title: 'Revenue Trend', size: 'medium', position: 6 },
    ],

    kpis: [
      { name: 'Monthly Revenue', metric: 'revenue_monthly', target: 1000000, unit: 'INR' },
      { name: 'Billable Utilization', metric: 'utilization_rate', target: 75, unit: '%' },
      { name: 'Average Project Value', metric: 'avg_deal_size', target: 500000, unit: 'INR' },
      { name: 'Client Retention', metric: 'retention_rate', target: 90, unit: '%' },
      { name: 'Proposal Win Rate', metric: 'win_rate', target: 40, unit: '%' },
    ],
  },

  // ---------------------------------------------------------------------------
  // E-COMMERCE
  // ---------------------------------------------------------------------------
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: '🛒',
    description: 'Online retail, D2C brands, marketplace sellers',
    color: 'green',
    popular: true,
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Website Visitor', probability: 5, daysInStage: 1, color: '#94a3b8' },
      { name: 'Cart Added', probability: 20, daysInStage: 1, color: '#60a5fa' },
      { name: 'Checkout Started', probability: 40, daysInStage: 1, color: '#a78bfa' },
      { name: 'Payment Pending', probability: 70, daysInStage: 1, color: '#f59e0b' },
      { name: 'Order Placed', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Abandoned', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      // Assets
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1200', name: 'Inventory', type: 'asset', category: 'Current Assets' },
      { code: '1300', name: 'Prepaid Expenses', type: 'asset', category: 'Current Assets' },
      { code: '1500', name: 'Warehouse Equipment', type: 'asset', category: 'Fixed Assets' },
      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2200', name: 'Customer Deposits', type: 'liability', category: 'Current Liabilities' },
      { code: '2300', name: 'Returns & Refunds Reserve', type: 'liability', category: 'Current Liabilities' },
      // Revenue
      { code: '4000', name: 'Product Sales', type: 'revenue', category: 'Operating Revenue' },
      { code: '4100', name: 'Shipping Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4900', name: 'Returns & Refunds', type: 'revenue', category: 'Contra Revenue' },
      // Expenses
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense', category: 'Direct Costs' },
      { code: '5100', name: 'Shipping & Fulfillment', type: 'expense', category: 'Direct Costs' },
      { code: '5200', name: 'Payment Processing Fees', type: 'expense', category: 'Direct Costs' },
      { code: '5300', name: 'Marketplace Fees', type: 'expense', category: 'Direct Costs' },
      { code: '5400', name: 'Marketing & Ads', type: 'expense', category: 'Operating Expenses' },
      { code: '5500', name: 'Packaging Materials', type: 'expense', category: 'Operating Expenses' },
      { code: '5600', name: 'Warehouse Rent', type: 'expense', category: 'Operating Expenses' },
      { code: '5700', name: 'Returns Processing', type: 'expense', category: 'Operating Expenses' },
    ],

    products: [
      { name: 'Sample Product A', description: 'Your first product', category: 'General', defaultPrice: 999, taxable: true },
      { name: 'Sample Product B', description: 'Your second product', category: 'General', defaultPrice: 1499, taxable: true },
    ],

    services: [
      { name: 'Express Shipping', description: 'Priority delivery', category: 'Shipping', fixedPrice: 99, taxable: true },
      { name: 'Gift Wrapping', description: 'Premium gift packaging', category: 'Add-on', fixedPrice: 49, taxable: true },
    ],

    taxConfig: {
      defaultTaxRate: 18,
      taxType: 'gst',
      includesInPrice: true,
    },

    dashboardWidgets: [
      { type: 'revenue_today', title: "Today's Revenue", size: 'small', position: 1 },
      { type: 'orders_today', title: "Today's Orders", size: 'small', position: 2 },
      { type: 'aov', title: 'Avg Order Value', size: 'small', position: 3 },
      { type: 'conversion_rate', title: 'Conversion Rate', size: 'small', position: 4 },
      { type: 'sales_trend', title: 'Sales Trend', size: 'large', position: 5 },
      { type: 'top_products', title: 'Top Products', size: 'medium', position: 6 },
    ],

    kpis: [
      { name: 'Daily Revenue', metric: 'revenue_daily', target: 50000, unit: 'INR' },
      { name: 'Conversion Rate', metric: 'conversion_rate', target: 3, unit: '%' },
      { name: 'Average Order Value', metric: 'aov', target: 1500, unit: 'INR' },
      { name: 'Return Rate', metric: 'return_rate', target: 5, unit: '%' },
      { name: 'Customer Acquisition Cost', metric: 'cac', target: 500, unit: 'INR' },
    ],
  },

  // ---------------------------------------------------------------------------
  // DIGITAL AGENCY
  // ---------------------------------------------------------------------------
  {
    id: 'agency',
    name: 'Digital Agency',
    icon: '🏢',
    description: 'Marketing, design, development agencies',
    color: 'purple',
    popular: true,
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Inquiry', probability: 10, daysInStage: 3, color: '#94a3b8' },
      { name: 'Discovery', probability: 25, daysInStage: 5, color: '#60a5fa' },
      { name: 'Proposal', probability: 50, daysInStage: 7, color: '#a78bfa' },
      { name: 'Contract Review', probability: 75, daysInStage: 5, color: '#f59e0b' },
      { name: 'Signed', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Lost', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      // Assets
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1200', name: 'Unbilled Revenue', type: 'asset', category: 'Current Assets' },
      { code: '1500', name: 'Computer Equipment', type: 'asset', category: 'Fixed Assets' },
      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2200', name: 'Client Retainers', type: 'liability', category: 'Current Liabilities' },
      // Revenue
      { code: '4000', name: 'Project Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4100', name: 'Retainer Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4200', name: 'Ad Spend Pass-through', type: 'revenue', category: 'Operating Revenue' },
      // Expenses
      { code: '5000', name: 'Salaries & Wages', type: 'expense', category: 'Operating Expenses' },
      { code: '5100', name: 'Freelancer Payments', type: 'expense', category: 'Operating Expenses' },
      { code: '5200', name: 'Software & Tools', type: 'expense', category: 'Operating Expenses' },
      { code: '5300', name: 'Ad Spend (Client)', type: 'expense', category: 'Pass-through' },
      { code: '5400', name: 'Stock Photos & Assets', type: 'expense', category: 'Operating Expenses' },
      { code: '5500', name: 'Office & Coworking', type: 'expense', category: 'Operating Expenses' },
    ],

    services: [
      { name: 'Website Design', description: 'Custom website design', category: 'Design', fixedPrice: 150000, taxable: true },
      { name: 'Website Development', description: 'Full-stack development', category: 'Development', fixedPrice: 200000, taxable: true },
      { name: 'SEO Monthly', description: 'Search engine optimization', category: 'Marketing', fixedPrice: 30000, taxable: true },
      { name: 'Social Media Management', description: 'Monthly social media', category: 'Marketing', fixedPrice: 25000, taxable: true },
      { name: 'PPC Management', description: 'Paid ads management', category: 'Marketing', fixedPrice: 20000, taxable: true },
      { name: 'Brand Identity', description: 'Logo & brand design', category: 'Design', fixedPrice: 75000, taxable: true },
      { name: 'Hourly Consulting', description: 'Strategy consultation', category: 'Consulting', hourlyRate: 3000, taxable: true },
    ],

    products: [],

    taxConfig: {
      defaultTaxRate: 18,
      taxType: 'gst',
      includesInPrice: false,
    },

    dashboardWidgets: [
      { type: 'revenue_mtd', title: 'Revenue This Month', size: 'small', position: 1 },
      { type: 'active_projects', title: 'Active Projects', size: 'small', position: 2 },
      { type: 'retainer_mrr', title: 'Retainer MRR', size: 'small', position: 3 },
      { type: 'team_utilization', title: 'Team Utilization', size: 'small', position: 4 },
      { type: 'project_timeline', title: 'Project Timeline', size: 'large', position: 5 },
      { type: 'client_health', title: 'Client Health', size: 'medium', position: 6 },
    ],

    kpis: [
      { name: 'Monthly Revenue', metric: 'revenue_monthly', target: 2000000, unit: 'INR' },
      { name: 'Retainer MRR', metric: 'mrr', target: 500000, unit: 'INR' },
      { name: 'Project Margin', metric: 'project_margin', target: 40, unit: '%' },
      { name: 'Client Retention', metric: 'retention_rate', target: 85, unit: '%' },
      { name: 'Team Utilization', metric: 'utilization_rate', target: 70, unit: '%' },
    ],
  },

  // ---------------------------------------------------------------------------
  // SaaS
  // ---------------------------------------------------------------------------
  {
    id: 'saas',
    name: 'SaaS',
    icon: '💻',
    description: 'Software as a Service, subscription businesses',
    color: 'cyan',
    popular: true,
    defaultCurrency: 'USD',
    fiscalYearStart: '01-01',

    pipeline: [
      { name: 'Trial Signup', probability: 10, daysInStage: 14, color: '#94a3b8' },
      { name: 'Activated', probability: 30, daysInStage: 7, color: '#60a5fa' },
      { name: 'Demo Scheduled', probability: 50, daysInStage: 5, color: '#a78bfa' },
      { name: 'Proposal', probability: 70, daysInStage: 7, color: '#f59e0b' },
      { name: 'Converted', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Churned', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      // Assets
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1200', name: 'Deferred Commissions', type: 'asset', category: 'Current Assets' },
      // Liabilities
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'Deferred Revenue', type: 'liability', category: 'Current Liabilities' },
      { code: '2200', name: 'Customer Deposits', type: 'liability', category: 'Current Liabilities' },
      // Revenue
      { code: '4000', name: 'Subscription Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4100', name: 'Professional Services', type: 'revenue', category: 'Operating Revenue' },
      { code: '4200', name: 'Usage Revenue', type: 'revenue', category: 'Operating Revenue' },
      // Expenses
      { code: '5000', name: 'Hosting & Infrastructure', type: 'expense', category: 'Cost of Revenue' },
      { code: '5100', name: 'Customer Support', type: 'expense', category: 'Cost of Revenue' },
      { code: '5200', name: 'Payment Processing', type: 'expense', category: 'Cost of Revenue' },
      { code: '5300', name: 'Engineering Salaries', type: 'expense', category: 'R&D' },
      { code: '5400', name: 'Product Development', type: 'expense', category: 'R&D' },
      { code: '5500', name: 'Sales & Marketing', type: 'expense', category: 'S&M' },
      { code: '5600', name: 'G&A', type: 'expense', category: 'General & Admin' },
    ],

    products: [
      { name: 'Starter Plan', description: 'For small teams', category: 'Subscription', defaultPrice: 29, taxable: true },
      { name: 'Pro Plan', description: 'For growing businesses', category: 'Subscription', defaultPrice: 99, taxable: true },
      { name: 'Enterprise Plan', description: 'For large organizations', category: 'Subscription', defaultPrice: 299, taxable: true },
    ],

    services: [
      { name: 'Onboarding', description: 'Setup and training', category: 'Services', fixedPrice: 500, taxable: true },
      { name: 'Custom Integration', description: 'API integration services', category: 'Services', hourlyRate: 150, taxable: true },
    ],

    taxConfig: {
      defaultTaxRate: 0,
      taxType: 'none',
      includesInPrice: true,
    },

    dashboardWidgets: [
      { type: 'mrr', title: 'Monthly Recurring Revenue', size: 'small', position: 1 },
      { type: 'arr', title: 'Annual Recurring Revenue', size: 'small', position: 2 },
      { type: 'churn_rate', title: 'Churn Rate', size: 'small', position: 3 },
      { type: 'ltv', title: 'Customer LTV', size: 'small', position: 4 },
      { type: 'mrr_trend', title: 'MRR Growth', size: 'large', position: 5 },
      { type: 'cohort_analysis', title: 'Retention Cohorts', size: 'medium', position: 6 },
    ],

    kpis: [
      { name: 'MRR', metric: 'mrr', target: 50000, unit: 'USD' },
      { name: 'Net Revenue Retention', metric: 'nrr', target: 110, unit: '%' },
      { name: 'Churn Rate', metric: 'churn_rate', target: 3, unit: '%' },
      { name: 'LTV/CAC Ratio', metric: 'ltv_cac', target: 3, unit: 'x' },
      { name: 'Trial Conversion', metric: 'trial_conversion', target: 15, unit: '%' },
    ],
  },

  // ---------------------------------------------------------------------------
  // STARTUP (BLANK BUT OPTIMIZED)
  // ---------------------------------------------------------------------------
  {
    id: 'startup',
    name: 'Startup',
    icon: '⚡',
    description: 'Early-stage, lean setup, grow as you go',
    color: 'yellow',
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Lead', probability: 10, daysInStage: 7, color: '#94a3b8' },
      { name: 'Qualified', probability: 30, daysInStage: 7, color: '#60a5fa' },
      { name: 'Meeting', probability: 50, daysInStage: 5, color: '#a78bfa' },
      { name: 'Proposal', probability: 70, daysInStage: 7, color: '#f59e0b' },
      { name: 'Won', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Lost', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '3000', name: 'Founder Equity', type: 'equity', category: 'Equity' },
      { code: '4000', name: 'Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '5000', name: 'Operating Expenses', type: 'expense', category: 'Operating Expenses' },
    ],

    products: [],
    services: [],

    taxConfig: {
      defaultTaxRate: 18,
      taxType: 'gst',
      includesInPrice: false,
    },

    dashboardWidgets: [
      { type: 'revenue_mtd', title: 'Revenue', size: 'small', position: 1 },
      { type: 'expenses_mtd', title: 'Expenses', size: 'small', position: 2 },
      { type: 'cash_balance', title: 'Cash Balance', size: 'small', position: 3 },
      { type: 'runway', title: 'Runway', size: 'small', position: 4 },
    ],

    kpis: [
      { name: 'Monthly Revenue', metric: 'revenue_monthly', target: 100000, unit: 'INR' },
      { name: 'Burn Rate', metric: 'burn_rate', target: 200000, unit: 'INR' },
      { name: 'Runway', metric: 'runway_months', target: 12, unit: 'months' },
    ],
  },

  // ---------------------------------------------------------------------------
  // HEALTHCARE / CLINIC
  // ---------------------------------------------------------------------------
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Clinics, medical practices, wellness centers',
    color: 'red',
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Inquiry', probability: 20, daysInStage: 2, color: '#94a3b8' },
      { name: 'Appointment Booked', probability: 60, daysInStage: 3, color: '#60a5fa' },
      { name: 'Consultation Done', probability: 80, daysInStage: 1, color: '#a78bfa' },
      { name: 'Treatment Started', probability: 90, daysInStage: 7, color: '#f59e0b' },
      { name: 'Completed', probability: 100, daysInStage: 0, color: '#22c55e' },
    ],

    chartOfAccounts: [
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1200', name: 'Medical Equipment', type: 'asset', category: 'Fixed Assets' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '4000', name: 'Consultation Fees', type: 'revenue', category: 'Operating Revenue' },
      { code: '4100', name: 'Treatment Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4200', name: 'Lab Test Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '5000', name: 'Medical Supplies', type: 'expense', category: 'Direct Costs' },
      { code: '5100', name: 'Staff Salaries', type: 'expense', category: 'Operating Expenses' },
      { code: '5200', name: 'Rent & Utilities', type: 'expense', category: 'Operating Expenses' },
    ],

    services: [
      { name: 'General Consultation', description: 'Doctor consultation', category: 'Consultation', fixedPrice: 500, taxable: false },
      { name: 'Specialist Consultation', description: 'Specialist doctor visit', category: 'Consultation', fixedPrice: 1000, taxable: false },
      { name: 'Health Checkup', description: 'Complete health package', category: 'Packages', fixedPrice: 3000, taxable: true },
    ],

    products: [
      { name: 'Medicines (Generic)', description: 'Generic medicines', category: 'Pharmacy', taxable: true },
    ],

    taxConfig: {
      defaultTaxRate: 5,
      taxType: 'gst',
      includesInPrice: true,
    },

    dashboardWidgets: [
      { type: 'patients_today', title: "Today's Patients", size: 'small', position: 1 },
      { type: 'revenue_mtd', title: 'Revenue This Month', size: 'small', position: 2 },
      { type: 'appointments', title: 'Upcoming Appointments', size: 'medium', position: 3 },
    ],

    kpis: [
      { name: 'Daily Patients', metric: 'patients_daily', target: 20, unit: 'patients' },
      { name: 'Monthly Revenue', metric: 'revenue_monthly', target: 500000, unit: 'INR' },
      { name: 'Patient Satisfaction', metric: 'nps', target: 70, unit: 'NPS' },
    ],
  },

  // ---------------------------------------------------------------------------
  // EDUCATION / COACHING
  // ---------------------------------------------------------------------------
  {
    id: 'education',
    name: 'Education',
    icon: '📚',
    description: 'Coaching, tutoring, online courses, ed-tech',
    color: 'indigo',
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Inquiry', probability: 15, daysInStage: 3, color: '#94a3b8' },
      { name: 'Demo Class', probability: 40, daysInStage: 5, color: '#60a5fa' },
      { name: 'Follow-up', probability: 60, daysInStage: 3, color: '#a78bfa' },
      { name: 'Enrolled', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Not Interested', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Fees Receivable', type: 'asset', category: 'Current Assets' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2200', name: 'Advance Fees', type: 'liability', category: 'Current Liabilities' },
      { code: '4000', name: 'Course Fees', type: 'revenue', category: 'Operating Revenue' },
      { code: '4100', name: 'Workshop Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '4200', name: 'Material Sales', type: 'revenue', category: 'Operating Revenue' },
      { code: '5000', name: 'Faculty Payments', type: 'expense', category: 'Operating Expenses' },
      { code: '5100', name: 'Course Materials', type: 'expense', category: 'Operating Expenses' },
      { code: '5200', name: 'Platform Costs', type: 'expense', category: 'Operating Expenses' },
    ],

    products: [
      { name: 'Study Material', description: 'Course study materials', category: 'Materials', defaultPrice: 500, taxable: true },
    ],

    services: [
      { name: 'Monthly Tuition', description: 'Regular classes', category: 'Tuition', fixedPrice: 5000, taxable: false },
      { name: 'Crash Course', description: 'Intensive program', category: 'Course', fixedPrice: 15000, taxable: false },
      { name: 'One-on-One Session', description: 'Personal tutoring', category: 'Tutoring', hourlyRate: 1000, taxable: false },
    ],

    taxConfig: {
      defaultTaxRate: 0,
      taxType: 'gst',
      includesInPrice: true,
    },

    dashboardWidgets: [
      { type: 'active_students', title: 'Active Students', size: 'small', position: 1 },
      { type: 'revenue_mtd', title: 'Revenue This Month', size: 'small', position: 2 },
      { type: 'enrollments_mtd', title: 'New Enrollments', size: 'small', position: 3 },
    ],

    kpis: [
      { name: 'Active Students', metric: 'active_students', target: 100, unit: 'students' },
      { name: 'Monthly Revenue', metric: 'revenue_monthly', target: 300000, unit: 'INR' },
      { name: 'Course Completion', metric: 'completion_rate', target: 80, unit: '%' },
    ],
  },

  // ---------------------------------------------------------------------------
  // CONSTRUCTION / CONTRACTOR
  // ---------------------------------------------------------------------------
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    description: 'Contractors, builders, construction firms',
    color: 'orange',
    defaultCurrency: 'INR',
    fiscalYearStart: '04-01',

    pipeline: [
      { name: 'Site Visit Request', probability: 15, daysInStage: 3, color: '#94a3b8' },
      { name: 'Site Assessment', probability: 30, daysInStage: 5, color: '#60a5fa' },
      { name: 'Quotation Sent', probability: 50, daysInStage: 10, color: '#a78bfa' },
      { name: 'Negotiation', probability: 70, daysInStage: 7, color: '#f59e0b' },
      { name: 'Contract Signed', probability: 100, daysInStage: 0, color: '#22c55e' },
      { name: 'Not Proceeding', probability: 0, daysInStage: 0, color: '#ef4444' },
    ],

    chartOfAccounts: [
      { code: '1000', name: 'Cash & Bank', type: 'asset', category: 'Current Assets' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1200', name: 'Retention Receivable', type: 'asset', category: 'Current Assets' },
      { code: '1300', name: 'Work in Progress', type: 'asset', category: 'Current Assets' },
      { code: '1500', name: 'Equipment & Machinery', type: 'asset', category: 'Fixed Assets' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2100', name: 'GST Payable', type: 'liability', category: 'Current Liabilities' },
      { code: '2200', name: 'Advance from Customers', type: 'liability', category: 'Current Liabilities' },
      { code: '4000', name: 'Contract Revenue', type: 'revenue', category: 'Operating Revenue' },
      { code: '5000', name: 'Material Costs', type: 'expense', category: 'Direct Costs' },
      { code: '5100', name: 'Labor Costs', type: 'expense', category: 'Direct Costs' },
      { code: '5200', name: 'Subcontractor Payments', type: 'expense', category: 'Direct Costs' },
      { code: '5300', name: 'Equipment Rental', type: 'expense', category: 'Direct Costs' },
      { code: '5400', name: 'Site Expenses', type: 'expense', category: 'Operating Expenses' },
    ],

    services: [
      { name: 'Residential Construction', description: 'Home building', category: 'Construction', taxable: true },
      { name: 'Commercial Construction', description: 'Office/retail building', category: 'Construction', taxable: true },
      { name: 'Renovation', description: 'Interior renovation', category: 'Renovation', taxable: true },
    ],

    products: [
      { name: 'Construction Materials', description: 'Building materials', category: 'Materials', taxable: true },
    ],

    taxConfig: {
      defaultTaxRate: 18,
      taxType: 'gst',
      includesInPrice: false,
    },

    dashboardWidgets: [
      { type: 'active_projects', title: 'Active Projects', size: 'small', position: 1 },
      { type: 'revenue_mtd', title: 'Revenue This Month', size: 'small', position: 2 },
      { type: 'project_progress', title: 'Project Progress', size: 'large', position: 3 },
    ],

    kpis: [
      { name: 'Active Projects', metric: 'active_projects', target: 5, unit: 'projects' },
      { name: 'Monthly Billing', metric: 'revenue_monthly', target: 5000000, unit: 'INR' },
      { name: 'Project Margin', metric: 'project_margin', target: 20, unit: '%' },
    ],
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getTemplateById(id: string): IndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES.find(t => t.id === id)
}

export function getPopularTemplates(): IndustryTemplate[] {
  return INDUSTRY_TEMPLATES.filter(t => t.popular)
}

export function getAllTemplates(): IndustryTemplate[] {
  return INDUSTRY_TEMPLATES
}
