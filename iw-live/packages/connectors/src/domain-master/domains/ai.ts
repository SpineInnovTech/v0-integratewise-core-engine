import { DomainMasterConnector } from "../domain-master-connector";
import { DomainId } from "../types";
import { getProvidersForDomain } from "../catalog-bridge";
import { OpenAIConnector } from "../../ai/openai";

/**
 * AI Domain Master — catalog-driven (OpenAI, Cohere).
 */
export class AIMasterConnector extends DomainMasterConnector {
  readonly domain: DomainId = "ai";
  readonly domainName = "AI & LLM Services";

  readonly supportedProviders = getProvidersForDomain("ai");

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    options?: Record<string, any>
  ): Promise<any> {
    const primary = this.primaryProviderId;
    if (primary === "openai") {
      const openai = this.getProvider<OpenAIConnector>("openai");
      return openai.createChatCompletion({
        model: options?.model || "gpt-4o",
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: options?.max_tokens || 4096,
        ...options,
      });
    }
    throw new Error("No AI provider configured or chat not supported");
  }
}
