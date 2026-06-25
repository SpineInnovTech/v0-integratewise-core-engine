/**
 * Webflow Site Enhancement Script
 * Creates/enhances CMS collections and content based on V0_LANDING_SITE_PROMPT.md
 */

import { createWebflowClient } from "../src/lib/webflow-client";

interface SiteEnhancementPlan {
  siteId: string;
  collections: CollectionPlan[];
  pages: PagePlan[];
}

interface CollectionPlan {
  name: string;
  slug: string;
  fields: FieldPlan[];
  description: string;
}

interface FieldPlan {
  name: string;
  slug: string;
  type: string;
  required?: boolean;
}

interface PagePlan {
  name: string;
  slug: string;
  sections: string[];
}

// Define required CMS collections
const REQUIRED_COLLECTIONS: CollectionPlan[] = [
  {
    name: "Blog Posts",
    slug: "blog-posts",
    description: "Blog articles and insights",
    fields: [
      { name: "Title", slug: "title", type: "PlainText", required: true },
      { name: "Slug", slug: "slug", type: "PlainText", required: true },
      { name: "Excerpt", slug: "excerpt", type: "PlainText" },
      { name: "Content", slug: "content", type: "RichText" },
      { name: "Author", slug: "author", type: "PlainText" },
      { name: "Published Date", slug: "published-date", type: "Date" },
      { name: "Featured Image", slug: "featured-image", type: "ImageRef" },
      { name: "Engine Stage", slug: "engine-stage", type: "Option" },
      { name: "Hat", slug: "hat", type: "Option" },
      { name: "Industry", slug: "industry", type: "Option" },
    ],
  },
  {
    name: "Case Studies",
    slug: "case-studies",
    description: "Customer success stories",
    fields: [
      { name: "Title", slug: "title", type: "PlainText", required: true },
      { name: "Slug", slug: "slug", type: "PlainText", required: true },
      { name: "Company", slug: "company", type: "PlainText" },
      { name: "Industry", slug: "industry", type: "Option" },
      { name: "Pain", slug: "pain", type: "PlainText" },
      { name: "Outcome", slug: "outcome", type: "PlainText" },
      { name: "Engine Stages", slug: "engine-stages", type: "Option" },
      { name: "Hat", slug: "hat", type: "Option" },
      { name: "Stats", slug: "stats", type: "RichText" },
      { name: "Testimonial", slug: "testimonial", type: "RichText" },
      { name: "Featured Image", slug: "featured-image", type: "ImageRef" },
    ],
  },
  {
    name: "Testimonials",
    slug: "testimonials",
    description: "Customer testimonials",
    fields: [
      { name: "Quote", slug: "quote", type: "RichText", required: true },
      { name: "Author", slug: "author", type: "PlainText" },
      { name: "Role", slug: "role", type: "PlainText" },
      { name: "Company", slug: "company", type: "PlainText" },
      { name: "Hat", slug: "hat", type: "Option" },
      { name: "Engine Stage", slug: "engine-stage", type: "Option" },
      { name: "Avatar", slug: "avatar", type: "ImageRef" },
    ],
  },
  {
    name: "Team Members",
    slug: "team-members",
    description: "Team member profiles",
    fields: [
      { name: "Name", slug: "name", type: "PlainText", required: true },
      { name: "Role", slug: "role", type: "PlainText" },
      { name: "Bio", slug: "bio", type: "RichText" },
      { name: "Photo", slug: "photo", type: "ImageRef" },
      { name: "LinkedIn", slug: "linkedin", type: "Link" },
      { name: "Twitter", slug: "twitter", type: "Link" },
    ],
  },
];

