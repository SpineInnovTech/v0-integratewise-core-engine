import {
  Construction,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  GitBranch,
  CheckSquare,
  FileText,
  Calendar,
  BarChart3,
  Globe,
  FileEdit,
  Image,
  Search,
  Palette,
  Megaphone,
  Mail,
  FormInput,
  Share2,
  Target,
  TrendingUp,
  Users,
  ClipboardList,
  FileSignature,
  Activity,
} from "lucide-react";

const viewMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; description: string; features: string[] }
> = {
  workflows: {
    icon: GitBranch,
    description:
      "Visual drag-drop workflow builder with trigger, condition, action, AI agent, and approval gate nodes.",
    features: [
      "Visual canvas with zoom/pan",
      "Pre-built workflow templates",
      "AI Agent nodes (sentiment, churn, next action)",
      "Execution logs with real-time status",
      "Approval gates for governance",
    ],
  },
  tasks: {
    icon: CheckSquare,
    description:
      "Operations tracker with list, calendar, and kanban views. Smart grouping by integration health or account risk.",
    features: [
      "Multi-view: List, Calendar, Kanban",
      "Priority flags with APAC timezone awareness",
      "Source system badges (Slack, Asana, etc.)",
      "Smart grouping by risk tier or department",
      "Cross-system task linking",
    ],
  },
  documents: {
    icon: FileText,
    description:
      "Knowledge base with semantic search across all connected document systems via Spine.",
    features: [
      "Grid & list layouts with previews",
      "Source system filters (Drive, Notion, Confluence)",
      "Tags: SOP, Playbook, Contract, Guide",
      "Semantic search powered by Spine",
      "Access levels: Public, Team, Private",
    ],
  },
  calendar: {
    icon: Calendar,
    description:
      "Unified APAC calendar aggregating Google Cal, Outlook, Zoom, and internal milestones.",
    features: [
      "Multi-source aggregation",
      "IST primary with multi-timezone display",
      "Event types: QBRs, renewals, standups",
      "Integration events from Salesforce & Stripe",
      "Revenue milestone tracking",
    ],
  },
  analytics: {
    icon: BarChart3,
    description: "Comprehensive analytics and reporting across all connected systems and modules.",
    features: [
      "Cross-system data aggregation",
      "Custom report builder",
      "Export to PDF, CSV, Image",
      "Scheduled report delivery",
      "APAC-specific metrics",
    ],
  },
  pages: {
    icon: Globe,
    description: "No-code page manager with SEO scoring and content optimization.",
    features: [
      "Page list with preview thumbnails",
      "SEO score badges (0-100)",
      "Status management (Draft, Published, Scheduled)",
      "Bulk publish/unpublish actions",
      "Traffic indicators per page",
    ],
  },
  blog: {
    icon: FileEdit,
    description: "Blog and content management system with rich editor and SEO optimization.",
    features: [
      "Cover image thumbnails",
      "Category and tag management",
      "Scheduled publishing",
      "SEO score per post",
      "Comments and engagement metrics",
    ],
  },
  media: {
    icon: Image,
    description: "Media library for managing images, videos, and files across your website.",
    features: [
      "Grid view with thumbnails",
      "Drag-drop upload",
      "Image optimization",
      "Alt text management",
      "Usage tracking across pages",
    ],
  },
  seo: {
    icon: Search,
    description: "SEO & metadata center with site-wide health scoring and technical audits.",
    features: [
      "Per-page SEO analysis",
      "Technical SEO: sitemap, robots.txt, schema",
      "Core Web Vitals monitoring",
      "Broken link detection",
      "Keyword tracking",
    ],
  },
  theme: {
    icon: Palette,
    description: "Theme and design system manager with brand kit and global style controls.",
    features: [
      "Brand Kit: logo, colors, fonts",
      "Global typography & spacing",
      "Component library preview",
      "Mobile/tablet/desktop breakpoints",
      "Live preview",
    ],
  },
  campaigns: {
    icon: Megaphone,
    description:
      "Campaign hub with multi-channel management, A/B testing, and performance tracking.",
    features: [
      "Campaign list with status filters",
      "Multi-channel support (Email, Social, Ads)",
      "Performance metrics preview",
      "Quick duplicate and preview",
      "Revenue attribution per campaign",
    ],
  },
  email: {
    icon: Mail,
    description: "Email marketing studio with drag-drop builder, personalization, and automation.",
    features: [
      "Drag-drop email builder",
      "Personalization tokens",
      "A/B testing for subject lines",
      "Template gallery by category",
      "Smart send optimization",
    ],
  },
  forms: {
    icon: FormInput,
    description: "Lead capture forms and landing page builder with conversion tracking.",
    features: [
      "Form builder with conditional logic",
      "Landing page builder with sections",
      "A/B testing with traffic split",
      "CRM and Slack integration",
      "Conversion rate tracking",
    ],
  },
  social: {
    icon: Share2,
    description:
      "Social media manager with content calendar, multi-platform posting, and analytics.",
    features: [
      "Multi-platform composer (LinkedIn, X, FB, IG)",
      "Content calendar with drag-reschedule",
      "Hashtag suggestions",
      "Per-platform preview",
      "Best times to post analytics",
    ],
  },
  attribution: {
    icon: Target,
    description: "Marketing attribution with multi-touch models and funnel analysis.",
    features: [
      "First-touch & last-touch models",
      "Multi-touch attribution",
      "Campaign ROI analysis",
      "Funnel drop-off visualization",
      "Cohort retention tables",
    ],
  },
  deals: {
    icon: TrendingUp,
    description:
      "Deal detail pages with activity timeline, contact management, and document tracking.",
    features: [
      "3-column layout: Activity | Info | Context",
      "Call recordings and email threads",
      "Product line items and competitors",
      "Document management (quotes, SOWs)",
      "Related deals from same account",
    ],
  },
  contacts: {
    icon: Users,
    description: "Contacts and accounts manager with engagement heatmaps and deal associations.",
    features: [
      "Contact cards with role indicators",
      "Engagement heatmap (opens, meetings)",
      "Account tier management",
      "Health score from CS Intelligence",
      "Quick email and meeting scheduling",
    ],
  },
  forecasting: {
    icon: BarChart3,
    description:
      "Sales forecasting with confidence weighting, scenario planning, and quota tracking.",
    features: [
      "Weighted forecast table",
      "Forecast categories (Best Case, Commit, Pipeline)",
      "Risk flags from ChurnShield agent",
      "Scenario planning with 'what if' slider",
      "Gap-to-quota visualization",
    ],
  },
  activities: {
    icon: ClipboardList,
    description:
      "Activity tracker with calendar and list views, synced with Google Calendar and Zoom.",
    features: [
      "Activity types: Calls, Emails, Meetings, Tasks",
      "Quick-log common activities",
      "Google Calendar & Zoom sync",
      "Related deal/contact linking",
      "Overdue task highlighting",
    ],
  },
  quotes: {
    icon: FileSignature,
    description: "Quote builder and contract management with e-signature integration.",
    features: [
      "Product catalog with pricing tiers",
      "Volume discount configuration",
      "E-signature (DocuSign, PandaDoc)",
      "Approval workflows for discounts",
      "Contract version history & redlining",
    ],
  },
};

export function PlaceholderView({ module, view }: { module: string; view: string }) {
  const meta = viewMeta[view];
  const Icon = meta?.icon || Construction;

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, var(--iw-forest)15, var(--iw-gold)15)`,
          }}
        >
          <Icon className="w-7 h-7 text-primary" />
        </div>

        <h2 className="mb-2 capitalize">{view.replace(/([A-Z])/g, " $1").replace(/-/g, " ")}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {meta?.description || `This ${module} module view is coming soon.`}
        </p>

        {meta?.features && (
          <div className="text-left bg-card border border-border rounded-lg p-4 mb-6">
            <div
              className="text-xs text-muted-foreground mb-3 uppercase tracking-wider"
              style={{ fontWeight: 600 }}
            >
              Planned Features
            </div>
            <div className="space-y-2">
              {meta.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Coming in Phase 2-3
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Intelligence Overlay ready
          </span>
        </div>
      </div>
    </div>
  );
}
