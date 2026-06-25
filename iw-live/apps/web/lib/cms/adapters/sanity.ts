// Sanity CMS Adapter using MCP

import type { BlogPost, ChangelogEntry, DocPage, CaseStudy } from "../types"

export class SanityAdapter {
  // Using MCP Sanity integration - queries will be handled via MCP tools

  async getBlogPosts(): Promise<BlogPost[]> {
    // In production, this would use the Sanity MCP tools to query documents
    // For now, return mock data that matches the CMS structure
    return [
      {
        id: "1",
        title: "Why Effortless Work Is the Future of Productivity",
        slug: "why-effortless-work-is-the-future",
        excerpt:
          "Explore how IntegrateWise eliminates context switching and repetitive tasks through intelligent automation.",
        content: "# Why Effortless Work\n\nContent here...",
        author: { name: "IntegrateWise Team" },
        publishedAt: "2024-01-15",
        category: "Product",
        tags: ["productivity", "automation"],
        readTime: 8,
      },
    ]
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    const posts = await this.getBlogPosts()
    return posts.find((post) => post.slug === slug) || null
  }

  async getChangelogEntries(): Promise<ChangelogEntry[]> {
    return [
      {
        id: "1",
        version: "1.0.0",
        date: "2024-01-15",
        title: "IntegrateWise Launch",
        description: "Initial release of the IntegrateWise platform",
        changes: [
          { type: "feature", description: "OS Core with Hub and Spine architecture" },
          { type: "feature", description: "AI Loader with personality capture" },
          { type: "feature", description: "20+ integrations including Salesforce, Stripe, Slack" },
        ],
      },
    ]
  }

  async getDocPages(): Promise<DocPage[]> {
    return [
      {
        id: "1",
        title: "Getting Started",
        slug: "getting-started",
        content: "# Getting Started with IntegrateWise\n\nWelcome to IntegrateWise...",
        category: "Introduction",
        order: 1,
        lastUpdated: "2024-01-15",
      },
    ]
  }

  async getCaseStudies(): Promise<CaseStudy[]> {
    return []
  }
}

export const sanity = new SanityAdapter()
