---
name: Email workspace honesty contract
description: How the Email module gates Gmail capabilities by granted scope, and why it stays on the local relay.
---

The Email module (artifacts/integratewise + api-server) is powered by the google-mail connector through the owned api-server relay, NOT the Cloudflare platform gateway. Its DataSource tag is `local-relay` — correct, because the relay is genuinely live-connected to Gmail; it is not the platform backend.

**Granted scopes → enabled features:** gmail.readonly + gmail.send + gmail.labels back paginated inbox, thread read, Gmail `q=` search, label/triage filter views, and compose/reply/reply-all/forward.

**NOT granted → visibly DISABLED, never faked:**
- gmail.modify → mark-read / archive / apply-label render as disabled buttons with a lock icon + tooltip explaining the missing scope.
- gmail.settings.basic → server-side auto-filter rules render disabled the same way.

**Why:** the product doctrine is single-voice honesty — never fake a capability the connector can't perform. A disabled-with-reason control is the honest UI; a fake success is a doctrine violation.

**How to apply:** if more Gmail scopes get granted later, flip the corresponding GatedControl usages in email-view.tsx to real mutations on new relay routes — do not silently enable anything before the scope and route exist. Every outbound send must keep routing through GovernanceGate (human approves each send).

**Security — untrusted HTML:** email `body_html` is untrusted external content. It MUST be sanitized (DOMPurify, scripts/handlers/embeds stripped, links forced to target=_blank rel=noopener) before any `dangerouslySetInnerHTML`. Never render raw email HTML.
