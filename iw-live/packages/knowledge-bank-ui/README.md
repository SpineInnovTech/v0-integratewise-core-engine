# Knowledge Bank UI

Canonical in-repo replacement for the former `integratewise-knowledge-bank` folder.

## Purpose

- Holds the standalone Knowledge Bank UI shell used as a Flow C / Knowledge UI reference surface.
- Keeps the Inbox, Search, Topics, Demo, shared types, and mock API in one owned workspace package.
- Serves as the only retained source for the old knowledge-bank UI after repo retirement.

## Current status

- Canonical owner: `integratewise-live/packages/knowledge-bank-ui`
- Legacy external source: `integratewise-knowledge-bank`
- Runtime role: reference/embeddable React package; main product Knowledge UI still lives in `apps/web` and `services/knowledge`

## Notes

- This package is intentionally private to the monorepo.
- If the package is embedded into `apps/web` later, keep this package as the single shared source rather than reintroducing a sibling repo copy.