// Define required pages structure
const REQUIRED_PAGES: PagePlan[] = [
  {
    name: "Home",
    slug: "",
    sections: ["Hero", "Features", "How It Works", "Stats", "Testimonials", "CTA", "FAQ"],
  },
  {
    name: "How It Works",
    slug: "how-it-works",
    sections: ["Hero", "Engine Stages Overview", "Feature Sections", "Stats", "CTA"],
  },
  {
    name: "Engine Stages - Load",
    slug: "engine-stages/load",
    sections: ["Hero", "Feature", "Benefits", "Stats", "CTA"],
  },
  {
    name: "Engine Stages - Normalize",
    slug: "engine-stages/normalize",
    sections: ["Hero", "Feature", "Benefits", "Stats", "CTA"],
  },
  {
    name: "Engine Stages - Think",
    slug: "engine-stages/think",
    sections: ["Hero", "Feature", "Benefits", "Stats", "CTA"],
  },
  {
    name: "Engine Stages - Act",
    slug: "engine-stages/act",
    sections: ["Hero", "Feature", "Benefits", "Stats", "CTA"],
  },
  {
    name: "Engine Stages - Govern",
    slug: "engine-stages/govern",
    sections: ["Hero", "Feature", "Benefits", "Stats", "CTA"],
  },
  {
    name: "Engine Stages - Repeat",
    slug: "engine-stages/repeat",
    sections: ["Hero", "Feature", "Benefits", "Stats", "CTA"],
  },
  {
    name: "Roles Overview",
    slug: "roles",
    sections: ["Hero", "Hats Overview", "Feature Sections", "CTA"],
  },
  { name: "Visionary", slug: "roles/visionary", sections: ["Hero", "Features", "Benefits", "CTA"] },
  {
    name: "Missionary",
    slug: "roles/missionary",
    sections: ["Hero", "Features", "Benefits", "CTA"],
  },
  {
    name: "Practitioner",
    slug: "roles/practitioner",
    sections: ["Hero", "Features", "Benefits", "CTA"],
  },
  { name: "Passenger", slug: "roles/passenger", sections: ["Hero", "Features", "Benefits", "CTA"] },
  { name: "Use Cases", slug: "use-cases", sections: ["Hero", "Features", "Benefits", "CTA"] },
  {
    name: "Architecture",
    slug: "architecture",
    sections: ["Hero", "How It Works", "Features", "Stats", "CTA"],
  },
  {
    name: "Security",
    slug: "security",
    sections: ["Hero", "Features", "Stats", "Testimonials", "CTA", "FAQ"],
  },
  {
    name: "Integrations",
    slug: "integrations",
    sections: ["Hero", "Integrations Grid", "Features", "CTA", "FAQ"],
  },
  { name: "Case Studies", slug: "case-studies", sections: ["Hero", "Case Study Grid", "CTA"] },
  {
    name: "Pricing",
    slug: "pricing",
    sections: ["Hero", "Pricing Table", "Comparison", "Stats", "CTA", "FAQ"],
  },
  { name: "Blog", slug: "blog", sections: ["Hero", "Blog List", "Filters"] },
  { name: "Contact", slug: "contact", sections: ["Hero", "Contact Form", "Features", "FAQ"] },
  { name: "About", slug: "about", sections: ["Hero", "About Section", "Timeline", "Team", "CTA"] },
];

// Practitioner domain pages (13 pages)
const PRACTITIONER_DOMAINS = [
  "research",
  "development",
  "marketing",
  "sales",
  "finance",
  "strategy",
  "customer-success",
  "employee-relations",
  "freelancers",
  "institutions",
  "educators",
  "management",
  "students",
];

PRACTITIONER_DOMAINS.forEach((domain) => {
  REQUIRED_PAGES.push({
    name: `Practitioner - ${domain}`,
    slug: `practitioners/${domain}`,
    sections: [
      "Hero",
      "Features",
      "Benefits",
      "How It Works",
      "Stats",
      "Testimonials",
      "CTA",
      "FAQ",
    ],
  });
});

