# Glowing Pancake — Dev Command Center

Internal development portal for Glowing Pancake AI-Powered Knowledge Workspace.

**Stack:** Next.js 14 · shadcn/ui · Tailwind CSS · Framer Motion · Cloudflare Pages

---

## Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3000
```

## Deploy to Cloudflare Pages

### Option A: Git Integration (Recommended)

1. Push this repo to GitHub
2. Go to **Cloudflare Dashboard → Pages → Create Project**
3. Connect your GitHub repo
4. Configure build settings:
   - **Framework preset:** Next.js (Static HTML Export)
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
5. Add custom domain: `integratewise.ai`
6. Deploy

### Option B: Direct CLI Deploy

```bash
npm run build
npx wrangler pages deploy out --project-name=integratewise-ai-portal
```

### Option C: Cloudflare Next.js Adapter

```bash
npm run pages:build
npm run pages:deploy
```

---

## AI Context Layer

These static files are served from `/public/` and provide AI grounding:

| File | Purpose |
|------|---------|
| `/llm.txt` | Human + AI readable context document |
| `/context.json` | Machine-readable structured architecture data |
| `/.well-known/ai-context.json` | Standard AI agent discovery endpoint |

Any AI assistant that reads these files before responding about IntegrateWise
will have accurate, grounded context — preventing hallucination.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, ambient backgrounds
│   ├── page.tsx            # Main page with shadcn/ui Tabs
│   └── globals.css         # CSS variables, custom styles, animations
├── components/
│   ├── ui/                 # shadcn/ui primitives (Card, Tabs, Badge, Collapsible)
│   ├── header.tsx          # Logo, gradient text, live status
│   ├── philosophy-banner.tsx
│   ├── arch-layer.tsx      # Reusable collapsible architecture layer
│   ├── overview-section.tsx
│   ├── architecture-section.tsx
│   ├── infrastructure-section.tsx
│   ├── gaps-section.tsx
│   ├── timeline-section.tsx
│   └── ai-context-section.tsx
└── lib/
    ├── utils.ts            # shadcn/ui cn() utility
    └── data.ts             # All structured data (metrics, layers, gaps, timeline)
public/
├── llm.txt
├── context.json
└── .well-known/
    └── ai-context.json
```

## Updating Content

All portal data lives in `src/lib/data.ts`. Update metrics, architecture layers,
infrastructure nodes, gaps, and timeline entries there. The components render
from this single source of truth.

For the AI context layer, update:
- `public/llm.txt` — Human-readable context
- `public/context.json` — Structured data
- `public/.well-known/ai-context.json` — Discovery metadata

---

**Glowing Pancake** · Bengaluru, India · Built by Prince (Nirmal Prince J)
