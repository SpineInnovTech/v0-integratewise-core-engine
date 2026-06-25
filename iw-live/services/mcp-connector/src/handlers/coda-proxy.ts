/**
 * Coda Proxy Handler — serves Coda page content to the ops dashboard
 *
 * Route: POST /coda/page
 * Body: { doc_id: string, page_id: string }
 * Auth: X-Hermes-Key header (same API key as Hermes Runner)
 *
 * This proxy keeps the CODA_API_TOKEN server-side (CF secret) and avoids
 * CORS issues from browser → Coda API direct calls.
 *
 * READ-ONLY. Only the Triage Agent cron writes to Coda.
 */

import type { Context } from "hono";

interface CodaProxyBindings {
  CODA_API_TOKEN: string;
  MCP_CONNECTOR_API_KEY?: string;
  ENVIRONMENT: string;
}

interface CodaPageRequest {
  doc_id: string;
  page_id: string;
}

const CODA_BASE = "https://coda.io/apis/v1";

export async function codaPageHandler(c: Context<{ Bindings: CodaProxyBindings }>) {
  // Auth — same key as Hermes Runner
  const apiKey = c.req.header("x-hermes-key") || c.req.header("x-api-key");
  if (!apiKey || apiKey !== c.env.MCP_CONNECTOR_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!c.env.CODA_API_TOKEN) {
    return c.json({ error: "Coda token not configured" }, 503);
  }

  let body: CodaPageRequest;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { doc_id, page_id } = body;
  if (!doc_id || !page_id) {
    return c.json({ error: "doc_id and page_id required" }, 400);
  }

  try {
    // Fetch page metadata
    const pageRes = await fetch(`${CODA_BASE}/docs/${doc_id}/pages/${page_id}`, {
      headers: { Authorization: `Bearer ${c.env.CODA_API_TOKEN}` },
    });

    if (!pageRes.ok) {
      return c.json({ error: `Coda API error: ${pageRes.status}` }, pageRes.status as any);
    }

    const pageData: any = await pageRes.json();

    // Fetch page content (export as markdown)
    const contentRes = await fetch(`${CODA_BASE}/docs/${doc_id}/pages/${page_id}/export`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.CODA_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ outputFormat: "markdown" }),
    });

    let content = "";
    if (contentRes.ok) {
      const exportData: any = await contentRes.json();
      // Coda export is async — if requestId is returned, poll for it
      if (exportData.requestId) {
        // Poll up to 5s for the export
        for (let i = 0; i < 5; i++) {
          await new Promise((r) => setTimeout(r, 1000));
          const statusRes = await fetch(
            `${CODA_BASE}/docs/${doc_id}/pages/${page_id}/export/${exportData.requestId}`,
            { headers: { Authorization: `Bearer ${c.env.CODA_API_TOKEN}` } }
          );
          if (statusRes.ok) {
            const statusData: any = await statusRes.json();
            if (statusData.status === "complete" && statusData.downloadLink) {
              const downloadRes = await fetch(statusData.downloadLink);
              content = await downloadRes.text();
              break;
            }
          }
        }
      } else if (exportData.content) {
        content = exportData.content;
      }
    }

    return c.json({
      id: pageData.id,
      name: pageData.name,
      subtitle: pageData.subtitle,
      updatedAt: pageData.updatedAt,
      browserLink: pageData.browserLink,
      content,
    });
  } catch (err: any) {
    return c.json({ error: err.message ?? "Unknown error" }, 500);
  }
}
