# AI Gateway Demo (Vercel AI Gateway + Vercel AI SDK)

This folder contains a minimal reproduction of the AI Gateway quickstart.

**Note:** This project (integratewise-live) primarily uses **Cloudflare AI Gateway** for production AI routing (see `services/intelligence/src/lib/ai-router.ts`, `services/iw-agent-runtime/src/ecosystem/ai-gateway.ts`, and `wrangler.toml` entries for `AI_GATEWAY_ID`).

This demo is provided exactly as requested for experimenting with **Vercel AI Gateway**.

## 1. Install dependencies

```bash
npm install ai
```

(Already done in this folder.)

## 2. Pull Vercel environment variables locally

```bash
vc env pull .env.local
```

This pulls `VERCEL_OIDC_TOKEN`, allowing passwordless access to AI Gateway (no separate API key needed).

If you don't have the Vercel CLI (`vc`) or a linked Vercel project with AI Gateway enabled, set up credentials manually or use an `AI_GATEWAY_API_KEY`.

Create `.env.local` with:

```
VERCEL_OIDC_TOKEN=your_token_here
# or for direct key usage (alternative)
# AI_GATEWAY_API_KEY=...
```

## 3. The script

[index.mjs](./index.mjs)

```js
import { streamText } from 'ai'

const result = streamText({
  model: 'openai/gpt-5.5',
  prompt: 'Explain quantum computing in simple terms.',
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
```

**Model strings:** When using Vercel AI Gateway, you use `provider/model` format (the gateway resolves the actual upstream).

## 4. Run the script

```bash
node --env-file=.env.local index.mjs
```

## Running from this directory

```bash
cd integratewise-live/scripts/ai-gateway-demo
node --env-file=.env.local index.mjs
```

## Relation to IntegrateWise

- **Primary production path:** Cloudflare AI Gateway (`gateway.ai.cloudflare.com`) + OpenRouter + Workers AI.
  - Config: `AI_GATEWAY_ID` per environment.
  - Router: `services/intelligence/src/lib/ai-router.ts`
  - Agent facade: `services/iw-agent-runtime/src/ecosystem/ai-gateway.ts`

- Use this demo if you want to compare latency/cost or test models exclusively through Vercel AI Gateway (e.g. for specific provider routing available only there).

## Troubleshooting

- "No AI Gateway API key" → ensure VERCEL_OIDC_TOKEN is present or provide the key the SDK expects for gateway usage.
- Model not found → Vercel Gateway must have the provider/model enabled for your account.
- For the main IntegrateWise product use the existing CF paths (no `ai` package dependency added to core).

Last updated: 2026-06-19
