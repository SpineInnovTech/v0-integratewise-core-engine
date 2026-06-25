/**
 * Document Chunker
 *
 * Splits documents into semantic chunks suitable for embedding and search.
 * Implements multiple strategies: fixed, sentence, paragraph, semantic.
 */

import {
  type ChunkingConfig,
  type Chunk,
  type ChunkMetadata,
  type ChunkType,
  type ChunkingResult,
  getChunkingConfig,
  estimateTokenCount,
  generateContentHash,
  splitBySentences,
  splitByParagraphs,
  splitByMarkdownHeaders,
  extractCodeBlocks,
} from "./config";

// ============================================================================
// Main Chunker Class
// ============================================================================

export class DocumentChunker {
  private config: ChunkingConfig;

  constructor(config?: Partial<ChunkingConfig>) {
    this.config = getChunkingConfig("file", undefined, config);
  }

  /**
   * Update configuration
   */
  setConfig(config: ChunkingConfig): void {
    this.config = config;
  }

  /**
   * Chunk a document based on strategy
   */
  async chunk(
    content: string,
    options: {
      sourceType?: string;
      fileType?: string;
      existingHeaders?: string[];
    } = {}
  ): Promise<ChunkingResult> {
    const startTime = Date.now();

    // Get config for this document type
    const config = getChunkingConfig(options.sourceType || "file", options.fileType, this.config);

    let rawChunks: Array<{ content: string; type: ChunkType; headers?: string[] }>;

    switch (config.strategy) {
      case "fixed":
        rawChunks = this.fixedChunking(content, config);
        break;
      case "sentence":
        rawChunks = this.sentenceChunking(content, config);
        break;
      case "paragraph":
        rawChunks = this.paragraphChunking(content, config);
        break;
      case "semantic":
      default:
        rawChunks = this.semanticChunking(content, config, options.existingHeaders);
        break;
    }

    // Convert to Chunk objects with metadata
    const chunks: Chunk[] = [];
    let charOffset = 0;
    let totalTokens = 0;

    for (let i = 0; i < rawChunks.length; i++) {
      const raw = rawChunks[i];
      const tokenCount = estimateTokenCount(raw.content);
      const contentHash = await generateContentHash(raw.content);

      const charStart = content.indexOf(raw.content, charOffset);
      const charEnd = charStart + raw.content.length;
      charOffset = charEnd;

      const metadata: ChunkMetadata = {
        chunkIndex: i,
        chunkType: raw.type,
        charStart: charStart >= 0 ? charStart : 0,
        charEnd: charStart >= 0 ? charEnd : raw.content.length,
        tokenCount,
        headers: raw.headers || options.existingHeaders,
      };

      chunks.push({
        content: raw.content,
        contentHash,
        metadata,
      });

      totalTokens += tokenCount;
    }

    return {
      chunks,
      totalTokens,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // ==========================================================================
  // Fixed Chunking
  // ==========================================================================

  private fixedChunking(
    content: string,
    config: ChunkingConfig
  ): Array<{ content: string; type: ChunkType }> {
    const chunks: Array<{ content: string; type: ChunkType }> = [];
    const targetChars = config.chunkSize * 4; // Approximate chars
    const overlapChars = config.chunkOverlap * 4;

    let i = 0;
    while (i < content.length) {
      const end = Math.min(i + targetChars, content.length);
      let chunk = content.slice(i, end);

      // Try to end at a sentence or word boundary
      if (end < content.length) {
        const lastPeriod = chunk.lastIndexOf(". ");
        const lastSpace = chunk.lastIndexOf(" ");

        if (lastPeriod > targetChars * 0.5) {
          chunk = chunk.slice(0, lastPeriod + 1);
        } else if (lastSpace > targetChars * 0.7) {
          chunk = chunk.slice(0, lastSpace);
        }
      }

      if (chunk.trim().length >= config.minChunkSize) {
        chunks.push({ content: chunk.trim(), type: "text" });
      }

      i += chunk.length - overlapChars;
    }

    return chunks;
  }

  // ==========================================================================
  // Sentence Chunking
  // ==========================================================================

  private sentenceChunking(
    content: string,
    config: ChunkingConfig
  ): Array<{ content: string; type: ChunkType }> {
    const sentences = splitBySentences(content);
    const chunks: Array<{ content: string; type: ChunkType }> = [];

    let currentChunk = "";
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = estimateTokenCount(sentence);

      if (currentTokens + sentenceTokens > config.chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({ content: currentChunk.trim(), type: "text" });

        // Start new chunk with overlap
        const overlapSentences = this.getOverlapSentences(currentChunk, config.chunkOverlap);
        currentChunk = overlapSentences + sentence;
        currentTokens = estimateTokenCount(currentChunk);
      } else {
        currentChunk += sentence;
        currentTokens += sentenceTokens;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim().length >= config.minChunkSize) {
      chunks.push({ content: currentChunk.trim(), type: "text" });
    }

    return chunks;
  }

  private getOverlapSentences(text: string, overlapTokens: number): string {
    const sentences = splitBySentences(text);
    let overlap = "";
    let tokens = 0;

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = estimateTokenCount(sentences[i]);
      if (tokens + sentenceTokens <= overlapTokens) {
        overlap = sentences[i] + overlap;
        tokens += sentenceTokens;
      } else {
        break;
      }
    }

    return overlap;
  }

  // ==========================================================================
  // Paragraph Chunking
  // ==========================================================================

  private paragraphChunking(
    content: string,
    config: ChunkingConfig
  ): Array<{ content: string; type: ChunkType }> {
    const paragraphs = splitByParagraphs(content);
    const chunks: Array<{ content: string; type: ChunkType }> = [];

    let currentChunk = "";
    let currentTokens = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = estimateTokenCount(paragraph);

      // If single paragraph exceeds max, split it further
      if (paragraphTokens > config.maxChunkSize) {
        // Save current chunk first
        if (currentChunk.trim().length >= config.minChunkSize) {
          chunks.push({ content: currentChunk.trim(), type: "text" });
        }

        // Split large paragraph by sentences
        const subChunks = this.sentenceChunking(paragraph, config);
        chunks.push(...subChunks);

        currentChunk = "";
        currentTokens = 0;
        continue;
      }

      if (currentTokens + paragraphTokens > config.chunkSize && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim(), type: "text" });
        currentChunk = paragraph;
        currentTokens = paragraphTokens;
      } else {
        currentChunk += (currentChunk.length > 0 ? "\n\n" : "") + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    if (currentChunk.trim().length >= config.minChunkSize) {
      chunks.push({ content: currentChunk.trim(), type: "text" });
    }

    return chunks;
  }