async function enhanceWebflowSite(siteId: string) {
  const apiKey = process.env.WEBFLOW_API_KEY;

  if (!apiKey) {
    console.error("❌ WEBFLOW_API_KEY environment variable not set");
    process.exit(1);
  }

  const client = createWebflowClient(apiKey);

  console.log(`🚀 Enhancing Webflow Site: ${siteId}\n`);

  try {
    // Get existing collections
    const existingCollections = await client.getCollections(siteId);
    const existingCollectionSlugs = existingCollections.map((c) => c.slug);

    console.log("📚 Checking CMS Collections...\n");

    // Check which collections need to be created
    for (const collectionPlan of REQUIRED_COLLECTIONS) {
      if (existingCollectionSlugs.includes(collectionPlan.slug)) {
        console.log(`✅ Collection "${collectionPlan.name}" already exists`);
        const existing = existingCollections.find((c) => c.slug === collectionPlan.slug);
        if (existing) {
          console.log(`   Fields: ${existing.fields.length}`);
        }
      } else {
        console.log(`⚠️  Collection "${collectionPlan.name}" needs to be created`);
        console.log(`   Note: Collections must be created manually in Webflow Designer`);
        console.log(`   Required fields: ${collectionPlan.fields.map((f) => f.name).join(", ")}\n`);
      }
    }

    console.log("\n📄 Page Structure Analysis:\n");
    console.log(`✅ Required Pages: ${REQUIRED_PAGES.length}`);
    console.log(`   - Core Pages: 22`);
    console.log(`   - Practitioner Pages: 13`);
    console.log(`   - Total: 35 pages + Home = 36 pages\n`);

    console.log("📋 Page Checklist:");
    REQUIRED_PAGES.forEach((page, index) => {
      console.log(
        `   ${(index + 1).toString().padStart(2, " ")}. ${page.name.padEnd(35)} /${page.slug || ""}`
      );
    });

    console.log("\n💡 Enhancement Recommendations:\n");
    console.log("1. CMS Collections:");
    console.log("   - Create missing collections in Webflow Designer");
    console.log("   - Set up proper field types and relationships");
    console.log("   - Configure collection settings (SEO, etc.)\n");

    console.log("2. Pages:");
    console.log("   - Ensure all 36 pages exist");
    console.log("   - Set up proper navigation structure");
    console.log("   - Configure SEO metadata for each page");
    console.log("   - Add proper URL slugs\n");

    console.log("3. Content:");
    console.log("   - Populate CMS collections with initial content");
    console.log("   - Add testimonials, case studies, blog posts");
    console.log("   - Set up form handlers for contact/demo forms\n");

    console.log("4. Design System:");
    console.log("   - Apply brand colors (#0066FF → #0044CC)");
    console.log("   - Use Inter font family");
    console.log("   - Ensure responsive design (mobile-first)");
    console.log("   - Add proper animations (Framer Motion equivalent)\n");

    console.log("5. Components:");
    console.log("   - Create reusable components:");
    console.log("     • Navbar (sticky)");
    console.log("     • HeroSection");
    console.log("     • FeatureSection");
    console.log("     • FeaturesListSection");
    console.log("     • HowItWorksSection");
    console.log("     • BenefitsSection");
    console.log("     • StatsSection");
    console.log("     • TestimonialSection");
    console.log("     • CTASection");
    console.log("     • GallerySection");
    console.log("     • FAQSection");
    console.log("     • LogoListSection");
    console.log("     • Footer\n");

    // Generate enhancement report
    const report = {
      siteId,
      timestamp: new Date().toISOString(),
      existingCollections: existingCollections.length,
      requiredCollections: REQUIRED_COLLECTIONS.length,
      requiredPages: REQUIRED_PAGES.length,
      recommendations: [
        "Create missing CMS collections",
        "Ensure all 36 pages exist",
        "Set up navigation structure",
        "Populate CMS with content",
        "Apply design system",
        "Create reusable components",
      ],
    };

    console.log("📊 Enhancement Report Generated");
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    console.error("❌ Error enhancing site:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

// Get site ID from command line or use first site
const siteId = process.argv[2];

if (!siteId) {
  console.log("Usage: tsx webflow-enhance-site.ts <site-id>");
  console.log("\nTo get site ID, run: tsx webflow-site-audit.ts");
  process.exit(1);
}

enhanceWebflowSite(siteId).catch(console.error);
