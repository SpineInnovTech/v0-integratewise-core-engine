/**
 * Webflow Content Generator
 * Generates initial content for CMS collections based on V0_LANDING_SITE_PROMPT.md
 */

import { createWebflowClient } from "../src/lib/webflow-client";

// Sample testimonials based on the spec
const SAMPLE_TESTIMONIALS = [
  {
    quote: "Before: 4 hours reconciling spreadsheets. After: Done in minutes.",
    author: "RevOps Leader",
    role: "SaaS Company",
    hat: "Practitioner",
    engineStage: "Normalize",
  },
  {
    quote: "I stopped chasing my team for numbers. Now I see what matters.",
    author: "Founder",
    role: "Tech Startup",
    hat: "Visionary",
    engineStage: "Think",
  },
  {
    quote: "As a CS leader, I finally trust our data.",
    author: "CS Leader",
    role: "SaaS Company",
    hat: "Practitioner",
    engineStage: "Normalize",
  },
  {
    quote: "As a founder, I see where we're winning and losing, instantly.",
    author: "Founder",
    role: "Tech Startup",
    hat: "Visionary",
    engineStage: "Think",
  },
  {
    quote:
      "We used to spend Friday mornings prepping data for meetings. Now it's all there, live, every day.",
    author: "Operations Manager",
    role: "SaaS Company",
    hat: "Missionary",
    engineStage: "Load",
  },
  {
    quote:
      "Before IntegrateWise: hours lost copying notes, missing follow-ups, arguing over numbers. After: everything just works, our team trusts the data, and we close faster.",
    author: "Sales Leader",
    role: "SaaS Company",
    hat: "Practitioner",
    engineStage: "Act",
  },
];

// Sample case studies
const SAMPLE_CASE_STUDIES = [
  {
    title: "SaaS RevOps: 12 Hours/Week Saved",
    company: "SaaS Company",
    industry: "Technology",
    pain: "Manual data entry across 5 tools",
    outcome: "80% less manual work",
    engineStages: ["Load", "Normalize"],
    hat: "Missionary",
    stats: "12+ hours/week saved, 27% less tool bloat",
    testimonial: "Before: chaos. After: clarity.",
  },
  {
    title: "University Admin: Weeks to Hours",
    company: "University",
    industry: "Education",
    pain: "Reporting delays costing funding",
    outcome: "Same-day compliance reports",
    engineStages: ["Normalize", "Govern"],
    hat: "Practitioner",
    stats: "Reporting time reduced from weeks to hours",
    testimonial: 'University admin: "We cut reporting time from weeks to hours."',
  },
];

// Sample blog posts
const SAMPLE_BLOG_POSTS = [
  {
    title: "How to Eliminate Double Data Entry",
    excerpt: "Stop copying data between tools. Learn how One Click Loader automates data imports.",
    engineStage: "Load",
    hat: "Practitioner",
    industry: "General",
  },
  {
    title: "Building a True Source of Truth",
    excerpt: "How the Spine creates a single schema that everyone trusts.",
    engineStage: "Normalize",
    hat: "Missionary",
    industry: "General",
  },
  {
    title: "Automation That Actually Sticks",
    excerpt: "Why Cognitive Twin automations don't break when your data changes.",
    engineStage: "Act",
    hat: "Missionary",
    industry: "General",
  },
];

async function populateWebflowContent(
  siteId: string,
  collectionId: string,
  collectionType: "testimonials" | "case-studies" | "blog-posts"
) {
  const apiKey = process.env.WEBFLOW_API_KEY;

  if (!apiKey) {
    console.error("❌ WEBFLOW_API_KEY environment variable not set");
    process.exit(1);
  }

  const client = createWebflowClient(apiKey);

  console.log(`📝 Populating ${collectionType} collection...\n`);

  try {
    let items: any[] = [];
    let fieldMapping: Record<string, string> = {};

    // Get collection to understand field structure
    const collection = await client.getCollection(siteId, collectionId);
    console.log(`✅ Found collection: ${collection.displayName}`);
    console.log(`   Fields: ${collection.fields.map((f) => `${f.slug} (${f.type})`).join(", ")}\n`);

    // Map fields based on collection type
    if (collectionType === "testimonials") {
      items = SAMPLE_TESTIMONIALS;
      fieldMapping = {
        quote: "quote",
        author: "author",
        role: "role",
        company: "company",
        hat: "hat",
        engineStage: "engine-stage",
      };
    } else if (collectionType === "case-studies") {
      items = SAMPLE_CASE_STUDIES;
      fieldMapping = {
        title: "title",
        company: "company",
        industry: "industry",
        pain: "pain",
        outcome: "outcome",
        engineStages: "engine-stages",
        hat: "hat",
        stats: "stats",
        testimonial: "testimonial",
      };
    } else if (collectionType === "blog-posts") {
      items = SAMPLE_BLOG_POSTS;
      fieldMapping = {
        title: "title",
        excerpt: "excerpt",
        engineStage: "engine-stage",
        hat: "hat",
        industry: "industry",
      };
    }

    // Create items
    for (const item of items) {
      const fieldData: Record<string, any> = {};

      // Map item data to Webflow field structure
      for (const [itemKey, fieldSlug] of Object.entries(fieldMapping)) {
        const value = item[itemKey as keyof typeof item];
        if (value !== undefined) {
          // Handle special cases
          if (fieldSlug === "slug" && itemKey === "title") {
            fieldData[fieldSlug] = (value as string)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
          } else if (fieldSlug === "published-date" && collectionType === "blog-posts") {
            fieldData[fieldSlug] = new Date().toISOString();
          } else {
            fieldData[fieldSlug] = value;
          }
        }
      }

      try {
        const created = await client.createCollectionItem(siteId, collectionId, fieldData, false);
        console.log(`✅ Created: ${item.title || item.quote?.substring(0, 50) || "Item"}`);
      } catch (error) {
        console.error(`❌ Failed to create item:`, error);
        if (error instanceof Error) {
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Completed populating ${collectionType}`);
    console.log(`   Created ${items.length} items`);
  } catch (error) {
    console.error("❌ Error populating content:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

// CLI usage
const [siteId, collectionId, collectionType] = process.argv.slice(2);

if (!siteId || !collectionId || !collectionType) {
  console.log(
    "Usage: tsx webflow-content-generator.ts <site-id> <collection-id> <collection-type>"
  );
  console.log("\nCollection types:");
  console.log("  - testimonials");
  console.log("  - case-studies");
  console.log("  - blog-posts");
  console.log("\nTo get IDs, run: pnpm webflow:audit");
  process.exit(1);
}

if (!["testimonials", "case-studies", "blog-posts"].includes(collectionType)) {
  console.error("❌ Invalid collection type. Must be: testimonials, case-studies, or blog-posts");
  process.exit(1);
}

populateWebflowContent(siteId, collectionId, collectionType as any).catch(console.error);
