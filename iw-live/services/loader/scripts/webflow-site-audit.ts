/**
 * Webflow Site Audit Script
 * Fetches current state of Webflow site and generates enhancement plan
 */

import { createWebflowClient } from "../src/lib/webflow-client";

async function auditWebflowSite() {
  const apiKey = process.env.WEBFLOW_API_KEY;

  if (!apiKey) {
    console.error("❌ WEBFLOW_API_KEY environment variable not set");
    console.log("Set it with: export WEBFLOW_API_KEY=your-api-key");
    process.exit(1);
  }

  const client = createWebflowClient(apiKey);

  console.log("🔍 Auditing Webflow Site...\n");

  try {
    // Get all sites
    console.log("📡 Fetching sites...");
    const sites = await client.getSites();

    if (sites.length === 0) {
      console.log("⚠️  No sites found in this account");
      return;
    }

    console.log(`✅ Found ${sites.length} site(s)\n`);

    // Audit each site
    for (const site of sites) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🏢 Site: ${site.displayName} (${site.shortName})`);
      console.log(`   ID: ${site.id}`);
      console.log(`   Last Published: ${site.lastPublished || "Never"}`);
      console.log(`   Preview URL: ${site.previewUrl || "N/A"}`);
      console.log(`${"=".repeat(60)}\n`);

      // Get collections
      console.log("📚 Fetching collections...");
      const collections = await client.getCollections(site.id);
      console.log(`✅ Found ${collections.length} collection(s)`);

      collections.forEach((collection, index) => {
        console.log(`   ${index + 1}. ${collection.displayName} (${collection.slug})`);
        console.log(`      Fields: ${collection.fields.length}`);
      });

      // Get form submissions
      console.log("\n📝 Fetching form submissions...");
      try {
        const { submissions } = await client.getFormSubmissions(site.id);
        console.log(`✅ Found ${submissions.length} form submission(s)`);
      } catch (error) {
        console.log("⚠️  Could not fetch form submissions (may require site-specific permissions)");
      }

      // Generate enhancement report
      console.log("\n📊 Enhancement Analysis:");
      console.log(`   - Collections: ${collections.length}`);
      console.log(`   - Missing Collections: Check if needed for 36-page site`);
      console.log(`   - Site Status: ${site.lastPublished ? "Published" : "Unpublished"}`);
    }

    // Generate recommendations
    console.log("\n\n💡 Recommendations:");
    console.log("   1. Create CMS collections for:");
    console.log("      - Blog Posts");
    console.log("      - Case Studies");
    console.log("      - Team Members");
    console.log("      - Testimonials");
    console.log("      - Engine Stages");
    console.log("      - Practitioner Domains");
    console.log("   2. Ensure all 36 pages are created");
    console.log("   3. Set up proper navigation structure");
    console.log("   4. Configure SEO metadata for each page");
    console.log("   5. Set up form handlers for contact/demo forms");
  } catch (error) {
    console.error("❌ Error auditing site:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

// Run audit
auditWebflowSite().catch(console.error);
