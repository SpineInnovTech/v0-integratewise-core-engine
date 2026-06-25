import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const routes = [
  "/",
  "/platform",
  "/features",
  "/workbench",
  "/solutions",
  "/twin",
  "/governance",
  "/architecture",
  "/pricing",
  "/about",
  "/case-study",
  "/integrations",
  "/resources",
  "/blog",
  "/faq",
  "/terms",
  "/privacy",
  "/request-access",
];

async function main() {
  const rootUrl = "https://google-analytics.integratewise-marketing.pages.dev";
  const screenshotDir = path.join(process.cwd(), "scratch", "screenshots");

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log(`Starting page verification for ${rootUrl}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const report = [];

  for (const route of routes) {
    const url = `${rootUrl}${route}`;
    const page = await context.newPage();

    const pageErrors = [];
    const consoleErrors = [];

    page.on("pageerror", (err) => {
      console.error(`[Page Error] [${route}]:`, err.message);
      pageErrors.push(err.message);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[Console Error] [${route}]:`, msg.text());
        consoleErrors.push(msg.text());
      }
    });

    try {
      console.log(`Navigating to ${route}...`);
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      const status = response ? response.status() : "No response";

      // Wait for React to mount - check if #root has children
      const isRendered = await page.evaluate(() => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      });

      const title = await page.title();

      // Take a screenshot
      const safeName = route === "/" ? "home" : route.replace(/\//g, "");
      const screenshotPath = path.join(screenshotDir, `${safeName}.png`);
      await page.screenshot({ path: screenshotPath });

      const hasError = pageErrors.length > 0 || consoleErrors.length > 0 || !isRendered;

      report.push({
        route,
        status,
        title,
        isRendered,
        pageErrors,
        consoleErrors,
        screenshot: screenshotPath,
        success: !hasError,
      });

      console.log(
        `Finished ${route}. Status: ${status}, Title: "${title}", Rendered: ${isRendered}, Success: ${!hasError}`
      );
    } catch (err) {
      console.error(`Failed to verify ${route}:`, err.message);
      report.push({
        route,
        status: "FAILED",
        title: "N/A",
        isRendered: false,
        pageErrors: [err.message],
        consoleErrors: [],
        screenshot: null,
        success: false,
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log("\n=================== VERIFICATION REPORT ===================");
  let allSuccess = true;
  for (const item of report) {
    const statusSymbol = item.success ? "✅" : "❌";
    console.log(`${statusSymbol} Route: ${item.route}`);
    console.log(`   Status: ${item.status}`);
    console.log(`   Title: "${item.title}"`);
    console.log(`   Rendered: ${item.isRendered ? "Yes" : "NO (Blank page!)"}`);
    if (item.pageErrors.length > 0) {
      console.log(`   Page Errors:`, item.pageErrors);
    }
    if (item.consoleErrors.length > 0) {
      console.log(`   Console Errors:`, item.consoleErrors);
    }
    if (!item.success) allSuccess = false;
  }
  console.log("===========================================================");

  if (allSuccess) {
    console.log("🎉 Success! All pages verified and rendered successfully with no errors.");
  } else {
    console.log("⚠️ Warning: Some pages encountered errors or failed to render.");
  }
}

main().catch(console.error);
