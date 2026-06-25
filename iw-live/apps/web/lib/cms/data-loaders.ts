// Data loaders for CMS content - SSOT v3.2
import { cms } from "./index"
import type { Page, Article, CaseStudy, ContentStatus, HubType } from "./types"
import { unstable_cache } from "next/cache"

// Cache tags for revalidation
export const CACHE_TAGS = {
  pages: "pages",
  articles: "articles",
  caseStudies: "case-studies",
  changelog: "changelog",
  docs: "docs",
  media: "media",
} as const

// Revalidation intervals (seconds)
export const REVALIDATE = {
  static: 3600, // 1 hour for static pages
  dynamic: 60, // 1 minute for dynamic content
  realtime: 10, // 10 seconds for real-time updates
} as const

// Page loader with caching
export const getPageBySlug = unstable_cache(
  async (slug: string): Promise<Page | null> => {
    try {
      return await cms.getPageBySlug(slug)
    } catch (error) {
      console.error(`[CMS] Error loading page ${slug}:`, error)
      return null
    }
  },
  ["page-by-slug"],
  { tags: [CACHE_TAGS.pages], revalidate: REVALIDATE.dynamic },
)

// Collection loaders
export const getCollection = unstable_cache(
  async (
    type: "articles" | "caseStudies" | "changelog" | "docs" | "pages",
    filters?: { hub?: HubType; status?: ContentStatus; limit?: number },
  ): Promise<any[]> => {
    try {
      switch (type) {
        case "articles": {
          const articles = await cms.getArticles({ hub: filters?.hub, status: filters?.status || "published" })
          return filters?.limit ? articles.slice(0, filters.limit) : articles
        }
        case "caseStudies": {
          const caseStudies = await cms.getCaseStudies()
          return filters?.limit ? caseStudies.slice(0, filters.limit) : caseStudies
        }
        case "changelog": {
          const changelog = await cms.getChangelogEntries()
          return filters?.limit ? changelog.slice(0, filters.limit) : changelog
        }
        case "docs": {
          const docs = await cms.getDocPages()
          return filters?.limit ? docs.slice(0, filters.limit) : docs
        }
        case "pages": {
          const pages = await cms.getPages({ status: filters?.status || "published" })
          return filters?.limit ? pages.slice(0, filters.limit) : pages
        }
        default:
          return []
      }
    } catch (error) {
      console.error(`[CMS] Error loading collection ${type}:`, error)
      return []
    }
  },
  ["collection"],
  {
    tags: [CACHE_TAGS.articles, CACHE_TAGS.caseStudies, CACHE_TAGS.changelog, CACHE_TAGS.docs],
    revalidate: REVALIDATE.dynamic,
  },
)

// Article loader by slug
export const getArticleBySlug = unstable_cache(
  async (slug: string): Promise<Article | null> => {
    try {
      return await cms.getArticleBySlug(slug)
    } catch (error) {
      console.error(`[CMS] Error loading article ${slug}:`, error)
      return null
    }
  },
  ["article-by-slug"],
  { tags: [CACHE_TAGS.articles], revalidate: REVALIDATE.dynamic },
)

// Case study loader by slug
export const getCaseStudyBySlug = unstable_cache(
  async (slug: string): Promise<CaseStudy | null> => {
    try {
      const caseStudies = await cms.getCaseStudies()
      return caseStudies.find((cs) => cs.slug === slug) || null
    } catch (error) {
      console.error(`[CMS] Error loading case study ${slug}:`, error)
      return null
    }
  },
  ["case-study-by-slug"],
  { tags: [CACHE_TAGS.caseStudies], revalidate: REVALIDATE.dynamic },
)

// Media loader
export const getMediaById = unstable_cache(
  async (id: string) => {
    try {
      const media = await cms.getMedia()
      return media.find((m) => m.id === id) || null
    } catch (error) {
      console.error(`[CMS] Error loading media ${id}:`, error)
      return null
    }
  },
  ["media-by-id"],
  { tags: [CACHE_TAGS.media], revalidate: REVALIDATE.static },
)

// Static route config - SSOT v3.2 38-route map
export const STATIC_ROUTES = [
  "/",
  "/product",
  "/pricing",
  "/agents",
  "/integrations",
  "/docs",
  "/api",
  "/developers",
  "/strategic",
  "/metrics",
  "/sales",
  "/marketing",
  "/operations",
  "/technology",
  "/customer-success",
  "/content",
  "/website",
  "/brainstorming",
  "/clients",
  "/services",
  "/products",
  "/tasks",
  "/knowledge",
  "/data-sources",
  "/assistant",
  "/modes/workspace",
  "/modes/business-dashboard",
  "/modes/render-only",
  "/about",
  "/careers",
  "/contact",
  "/security",
  "/compliance",
  "/support",
  "/demo",
  "/case-studies",
  "/blog",
] as const

export const DYNAMIC_ROUTES = ["/case-studies/[slug]", "/blog/[slug]"] as const

// Generate static params for dynamic routes
export async function generateBlogStaticParams() {
  try {
    const articles = await cms.getArticles({ status: "published" })
    return articles.map((article) => ({ slug: article.slug }))
  } catch {
    return []
  }
}

export async function generateCaseStudyStaticParams() {
  try {
    const caseStudies = await cms.getCaseStudies()
    return caseStudies.filter((cs) => cs.status === "published").map((cs) => ({ slug: cs.slug }))
  } catch {
    return []
  }
}
