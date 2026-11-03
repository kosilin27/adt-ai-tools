# ADT AI Tools Catalog

Figma → AI Tools Catalog → Confluence → Agent Skills.

**Canonical repository:** [kosilin27/adt-ai-tools](https://github.com/kosilin27/adt-ai-tools). Stash becomes canonical only after team contribution, CI and production deployment are proven. GitHub Pages stays as fallback.

## Start

Node.js 22. Run `npm ci`, `npx playwright install chromium`, then `npm run dev`. Validate with `npm run verify`.

## Where to change what

| Change | Edit |
|---|---|
| Source title, link, authors, audience, status, membership | Figma cases `374:1308` / Backlog `2439:9151` |
| Description, category, how-to, special CTA | `src/data/curatedTools.ts`, keyed by Figma node ID |
| UI | App code/styles |
| Agent intent/instructions/examples | `src/data/agentSkills.ts` |

Never edit `src/data/figmaCasesSnapshot.ts` manually. It contains both generated source arrays, updated atomically. Case numbers are not identity. Multiple statuses are preserved; working means a visible `На проде` badge.

## Server sync

GitHub Actions checks live Figma daily at **17:05 Europe/Moscow**; run times may be delayed by GitHub. It runs on hosted Ubuntu and does not depend on any laptop. Required secret: `FIGMA_TOKEN`.

No source changes → success, no commit/deploy. Safe changes → tests → atomic source commit → bot PR/merge → GitHub Pages fallback → remote QA. New/removed/moved/malformed/unknown rows block with an artifact. A reviewed new complete row has one acceptance operation: `npm run sync:figma -- --accept-new`, or manual Actions dispatch with `accept_new=true`. Moves require explicit review and `--accept-moves`; disappearance remains blocked.

## Hosting and knowledge

Primary static site: existing Avito Prototype Hosting prototype **adt-ai-tools**. Build with `VITE_BASE=./ npm run build`; use hash routes. GitHub fallback uses `/adt-ai-tools/` and `404.html`.

Confluence publishing: `npm run check:confluence`, then `npm run sync:confluence -- --apply` with an authenticated corporate MCP transport. It uses version checks, exact destination IDs and content fingerprints. A local publish is not proof of a scheduled server-side internal publish.

[Architecture](docs/architecture.md) · [Contribution guide](docs/contributing.md) · [Source contract](docs/figma-sync.md).
