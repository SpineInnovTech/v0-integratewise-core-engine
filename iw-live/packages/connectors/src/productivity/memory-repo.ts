import * as fs from "node:fs";
import * as path from "node:path";
import {
  BaseConnector,
  ConnectorConfig,
  ConnectorError,
  ConnectorMetadata,
} from "@integratewise/connector-contracts";

export interface MemoryRepoConfig extends ConnectorConfig {
  vaultPath: string;
}

export interface MemoryDocument {
  id: string;
  path: string;
  category: string;
  topic: string;
  content: string;
  version: string;
  author: string;
  governanceState: string;
  lastModified: string;
  sizeBytes: number;
}

export class MemoryRepoConnector extends BaseConnector {
  protected override config: MemoryRepoConfig;

  constructor(config: MemoryRepoConfig) {
    super(config);
    this.config = config;
  }

  getMetadata(): ConnectorMetadata {
    return {
      id: "memory-repo",
      name: "Memory Repository",
      version: "1.0.0",
      apiVersion: "v1.0",
      capabilities: { sync: true, webhooks: false },
    };
  }

  /**
   * Test connection by validating the existence of the Memory Vault directory
   */
  async testConnection(): Promise<boolean> {
    try {
      const vaultPath = this.config.vaultPath || "/Users/nirmal/.iw-memory";
      return fs.existsSync(vaultPath) && fs.statSync(vaultPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Recursively scan the local filesystem vault and retrieve all memory documents
   */
  async scanVault(): Promise<MemoryDocument[]> {
    const vaultPath = this.config.vaultPath || "/Users/nirmal/.iw-memory";
    const documents: MemoryDocument[] = [];

    if (!fs.existsSync(vaultPath)) {
      throw new ConnectorError(`Vault path not found: ${vaultPath}`);
    }

    const scanDirectory = (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip git, system files and ignored directories
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }

        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (
          entry.isFile() &&
          entry.name.endsWith(".md") &&
          entry.name !== "README.md" &&
          entry.name !== "SEED_MANIFEST.md"
        ) {
          try {
            const stats = fs.statSync(fullPath);
            const content = fs.readFileSync(fullPath, "utf-8");

            // Resolve category based on relative path from vault root
            const relativePath = path.relative(vaultPath, fullPath);
            const relativeDir = path.dirname(relativePath);
            const category = relativeDir === "." ? "Uncategorized" : relativeDir;

            // Extract metadata from content or set defaults
            const topic = path.basename(entry.name, ".md");
            const version = this.parseMetadata(content, "version") || "1.0.0";
            const author = this.parseMetadata(content, "author") || "nirmal@integratewise.ai";
            const governanceState = this.parseMetadata(content, "governance_state") || "approved";

            documents.push({
              id: `mem-${Buffer.from(relativePath).toString("base64url")}`,
              path: fullPath,
              category,
              topic,
              content,
              version,
              author,
              governanceState,
              lastModified: stats.mtime.toISOString(),
              sizeBytes: stats.size,
            });
          } catch (err) {
            console.error(`[MemoryRepoConnector] Failed to parse document ${entry.name}:`, err);
          }
        }
      }
    };

    scanDirectory(vaultPath);
    return documents;
  }

  /**
   * Helper to parse simple markdown metadata headers (e.g. "> Version: 2.1.0")
   */
  private parseMetadata(content: string, key: string): string | null {
    const lines = content.split("\n").slice(0, 15); // Check first 15 lines
    const regex = new RegExp(`(?:^|>|\\*|-)\\s*${key}\\s*:\\s*(.+)`, "i");

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        return match[1].trim().replace(/^['"`]+|['"`]+$/g, "");
      }
    }
    return null;
  }
}

export function createMemoryRepoConnector(config: MemoryRepoConfig): MemoryRepoConnector {
  return new MemoryRepoConnector(config);
}
