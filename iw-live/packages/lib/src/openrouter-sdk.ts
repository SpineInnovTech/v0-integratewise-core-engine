/**
 * OpenRouter official SDK — configured client from environment
 *
 * Uses @openrouter/sdk with apiKey and optional ranking options
 * (httpReferer → HTTP-Referer, xTitle → X-OpenRouter-Title). For Workers, pass env from request context.
 *
 * @see https://openrouter.ai/docs/sdks/typescript
 */

import { OpenRouter } from "@openrouter/sdk";

export type { OpenRouter };

export interface OpenRouterSDKEnv {
  OPENROUTER_API_KEY: string;
  /** Optional. Site URL for rankings on openrouter.ai (sent as HTTP-Referer) */
  OPENROUTER_SITE_URL?: string;
  /** Optional. Site title for rankings on openrouter.ai (sent as X-OpenRouter-Title) */
  OPENROUTER_SITE_NAME?: string;
}

const DEFAULT_SITE_URL = "https://app.integratewise.ai";
const DEFAULT_SITE_NAME = "IntegrateWise";

/**
 * Create a configured OpenRouter SDK instance from environment.
 * Use this in Workers (pass env from request) or Node (process.env).
 *
 * @example
 * // In a Worker
 * const openRouter = createOpenRouterFromEnv(env);
 * const completion = await openRouter.chat.send({
 *   model: 'openai/gpt-4o',
 *   messages: [{ role: 'user', content: 'Hello' }],
 *   stream: false,
 * });
 * console.log(completion.choices[0].message.content);
 *
 * @example
 * // With streaming
 * const stream = await openRouter.chat.send({ messages, model: '...', stream: true });
 * for await (const chunk of stream) {
 *   process.stdout.write(chunk.choices[0]?.delta?.content ?? '');
 * }
 */
export function createOpenRouterFromEnv(env: OpenRouterSDKEnv): OpenRouter {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required for OpenRouter SDK");
  }

  const siteUrl = env.OPENROUTER_SITE_URL ?? DEFAULT_SITE_URL;
  const siteName = env.OPENROUTER_SITE_NAME ?? DEFAULT_SITE_NAME;

  return new OpenRouter({
    apiKey,
    httpReferer: siteUrl,
    xTitle: siteName,
  });
}
