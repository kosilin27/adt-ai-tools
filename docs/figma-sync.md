# Figma source synchronization

Identity is `figmaNodeId`. Human case numbers, titles, slugs and row order never determine identity.

## Data ownership

- `figmaCasesSnapshot.ts` is the only generated source dataset, including every parsed column, literal statuses, badge evidence, authors, audiences, text, links and source order.
- `curatedTools.ts` is optional editorial metadata keyed by node ID. Legacy `id` values preserve existing detail URLs and favorites. They are not join keys. Categories, descriptions, product type, instructions, metrics and special action labels belong here.
- `tools.ts` iterates source rows and merges optional editorial metadata. There is no separate tool registry, ID mapping or extra-card list.
- Source actions contain every source URL. URL-specific labels apply while that URL is present. The one-time migration consolidates old snapshot links and old source-action URLs, after proving every old action URL appears in the live Figma row. Existing action labels remain URL-bound overrides. Optional `supplementalActions` is reserved for deliberately product-owned links; none is needed by the migrated baseline.
- `figmaContract.ts` shares vocabulary and completeness validation between CLI and runtime. Named columns are structural schema, never a per-case registry.

## One acceptance path

```sh
npm run check:figma-live
npm run sync:figma -- --accept-new
npm run verify
```

A new complete source row is blocked by the daily job. `--accept-new` validates the entire frame and atomically replaces the one generated snapshot. No other registration is needed. Runtime creates a deterministic draft: route `figma-<nodeId>`, no invented description, categories, dates or product type. Every source audience, author, visible badge and link is retained. Curating it later changes one optional object entry.

Table headers and unfilled template rows are excluded only when their project, author and problem cells all contain the explicit template prompts. Frame parsing reports their node IDs and reasons separately. A real case titled `Проект` is retained.

A complete row must have a node ID, nonempty title and section, at least one known audience, explicit source arrays and all named columns. An explicit empty status cell is valid. Empty authors or links are preserved when their source columns exist. A missing column or field is incomplete and blocks both ordinary sync and acceptance.

Existing valid title/text/link/author/audience/status/section/order changes sync automatically. Links include plain URLs, text-level hyperlinks, REST style overrides and MCP text-range hyperlinks. Statuses come exclusively from effectively visible `DockingBadge` text in column `31`; the `Emotional Rubricator` status property is never used. Unknown visible badge labels fail closed. Status-cell notes remain source text, not status labels.

Removed rows always block, including with `--accept-new`. The CLI never deletes a catalog row silently. A deliberate removal requires a reviewed source/curated change and verification; there is no force-removal flag.

## Strictly read-only check

`--check` writes only stdout/stderr. It never creates a report directory, updates source, touches GitHub output/summary files or normalizes the snapshot. It returns failure for unsafe source or unavailable credentials. Safe differences return success with their diff. Capture stdout outside the checkout when a file is needed.

For an offline complete export:

```sh
npm run check:figma-live -- --frame-json /absolute/path/frame.json
npm run check:figma-live -- --source-json /absolute/path/source-rows.json
```

`--frame-json` runs the real parser. `--source-json` validates an already-parsed export; it does not prove current live state. GitHub Actions forbids offline inputs and `--accept-new`. The old addition-only replay is removed because it cannot establish live source order or full field parity.

## Workflow and atomicity

The job fetches live Figma, parses, validates and diffs before any source write. The candidate merged dataset is also checked for route identity, curated orphan records and action consistency before the atomic rename. Structural/invalid events preserve the snapshot, upload diagnostics and exit failure. A same-directory temporary file, fsync and rename update the single generated file atomically. Full sync tests, type/build validation, field parity and browser E2E run before a commit. A whitelist prevents unrelated files from entering the generated commit. Only a successful verified commit/push permits deployment.

Missing `FIGMA_TOKEN` fails visibly for both scheduled and manual runs. Full verification also runs on a no-change result. There are no hardcoded tool totals.

## Tests

`npm run test:figma-sync` exercises the 18-case regression matrix, including real CLI subprocesses. Read-only cases hash every sandbox file/directory, check clean Git status and sentinel GitHub files. Acceptance is repeated to prove stable snapshot bytes/mtime and unchanged editorial data. Removals, incomplete rows and unknown vocabulary preserve the snapshot even with acceptance enabled.

Ideas are a separate editorial collection outside frame `374:1308`; their node IDs are embedded directly in the idea records and do not register tool rows.
