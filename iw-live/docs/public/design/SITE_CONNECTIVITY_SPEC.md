# IntegrateWise — Site Connectivity Spec

> How all surfaces link to each other. One ecosystem, consistent navigation.

---

## The Five Surfaces

| Surface        | URL                          | Repo               | Purpose                                                                 |
| -------------- | ---------------------------- | ------------------ | ----------------------------------------------------------------------- |
| Marketing Site | `integratewise.ai`           | integratewise-lg   | Public website — hero, solutions, pricing, CTAs                         |
| Public Docs    | `docs.integratewise.ai`      | integratewise-docs | Product documentation — story, workspace, spine, connectors, reference  |
| Internal Docs  | `int-docs.integratewise.ai`  | integratewise-docs | Team docs — product, GTM, architecture, operations, playbooks, runbooks |
| Changelog      | `changelog.integratewise.ai` | integratewise-docs | Product updates, release notes, version history                         |
| App            | `app.integratewise.ai`       | integratewise-live | The product — workspace, Twin, connectors, L2 overlay                   |

---

## Cross-Linking Map

### From Marketing Site (integratewise.ai)

| Link Location                             | Links To                | URL                                                                  |
| ----------------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| Header nav → "Docs"                       | Public Docs home        | `docs.integratewise.ai`                                              |
| Header nav → "Changelog"                  | Changelog home          | `changelog.integratewise.ai`                                         |
| Header nav → "Book a Demo"                | Contact page            | `integratewise.ai/contact?intent=demo`                               |
| Footer → Documentation                    | Public Docs home        | `docs.integratewise.ai`                                              |
| Footer → API Reference                    | Docs reference section  | `docs.integratewise.ai/reference/depth-matrix`                       |
| Footer → Changelog                        | Changelog home          | `changelog.integratewise.ai`                                         |
| Footer → Blog                             | Blog page               | `integratewise.ai/blog`                                              |
| Pricing → "Book a Demo"                   | Contact page            | `integratewise.ai/contact?intent=pricing`                            |
| Any "Sign in" / "Go to app"               | App login               | `app.integratewise.ai`                                               |
| Platform page → deep links                | Relevant docs pages     | `docs.integratewise.ai/spine/*`, `docs.integratewise.ai/workspace/*` |
| Integrations page → "How connectors work" | Docs connectors section | `docs.integratewise.ai/connectors/how-connectors-work`               |

### From Public Docs (docs.integratewise.ai)

| Link Location                      | Links To                    | URL                                    |
| ---------------------------------- | --------------------------- | -------------------------------------- |
| Top nav → "IntegrateWise"          | Marketing site home         | `integratewise.ai`                     |
| Top nav → "What's New"             | Changelog home              | `changelog.integratewise.ai`           |
| Any "Book a Demo" CTA              | Marketing contact page      | `integratewise.ai/contact?intent=demo` |
| Any "Try it" / "Get started"       | Marketing contact page      | `integratewise.ai/contact`             |
| Footer → main site link            | Marketing site home         | `integratewise.ai`                     |
| Connectors overview → full catalog | Marketing integrations page | `integratewise.ai/integrations`        |
| "Request a Connector"              | Marketing contact page      | `integratewise.ai/contact`             |

### From Internal Docs (int-docs.integratewise.ai)

| Link Location                            | Links To                  | URL                          |
| ---------------------------------------- | ------------------------- | ---------------------------- |
| Top nav → "Public Docs"                  | Public Docs home          | `docs.integratewise.ai`      |
| Top nav → "Marketing Site"               | Marketing site home       | `integratewise.ai`           |
| Top nav → "App"                          | App                       | `app.integratewise.ai`       |
| Top nav → "Changelog"                    | Changelog home            | `changelog.integratewise.ai` |
| Any architecture doc → public equivalent | Relevant public docs page | `docs.integratewise.ai/*`    |

### From Changelog (changelog.integratewise.ai)

| Link Location              | Links To               | URL                        |
| -------------------------- | ---------------------- | -------------------------- |
| Top nav → "Docs"           | Public Docs home       | `docs.integratewise.ai`    |
| Top nav → "IntegrateWise"  | Marketing site home    | `integratewise.ai`         |
| Any feature mention → docs | Relevant docs page     | `docs.integratewise.ai/*`  |
| Any "Try it" CTA           | Marketing contact page | `integratewise.ai/contact` |

### From App (app.integratewise.ai)

