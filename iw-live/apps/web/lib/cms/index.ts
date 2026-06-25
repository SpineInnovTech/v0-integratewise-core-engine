import { sanity } from "./adapters/sanity"
import { notion } from "./adapters/notion"
import type {
  CMSProvider,
  BlogPost,
  ChangelogEntry,
  DocPage,
  CaseStudy,
  Article,
  Campaign,
  Page,
  Template,
  Media,
  HubType,
  ContentStatus,
} from "./types"

class CMSClient {
  private provider: CMSProvider

  constructor() {
    const notionToken = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY
    const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID

    if (notionToken) {
      this.provider = "notion"
    } else if (sanityProjectId) {
      this.provider = "sanity"
    } else {
      this.provider = "sanity"
    }
  }

  setProvider(provider: CMSProvider) {
    this.provider = provider
  }

  getProvider(): CMSProvider {
    return this.provider
  }

  private getAdapter() {
    return this.provider === "sanity" ? sanity : notion
  }

  // Legacy methods for backwards compatibility
  async getBlogPosts(): Promise<BlogPost[]> {
    return this.getAdapter().getBlogPosts()
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    return this.getAdapter().getBlogPostBySlug(slug)
  }

  async getChangelogEntries(): Promise<ChangelogEntry[]> {
    return this.getAdapter().getChangelogEntries()
  }

  async getDocPages(): Promise<DocPage[]> {
    return this.getAdapter().getDocPages()
  }

  async getCaseStudies(): Promise<CaseStudy[]> {
    return this.getAdapter().getCaseStudies()
  }

  // SSOT v3.2 Methods
  async getArticles(options?: { hub?: HubType; status?: ContentStatus }): Promise<Article[]> {
    const adapter = this.getAdapter()
    if ("getArticles" in adapter) {
      return (adapter as any).getArticles(options)
    }
    // Fallback: convert BlogPosts to Articles
    const posts = await this.getBlogPosts()
    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: "published" as ContentStatus,
      hub: "content" as HubType,
      summary: p.excerpt,
      body: p.content,
      authors: [{ id: "1", name: p.author.name, avatar: p.author.avatar }],
      tags: p.tags,
      coverAssetId: p.coverImagePublicId,
      publishedAt: p.publishedAt,
      relatedItemIds: [],
      readTime: p.readTime,
    }))
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const adapter = this.getAdapter()
    if ("getArticleBySlug" in adapter) {
      return (adapter as any).getArticleBySlug(slug)
    }
    const post = await this.getBlogPostBySlug(slug)
    if (!post) return null
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: "published" as ContentStatus,
      hub: "content" as HubType,
      summary: post.excerpt,
      body: post.content,
      authors: [{ id: "1", name: post.author.name, avatar: post.author.avatar }],
      tags: post.tags,
      coverAssetId: post.coverImagePublicId,
      publishedAt: post.publishedAt,
      relatedItemIds: [],
      readTime: post.readTime,
    }
  }

  async getCampaigns(options?: { status?: ContentStatus }): Promise<Campaign[]> {
    const adapter = this.getAdapter()
    if ("getCampaigns" in adapter) {
      return (adapter as any).getCampaigns(options)
    }
    return []
  }

  async getPages(options?: { status?: ContentStatus }): Promise<Page[]> {
    const adapter = this.getAdapter()
    if ("getPages" in adapter) {
      return (adapter as any).getPages(options)
    }
    return []
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    const adapter = this.getAdapter()
    if ("getPageBySlug" in adapter) {
      return (adapter as any).getPageBySlug(slug)
    }
    return null
  }

  async getTemplates(options?: { type?: string }): Promise<Template[]> {
    const adapter = this.getAdapter()
    if ("getTemplates" in adapter) {
      return (adapter as any).getTemplates(options)
    }
    return []
  }

  async getMedia(options?: { folder?: string; hub?: HubType }): Promise<Media[]> {
    const adapter = this.getAdapter()
    if ("getMedia" in adapter) {
      return (adapter as any).getMedia(options)
    }
    return []
  }

  // Write methods
  async createArticle(data: Partial<Article>): Promise<Article> {
    const adapter = this.getAdapter()
    if ("createArticle" in adapter) {
      return (adapter as any).createArticle(data)
    }
    throw new Error("Create article not supported by current provider")
  }

  async updateArticle(id: string, data: Partial<Article>): Promise<Article> {
    const adapter = this.getAdapter()
    if ("updateArticle" in adapter) {
      return (adapter as any).updateArticle(id, data)
    }
    throw new Error("Update article not supported by current provider")
  }

  async createPage(data: Partial<Page>): Promise<Page> {
    const adapter = this.getAdapter()
    if ("createPage" in adapter) {
      return (adapter as any).createPage(data)
    }
    throw new Error("Create page not supported by current provider")
  }

  async updatePage(id: string, data: Partial<Page>): Promise<Page> {
    const adapter = this.getAdapter()
    if ("updatePage" in adapter) {
      return (adapter as any).updatePage(id, data)
    }
    throw new Error("Update page not supported by current provider")
  }

  async createCampaign(data: Partial<Campaign>): Promise<Campaign> {
    const adapter = this.getAdapter()
    if ("createCampaign" in adapter) {
      return (adapter as any).createCampaign(data)
    }
    throw new Error("Create campaign not supported by current provider")
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const adapter = this.getAdapter()
    if ("updateCampaign" in adapter) {
      return (adapter as any).updateCampaign(id, data)
    }
    throw new Error("Update campaign not supported by current provider")
  }
}

export const cms = new CMSClient()
export * from "./types"
