import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { NotionConnector } from "../../productivity/notion";
import { GoogleDriveConnector } from "../../productivity/google-drive";

/**
 * Productivity Domain Master — catalog-driven (Notion, Google Drive, Dropbox, OneDrive, Airtable).
 */
export class ProductivityMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "productivity";
  readonly domainName = "Productivity & Workspace";

  readonly supportedProviders = getProvidersForDomain("productivity");

  async searchDocuments(query: string): Promise<any[]> {
    const results: any[] = [];
    if (this.isProviderReady("notion")) {
      try {
        const notion = this.getProvider<NotionConnector>("notion");
        const pages = await notion.search({ query });
        results.push(...(pages.results || []).map((p: any) => ({ ...p, source: "notion" })));
      } catch {
        /* skip */
      }
    }
    if (this.isProviderReady("google-drive")) {
      try {
        const drive = this.getProvider<GoogleDriveConnector>("google-drive");
        const files = await drive.searchFiles(query);
        results.push(...(files || []).map((f: any) => ({ ...f, source: "google-drive" })));
      } catch {
        /* skip */
      }
    }
    return results;
  }
}
