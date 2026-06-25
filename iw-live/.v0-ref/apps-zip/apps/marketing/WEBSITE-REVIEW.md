# IntegrateWise Website Design — Review & Feedback

**Reviewer:** Claude (AI Design & Code Review)
**Date:** February 25, 2026
**Project:** IntegrateWise SaaS Landing Page (React + Vite + Tailwind v4)

---

## Overall Impression

Prince, this is genuinely impressive work for IntegrateWise. The storytelling arc — from "your tools don't talk" through diagnosis, solution reveal, industry benefits, to CTA — is one of the strongest narrative flows I've seen on a SaaS landing page. The copy is visceral and relatable ("You didn't start your business to babysit technology"). The anti-gravity confetti background is a distinctive visual signature.

**Score: 8/10** — Strong foundation, excellent copy, solid architecture. The items below would take it from great to world-class.

---

## What's Working Well

**1. Narrative Structure (Homepage)**
The "Act" structure (Hero → Persona Cards → SSOT Explainer → Solution Reveal → Trust Bar → Workspace Demo → How It Heals → Industry Benefits → CTA) creates a compelling journey. Each section builds on the last. This is not a typical feature-dump landing page — it's a story.

**2. Copy Quality**
Lines like "Your left hand (Sales) does not know what your right hand (Accounts) is doing" and "The tools are not broken. The connections between them are" — these are exceptional. They speak to the business owner's pain directly.

**3. Motion Design**
The Framer Motion usage is tasteful — the Float component, staggered reveals, spring-based hover states, and the animated nav indicator all feel polished. The `prefers-reduced-motion` check on the background canvas is an accessibility win.

**4. Component Architecture**
Clean separation: Layout, Header, Footer, page-level components, reusable motion helpers (FadeIn, StaggerChildren), UI primitives (shadcn/ui). The router structure with 7 distinct pages shows serious product thinking.

**5. Indian Market Awareness**
Tool logos (Tally, Zoho, Razorpay, WhatsApp) signal "we understand your stack." The industry verticals (Healthcare, Manufacturing, Real Estate, Auto Dealership) are well-chosen for the Indian SMB/SME market.

---

## Issues & Recommendations

### Critical (Fix Before Launch)

**1. Missing Image Assets**
The SecurityPage imports `figma:asset/...png` files via Vite aliases that map to `./src/assets/`. I don't see an `assets` folder in the project. These images will break at build time. You need to export these from Figma and place them in `src/assets/`.

