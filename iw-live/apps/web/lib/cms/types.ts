// CMS Content Types for IntegrateWise - SSOT v3.2 Aligned

export type HubType = "sales" | "marketing" | "operations" | "technology" | "customer-success" | "content" | "website"

export type ContentStatus = "draft" | "review" | "approved" | "published"

export type CMSProvider = "sanity" | "notion"

export interface Media {
  id: string
  publicId: string // Cloudinary public ID: {hub}/{type}/{slug}-{YYYYMMDD}-{hash8}
  folder: string // integratewise/{hub}/{type}/
  type: "image" | "video" | "file"
  status: ContentStatus
  altText: string // Required for accessibility
  license: string // Required for compliance
  credit?: string
  focalPoint?: { x: number; y: number }
  width?: number
  height?: number
  bytes?: number
  createdAt: string
}

export interface Article {
  id: string
  title: string
  slug: string
  status: ContentStatus
  hub: HubType
  summary: string
  body: string
  authors: Author[]
  tags: string[]
  coverAssetId?: string // References Media.id
  publishedAt?: string
  relatedItemIds?: string[]
  seoTitle?: string
  seoDescription?: string
  readTime?: number
}

export interface Author {
  id: string
  name: string
  avatar?: string
  role?: string
}

export interface CaseStudy {
  id: string
  title: string
  slug: string
  status: ContentStatus
  hub: HubType
  clientName: string
  summary: string
  body: string
  impactMetrics: Record<string, string>
  coverAssetId?: string
  publishedAt?: string
  relatedItemIds: string[]
  seoTitle?: string
  seoDescription?: string
}

export interface Campaign {
  id: string
  title: string
  slug: string
  status: ContentStatus
  hub: "marketing"
  objective: string
  startDate: string
  endDate?: string
  channels: string[]
  assets: string[] // Media IDs
  kpis: {
    views?: number
    clicks?: number
    leads?: number
    revenue?: number
  }
  relatedItemIds: string[]
}

export interface Page {
  id: string
  title: string
  slug: string
  status: ContentStatus
  hub: "website"
  templateId?: string
  sections: PageSection[]
  publishedAt?: string
  seoTitle?: string
  seoDescription?: string
  socialImageAssetId?: string
}

export interface PageSection {
  id: string
  type: "hero" | "features" | "testimonials" | "cta" | "content" | "gallery" | "pricing" | "faq"
  data: Record<string, unknown>
  order: number
}

export interface Template {
  id: string
  name: string
  type: "deck" | "email" | "report" | "SOP" | "proposal" | "plan" | "page"
  version: string
  schemaRef?: string
  approvalRules: ApprovalRule[]
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface ApprovalRule {
  role: string
  required: boolean
  order: number
}

export interface RenderRun {
  id: string
  templateId: string
  templateVersion: string
  dataSnapshotHash: string
  helperId?: string
  outputUri: string
  status: "pending" | "completed" | "failed"
  approvedBy?: string
  approvedAt?: string
  createdAt: string
}

export interface ChangelogEntry {
  id: string
  version: string
  date: string
  title: string
  description: string
  changes: {
    type: "feature" | "improvement" | "fix" | "breaking"
    description: string
  }[]
  highlights?: string[]
}

export interface DocPage {
  id: string
  title: string
  slug: string
  content: string
  category: string
  order: number
  lastUpdated: string
  tableOfContents?: {
    title: string
    level: number
    id: string
  }[]
}

// Legacy BlogPost type for backwards compatibility
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: {
    name: string
    avatar?: string
  }
  publishedAt: string
  category: string
  tags: string[]
  coverImage?: string
  coverImagePublicId?: string
  readTime?: number
}
