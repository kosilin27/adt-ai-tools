# ADT AI Tools Catalog

## Figma sync

Source: 30 Cases 2026 (`374:1308`). The catalog checks live Figma daily at 17:05 Europe/Moscow, or manually via **Actions → Sync Figma → Run workflow**.

Required GitHub secret: `FIGMA_TOKEN`. Safe changes auto-deploy to the GitHub Pages fallback; structural and unknown-status changes stop the pipeline.

Tool statuses come only from effectively visible `DockingBadge` text in the status cell, including ancestor visibility. Multiple statuses are retained. A working case is any row whose `sourceStatusValues` includes `На проде`; the binary `Emotional Rubricator` variant is ignored. Filters match any visible status; Detail shows all badges. Cards are displayed once, with `На проде` cases first and then the remaining source-status groups. Hero badge counts overlap.

Run `node --experimental-strip-types scripts/status-forensics.mjs` with `FIGMA_TOKEN`, or pass a live Figma MCP evidence JSON file. The report includes counts and per-row badge node IDs.

Avito Prototype Hosting is the primary publication. Build it with `VITE_BASE=./ npm run build`; hosted details use hash routes so shared links survive refresh under a versioned hosting path. Default builds preserve `/adt-ai-tools/` and `404.html` for GitHub Pages.
