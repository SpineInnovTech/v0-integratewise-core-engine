/**
 * Chunking Strategy & Configuration
 *
 * This module defines how documents are split into semantic chunks for
 * embedding and search. Follows best practices for RAG systems.
 */

// ============================================================================
// Types
// ============================================================================

export interface ChunkingConfig {
  chunkSize: number; // Target tokens per chunk
  chunkOverlap: number; // Overlap tokens between chunks
  minChunkSize: number; // Minimum chunk size
  maxChunkSize: number; // Maximum chunk size
  strategy: ChunkingStrategy;
  preserveHeaders: boolean;
  preserveLists: boolean;
  preserveCodeBlocks: boolean;
}

export type ChunkingStrategy = "fixed" | "sentence" | "paragraph" | "semantic";

export interface ChunkMetadata {
  chunkIndex: number;
  chunkType: ChunkType;
  charStart: number;
  charEnd: number;
  tokenCount: number;
  parentChunkId?: string;
  headers?: string[]; // Hierarchical headers
  sourceSection?: string; // Section name if applicable
}

export type ChunkType = "text" | "code" | "table" | "heading" | "list";

export interface Chunk {
  content: string;
  contentHash: string;
  metadata: ChunkMetadata;
}

export interface ChunkingResult {
  chunks: Chunk[];
  totalTokens: number;
  processingTimeMs: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_CONFIG: ChunkingConfig = {
  chunkSize: 512,
  chunkOverlap: 50,
  minChunkSize: 100,
  maxChunkSize: 1000,
  strategy: "semantic",
  preserveHeaders: true,
  preserveLists: true,
  preserveCodeBlocks: true,
};

export const CONFIG_BY_SOURCE: Record<string, Partial<ChunkingConfig>> = {
  session: {
    chunkSize: 256,
    chunkOverlap: 25,
    strategy: "paragraph",
  },
  file_md: {
    chunkSize: 512,
    chunkOverlap: 50,
    strategy: "semantic",
    preserveHeaders: true,
  },
  file_pdf: {
    chunkSize: 400,
    chunkOverlap: 40,
    strategy: "paragraph",
  },
  file_txt: {
    chunkSize: 512,
    chunkOverlap: 50,
    strategy: "sentence",
  },
  file_json: {
    chunkSize: 300,
    chunkOverlap: 20,
    strategy: "fixed",
    preserveCodeBlocks: true,
  },
};

// ============================================================================
// Token Estimation
// ============================================================================

/**
 * Estimate token count for text.
 * Uses simple heuristic: ~4 characters per token for English text.
 * For more accuracy, use tiktoken or similar.
 */
export function estimateTokenCount(text: string): number {
  // Simple estimation: ~4 chars per token on average
  // This is a rough approximation for OpenAI models
  return Math.ceil(text.length / 4);
}

/**
 * More accurate token estimation using word-based approach
 */
export function estimateTokenCountAccurate(text: string): number {
  // Split by whitespace and punctuation
  const words = text.split(/\s+/);
  const punctuation = (text.match(/[.,!?;:'"()\[\]{}]/g) || []).length;

  // Rough estimation: 1.3 tokens per word + punctuation
  return Math.ceil(words.length * 1.3 + punctuation * 0.5);
}

// ============================================================================
// Content Hash
// ============================================================================

/**
 * Generate a content hash for deduplication.
 * Uses a simple hash function suitable for Edge/Workers environments.
 */
export async function generateContentHash(content: string): Promise<string> {
  // Use Web Crypto API (works in Edge/Workers)
  const encoder = new TextEncoder();
  const data = encoder.encode(content.toLowerCase().trim());

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback: Simple hash for environments without crypto.subtle
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

// ============================================================================
// Text Splitting Utilities
// ============================================================================

/**
 * Split text by sentences
 */
export function splitBySentences(text: string): string[] {
  // Handle common sentence endings
  const sentenceRegex = /[^.!?]*[.!?]+[\s]*/g;
  const matches = text.match(sentenceRegex);
  const sentences: string[] = matches ? [...matches] : [];

  // Handle remaining text without sentence ending
  const joined = sentences.join("");
  if (joined.length < text.length) {
    sentences.push(text.slice(joined.length));
  }

  return sentences.filter((s) => s.trim().length > 0);
}

/**
 * Split text by paragraphs
 */
export function splitByParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Split markdown by headers
 */
export function splitByMarkdownHeaders(
  text: string
): Array<{ header: string; content: string; level: number }> {
  const sections: Array<{ header: string; content: string; level: number }> = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;

  let lastIndex = 0;
  let match;

  while ((match = headerRegex.exec(text)) !== null) {
    // Add content before this header to previous section
    if (sections.length > 0 && lastIndex < match.index) {
      sections[sections.length - 1].content += text.slice(lastIndex, match.index);
    } else if (lastIndex < match.index && lastIndex === 0) {
      // Content before first header
      sections.push({
        header: "",
        content: text.slice(0, match.index),
        level: 0,
      });
    }

    sections.push({
      header: match[2],
      content: "",
      level: match[1].length,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining content
  if (sections.length > 0 && lastIndex < text.length) {
    sections[sections.length - 1].content += text.slice(lastIndex);
  } else if (sections.length === 0) {
    sections.push({ header: "", content: text, level: 0 });
  }

  return sections;
}

/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(
  text: string
): Array<{ code: string; language: string; start: number; end: number }> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: Array<{ code: string; language: string; start: number; end: number }> = [];

  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || "text",
      code: match[2],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return blocks;
}

/**
 * Extract lists from text
 */
export function extractLists(text: string): Array<{ content: string; start: number; end: number }> {
  const listRegex = /(?:^|\n)((?:[-*+]|\d+\.)\s+.+(?:\n(?:[-*+]|\d+\.)\s+.+)*)/gm;
  const lists: Array<{ content: string; start: number; end: number }> = [];

  let match;
  while ((match = listRegex.exec(text)) !== null) {
    lists.push({
      content: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return lists;
}

// ============================================================================
// Config Resolution
// ============================================================================

/**
 * Get chunking config for a specific source/file type
 */
export function getChunkingConfig(
  sourceType: string,
  fileType?: string,
  tenantConfig?: Partial<ChunkingConfig>
): ChunkingConfig {
  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Apply source-type specific config
  const sourceKey = fileType ? `${sourceType}_${fileType}` : sourceType;
  if (CONFIG_BY_SOURCE[sourceKey]) {
    config = { ...config, ...CONFIG_BY_SOURCE[sourceKey] };
  }

  // Apply tenant-specific overrides
  if (tenantConfig) {
    config = { ...config, ...tenantConfig };
  }

  return config;
}
