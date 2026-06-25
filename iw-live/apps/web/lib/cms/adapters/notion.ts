import { Client } from "@notionhq/client"
import type { BlogPost, ChangelogEntry, DocPage, CaseStudy } from "../types"

export class NotionAdapter {
  private client: Client | null = null
  private databases = {
    blog: process.env.NOTION_BLOG_DATABASE_ID || "",
    changelog: process.env.NOTION_CHANGELOG_DATABASE_ID || "",
    docs: process.env.NOTION_DOCS_DATABASE_ID || "",
    caseStudies: process.env.NOTION_CASE_STUDIES_DATABASE_ID || "",
  }

  constructor() {
    const notionToken = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY
    if (notionToken) {
      this.client = new Client({ auth: notionToken })
    }
  }

  private isConfigured(): boolean {
    return this.client !== null
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    if (!this.isConfigured() || !this.databases.blog) {
      console.warn("[v0] Notion not configured for blog posts")
      return []
    }

    try {
      const response = await this.client!.databases.query({
        database_id: this.databases.blog,
        filter: {
          property: "Status",
          status: { equals: "Published" },
        },
        sorts: [
          {
            property: "Published Date",
            direction: "descending",
          },
        ],
      })

      return response.results.map((page: any) => this.mapPageToBlogPost(page))
    } catch (error) {
      console.error("[v0] Error fetching blog posts from Notion:", error)
      return []
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (!this.isConfigured() || !this.databases.blog) return null

    try {
      const response = await this.client!.databases.query({
        database_id: this.databases.blog,
        filter: {
          and: [
            { property: "Slug", rich_text: { equals: slug } },
            { property: "Status", status: { equals: "Published" } },
          ],
        },
      })

      if (response.results.length === 0) return null

      const page = response.results[0]
      const blogPost = this.mapPageToBlogPost(page)

      // Fetch page content blocks
      const blocks = await this.client!.blocks.children.list({
        block_id: page.id,
      })

      blogPost.content = this.blocksToMarkdown(blocks.results)
      return blogPost
    } catch (error) {
      console.error("[v0] Error fetching blog post from Notion:", error)
      return null
    }
  }

  async getChangelogEntries(): Promise<ChangelogEntry[]> {
    if (!this.isConfigured() || !this.databases.changelog) {
      return []
    }

    try {
      const response = await this.client!.databases.query({
        database_id: this.databases.changelog,
        sorts: [{ property: "Date", direction: "descending" }],
      })

      return response.results.map((page: any) => this.mapPageToChangelog(page))
    } catch (error) {
      console.error("[v0] Error fetching changelog from Notion:", error)
      return []
    }
  }

  async getDocPages(): Promise<DocPage[]> {
    if (!this.isConfigured() || !this.databases.docs) {
      return []
    }

    try {
      const response = await this.client!.databases.query({
        database_id: this.databases.docs,
        filter: {
          property: "Published",
          checkbox: { equals: true },
        },
      })

      return response.results.map((page: any) => this.mapPageToDoc(page))
    } catch (error) {
      console.error("[v0] Error fetching docs from Notion:", error)
      return []
    }
  }

  async getCaseStudies(): Promise<CaseStudy[]> {
    if (!this.isConfigured() || !this.databases.caseStudies) {
      return []
    }

    try {
      const response = await this.client!.databases.query({
        database_id: this.databases.caseStudies,
        filter: {
          property: "Status",
          status: { equals: "Published" },
        },
      })

      return response.results.map((page: any) => this.mapPageToCaseStudy(page))
    } catch (error) {
      console.error("[v0] Error fetching case studies from Notion:", error)
      return []
    }
  }

  // Mapping helpers
  private mapPageToBlogPost(page: any): BlogPost {
    const props = page.properties
    const authorName = this.getRichText(props.Author) || "IntegrateWise Team"
    return {
      id: page.id,
      title: this.getRichText(props.Title || props.Name),
      slug: this.getRichText(props.Slug),
      excerpt: this.getRichText(props.Excerpt),
      content: "",
      author: {
        name: authorName,
        avatar: props.AuthorAvatar?.files?.[0]?.file?.url,
      },
      publishedAt: props["Published Date"]?.date?.start || new Date().toISOString(),
      category: props.Category?.select?.name || "General",
      tags: props.Tags?.multi_select?.map((t: any) => t.name) || [],
      readTime: props["Read Time"]?.number || 5,
    }
  }

  private mapPageToChangelog(page: any): ChangelogEntry {
    const props = page.properties
    return {
      id: page.id,
      version: this.getRichText(props.Version),
      date: props.Date?.date?.start || new Date().toISOString(),
      title: this.getRichText(props.Title || props.Name),
      description: this.getRichText(props.Description),
      changes: [],
    }
  }

  private mapPageToDoc(page: any): DocPage {
    const props = page.properties
    return {
      id: page.id,
      title: this.getRichText(props.Title || props.Name),
      slug: this.getRichText(props.Slug),
      content: "",
      category: props.Category?.select?.name || "Guide",
      order: props.Order?.number || 0,
      lastUpdated: props["Last Updated"]?.last_edited_time || new Date().toISOString(),
    }
  }

  private mapPageToCaseStudy(page: any): CaseStudy {
    const props = page.properties
    return {
      id: page.id,
      title: this.getRichText(props.Title || props.Name),
      slug: this.getRichText(props.Slug),
      status: "published" as const,
      hub: "content" as const,
      clientName: this.getRichText(props.Company) || "Client",
      summary: this.getRichText(props.Challenge) || "",
      body: this.getRichText(props.Solution) || "",
      impactMetrics: {},
      coverAssetId: props.Logo?.files?.[0]?.file?.url,
      publishedAt: props["Published Date"]?.date?.start || new Date().toISOString(),
      relatedItemIds: [],
    }
  }

  private getRichText(richText: any): string {
    if (!richText?.rich_text) return ""
    return richText.rich_text.map((t: any) => t.plain_text).join("")
  }

  private blocksToMarkdown(blocks: any[]): string {
    return blocks
      .map((block) => {
        switch (block.type) {
          case "paragraph":
            return this.getRichText(block.paragraph)
          case "heading_1":
            return `# ${this.getRichText(block.heading_1)}`
          case "heading_2":
            return `## ${this.getRichText(block.heading_2)}`
          case "heading_3":
            return `### ${this.getRichText(block.heading_3)}`
          case "bulleted_list_item":
            return `- ${this.getRichText(block.bulleted_list_item)}`
          case "code":
            return `\`\`\`${block.code.language}\n${this.getRichText(block.code)}\n\`\`\``
          default:
            return ""
        }
      })
      .join("\n\n")
  }
}

export const notion = new NotionAdapter()