**2. No `<meta>` Tags or SEO Setup**
The `index.html` is minimal. For a marketing site, you need Open Graph tags, Twitter cards, a favicon, meta description, and structured data. This is critical for sharing on WhatsApp/LinkedIn (your audience's primary channels).

**3. Buttons/CTAs Go Nowhere**
"Start Free", "Sign In", "See It In Action — Free", "Start Free Trial", "Contact Sales" — all these buttons have no `href` or `onClick`. Before launch, these need to link to your signup flow, calendly, or at minimum a waitlist form.

**4. No `package-lock.json` / `node_modules`**
The project has no lockfile. This means builds may not be reproducible. Run `npm install` and commit the lockfile.

### High Priority

**5. Performance: Anti-Gravity Background Canvas**
The canvas redraws 50 particles every frame on the ENTIRE page height (`document.documentElement.scrollHeight`). On a long homepage with 12+ sections, this canvas could be 8000+ pixels tall. This will cause jank on mobile devices, especially mid-range Android phones (your target market).

*Recommendation:* Either limit the canvas to viewport height (it's `position: fixed` anyway, so it only needs to be viewport-sized), or reduce particle count on mobile, or use CSS-only floating elements instead.

**6. The Figma Export Layer (`src/imports/`)**
The `DesignSystemSaaSLandingPageCommunity.tsx` file is 57,000+ tokens — a massive Figma auto-export with absolute positioning, hardcoded pixel values, and inline font specifications (`font-['Inter:Medium',sans-serif]`). This entire `imports/` directory seems like the raw Figma export that your custom components have largely replaced.

*Recommendation:* Audit whether any page actually imports from `src/imports/`. If the custom components (HomePage, Header, Footer, etc.) have replaced them, remove the imports folder to reduce bundle size dramatically.

**7. Font Loading Strategy**
The CSS references `Inter` via the Figma export format (`font-['Inter:Regular',sans-serif]`), but there's no font import statement (no Google Fonts link, no `@font-face`, no `next/font`). This means the site will fall back to system fonts unless Inter is installed on the user's device.

*Recommendation:* Add Inter via Google Fonts in `index.html` or use `@fontsource/inter` as an npm dependency.

**8. Mobile Responsiveness Gaps**
The Header handles mobile well (hamburger menu, responsive nav). But some homepage sections use `max-w-5xl` grids that may feel cramped on small screens. The PersonaCards grid (`lg:grid-cols-3`) is good, but the industry benefits cards at `text-[10px]` and `text-[12px]` will be very hard to read on mobile.

*Recommendation:* Bump minimum text sizes to 14px for body copy on mobile. Test on a 375px viewport.

### Medium Priority

**9. Dark Mode Not Wired Up**
The CSS has a `@custom-variant dark` definition and `next-themes` is a dependency, but there's no theme toggle anywhere in the UI. The dark theme variables aren't defined in `globals.css`. Either remove `next-themes` from dependencies or implement dark mode.

**10. Pricing Page: Growth Plan Pricing**
$99/month for up to 5 users — this is a significant jump from Free. For Indian SMBs, consider whether ₹ pricing or a middle tier (e.g., ₹1,999/month for 2 users) would improve conversion. The pricing page copy is excellent though.

**11. Footer Email Input Has No Form Handler**
The email input in the footer ("Get Started") has no `onSubmit`, no form wrapper, and no validation. It's a dead input right now.

**12. Accessibility Gaps**
- The Float animation wrapper has no `aria` attributes — screen readers will encounter constantly-moving content with no way to pause
- Color contrast: `text-muted-foreground` (#6b6b6b) on white (#fff) = 5.2:1 ratio (passes AA but barely). The `text-muted-foreground/60` used in some places would fail
- The floating stat cards are `cursor-default` but have hover effects, which is confusing for users with motor impairments

**13. The Workspace Demo Component**
The HeroWorkspace is imported but I couldn't review its full implementation. If it's a complex interactive demo, make sure it has a fallback/screenshot for users with JavaScript disabled or slow connections.

**14. Dead Links**
Footer links for Careers, Contact, Documentation, Blog, Changelog, and Support all point to `#`. These should either be removed or pointed to actual pages/coming-soon pages before launch.

### Nice to Have

**15. Add a Cookie Consent Banner**
The footer links to "Cookie Policy" but there's no consent mechanism. If you're targeting any EU users or want to be compliance-ready, add a simple cookie banner.

**16. Analytics Integration**
No Google Analytics, Mixpanel, PostHog, or any tracking is set up. For a marketing site, you'll want to track page views, CTA clicks, and scroll depth at minimum.

**17. Image Optimization**
When you add the missing Figma assets, use WebP format with `<picture>` fallbacks, or use Vite's image optimization plugins. Large PNGs will hurt your Core Web Vitals.

**18. Loading States**
Consider adding a lightweight skeleton/loading state for the initial page load, especially since you have canvas animations and Framer Motion that need to initialize.

---

## Architecture Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| React + TypeScript | Good | Clean typing, proper component patterns |
| Routing (react-router) | Good | 7 pages, clean Layout wrapper |
| Styling (Tailwind v4) | Good | CSS variables, design tokens defined |
| Animation (Framer Motion) | Good | Tasteful, not overdone |
| UI Components (shadcn/ui) | Good | Full component library available |
| SEO | Needs Work | No meta tags, no sitemap, no robots.txt |
| Performance | Needs Work | Canvas optimization, font loading, bundle size |
| Accessibility | Needs Work | Contrast, motion, screen reader support |
| Deployment-ready | No | Missing assets, dead CTAs, no form handlers |

---

## Recommended Priority Order

1. Export and add missing Figma image assets
2. Add meta tags, favicon, and OG images to `index.html`
3. Wire up CTA buttons to your signup/waitlist
4. Add Inter font loading
5. Fix the canvas performance (viewport-only rendering)
6. Audit and potentially remove the `src/imports/` directory
7. Add form handler for email inputs
8. Mobile responsive testing pass
9. Add analytics
10. Deploy to Cloudflare Pages

---

*This review is based on a static code analysis. A live build review would catch additional runtime issues.*