  // ==========================================================================
  // Semantic Chunking (Markdown-aware)
  // ==========================================================================

  private semanticChunking(
    content: string,
    config: ChunkingConfig,
    existingHeaders?: string[]
  ): Array<{ content: string; type: ChunkType; headers?: string[] }> {
    const chunks: Array<{ content: string; type: ChunkType; headers?: string[] }> = [];

    // Extract special blocks first
    const codeBlocks = config.preserveCodeBlocks ? extractCodeBlocks(content) : [];
    // TODO: list preservation (extractLists) – currently unused by the chunker flow.

    // Split by markdown headers
    const sections = splitByMarkdownHeaders(content);

    let headerStack: string[] = existingHeaders ? [...existingHeaders] : [];

    for (const section of sections) {
      // Update header stack based on level
      if (section.header) {
        // Pop headers at same or higher level
        while (headerStack.length >= section.level && headerStack.length > 0) {
          headerStack.pop();
        }
        headerStack.push(section.header);
      }

      const sectionContent = section.content.trim();
      if (!sectionContent) continue;

      // Check if this section contains code blocks
      const sectionCodeBlocks = codeBlocks.filter(
        (cb) =>
          cb.start >= content.indexOf(section.header) &&
          cb.end <= content.indexOf(section.header) + section.content.length
      );

      // If section is small enough, keep as single chunk
      const sectionTokens = estimateTokenCount(sectionContent);

      if (sectionTokens <= config.chunkSize) {
        // Determine chunk type
        let type: ChunkType = "text";
        if (
          sectionCodeBlocks.length > 0 &&
          sectionCodeBlocks[0].code.length > sectionContent.length * 0.5
        ) {
          type = "code";
        } else if (section.header && sectionContent.length < 100) {
          type = "heading";
        }

        chunks.push({
          content: sectionContent,
          type,
          headers: [...headerStack],
        });
      } else {
        // Split large sections
        const subChunks = this.paragraphChunking(sectionContent, config);
        for (const subChunk of subChunks) {
          chunks.push({
            ...subChunk,
            headers: [...headerStack],
          });
        }
      }

      // Handle code blocks as separate chunks if configured
      if (config.preserveCodeBlocks) {
        for (const cb of sectionCodeBlocks) {
          if (estimateTokenCount(cb.code) > config.minChunkSize) {
            chunks.push({
              content: "```" + cb.language + "\n" + cb.code + "```",
              type: "code",
              headers: [...headerStack],
            });
          }
        }
      }
    }

    return chunks;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a chunker for a specific source type
 */
export function createChunker(
  sourceType: string,
  fileType?: string,
  customConfig?: Partial<ChunkingConfig>
): DocumentChunker {
  const config = getChunkingConfig(sourceType, fileType, customConfig);
  return new DocumentChunker(config);
}

/**
 * Quick chunk function for simple use cases
 */
export async function chunkDocument(
  content: string,
  options: {
    sourceType?: string;
    fileType?: string;
    config?: Partial<ChunkingConfig>;
  } = {}
): Promise<ChunkingResult> {
  const chunker = createChunker(options.sourceType || "file", options.fileType, options.config);
  return chunker.chunk(content, options);
}

/**
 * Chunk an AI session summary
 */
export async function chunkSession(
  summary: string,
  toolCalls?: string[],
  memories?: string[]
): Promise<ChunkingResult> {
  const chunker = createChunker("session");

  // Combine session content
  let content = summary;

  if (toolCalls && toolCalls.length > 0) {
    content += "\n\n## Tool Calls\n" + toolCalls.map((t, i) => `${i + 1}. ${t}`).join("\n");
  }

  if (memories && memories.length > 0) {
    content += "\n\n## Memories\n" + memories.join("\n\n");
  }

  return chunker.chunk(content, { sourceType: "session" });
}