| Link Location               | Links To            | URL                                            |
| --------------------------- | ------------------- | ---------------------------------------------- |
| Help menu → "Documentation" | Public Docs home    | `docs.integratewise.ai`                        |
| Help menu → "What's New"    | Changelog home      | `changelog.integratewise.ai`                   |
| Footer → "Back to Site"     | Marketing site home | `integratewise.ai`                             |
| Settings → "API Reference"  | Docs reference      | `docs.integratewise.ai/reference/depth-matrix` |
| Onboarding → "Learn more"   | Relevant docs page  | `docs.integratewise.ai/workspace/how-it-works` |

---

## Shared Navigation Bar

All public-facing surfaces (marketing, docs, changelog) should have a consistent top-level awareness of each other. Not a shared header component (they're different repos/frameworks), but consistent link placement:

**Marketing site header:**

```
Logo    Solutions    Platform    Pricing    Docs↗    Changelog↗    [Sign in]    [Book a Demo]
```

**Docs site header (already in VitePress config):**

```
Logo    The Story    Workspace    Spine    Connectors    What's New↗    IntegrateWise↗
```

Update "What's New" link from `integratewise-changelog.web.app` to `changelog.integratewise.ai`.

**Changelog header:**

```
Logo    Changelog    Docs↗    IntegrateWise↗
```

**Internal docs header:**

```
Logo    [Internal sections]    Public Docs↗    App↗    Marketing↗
```

The `↗` indicates an external link (opens in same tab, different subdomain).

---

## URL Updates Needed

### integratewise-docs repo (VitePress config)

In `docs/.vitepress/config.ts`, update:

```typescript
// Current:
{ text: "What's New", link: "/changelogs/" }

// Change to (if changelog is a separate subdomain):
{ text: "What's New", link: "https://changelog.integratewise.ai" }
```

And in the nav:

```typescript
// Current:
{ text: "IntegrateWise", link: "https://integratewise.ai" }

// Keep as-is — this is correct
```

### integratewise-lg repo (marketing site)

In `components/header.tsx`, add:

```
Docs → https://docs.integratewise.ai
Changelog → https://changelog.integratewise.ai
```

In `components/footer.tsx`, update:

```
Documentation → https://docs.integratewise.ai
Changelog → https://changelog.integratewise.ai
API Reference → https://docs.integratewise.ai/reference/depth-matrix
```

### integratewise-live repo (app)

In the app's help menu or settings, add:

```
Documentation → https://docs.integratewise.ai
What's New → https://changelog.integratewise.ai
```

---

## Consistent Branding Across Surfaces

| Element       | Marketing Site         | Public Docs                                            | Internal Docs          | Changelog              | App                           |
| ------------- | ---------------------- | ------------------------------------------------------ | ---------------------- | ---------------------- | ----------------------------- |
| Logo          | IntegrateWise wordmark | IntegrateWise wordmark                                 | IntegrateWise wordmark | IntegrateWise wordmark | IntegrateWise logo + wordmark |
| Primary color | Emerald `#1BA784`      | VitePress default (blue) — consider theming to emerald | Same as docs           | Same as docs           | Navy `#4154A3`                |
| Font          | Inter                  | VitePress default (Inter if configured)                | Same as docs           | Same as docs           | Inter                         |
| Footer        | Full 4-column          | VitePress default                                      | VitePress default      | VitePress default      | Minimal                       |

**Recommendation:** Theme the VitePress sites to use emerald green (`#1BA784`) as the primary color to match the marketing site. This creates visual continuity when a visitor clicks from the marketing site to docs. The app stays navy blue — that's the working environment, different context.

To theme VitePress, add to `docs/.vitepress/theme/custom.css`:

```css
:root {
  --vp-c-brand-1: #1ba784;
  --vp-c-brand-2: #34d399;
  --vp-c-brand-3: #6ee7b7;
}
```

---

## SEO and Meta

Each surface should have proper meta tags that reference the others:

**Marketing site:**

```html
<link rel="alternate" href="https://docs.integratewise.ai" title="Documentation" />
<link rel="alternate" href="https://changelog.integratewise.ai" title="Changelog" />
```

**Docs site:**

```html
<meta property="og:site_name" content="IntegrateWise Docs" />
<link rel="canonical" href="https://docs.integratewise.ai/..." />
```

**Changelog:**

```html
<meta property="og:site_name" content="IntegrateWise Changelog" />
```

---

_Five surfaces. One ecosystem. Every link goes somewhere real. Every visitor can find their way from any surface to any other._
