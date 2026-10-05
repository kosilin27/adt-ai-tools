# Reviewing new Figma cases

An addition is deliberately blocked until it has been reviewed in all three places:

1. Register the stable Figma Node ID in `src/data/figmaSource.ts` (`TOOL_NODE_IDS`).
2. Copy the complete reviewed `report.added` record into `FIGMA_CASES_SNAPSHOT` in `src/data/figmaCasesSnapshot.ts`, preserving literal statuses, visible evidence, authors and source links.
3. Add a card to `extraTools` in `src/data/tools.ts` with an explicit Node ID. Add source actions only when a real source URL exists. Never fabricate metrics or authors.
4. Run `npm run test:figma-sync`, `npm run build`, `npm run verify:figma-parity`, and `npx playwright test`. Counts come from the registered source; do not change a hardcoded total.

Registry, snapshot and catalog must have unique, equal sets of IDs. Unreviewed additions, removals, duplicate live IDs and unknown IDs remain blockers. Unknown visible statuses and audiences also block, including on new rows. Ordinary field updates and row reordering remain safe.

The CLI writes `test-results/figma-sync-diff.json` and `.md` before rejecting unsafe changes. Diagnostics distinguish blocked rows from guard triggers and show Node ID, title and reason. `--check` never writes the snapshot.

## Offline fixture

`scripts/fixtures/figma-sync-added-2026-10-04.json` is the saved report from run 37223045376, artifact 11310927384, commit 3cf700e79fa96a262ea485e5dac3b698f93825c3. It contains two additions, no changed existing fields, no removals and no duplicates. The regression suite reconstructs the prior baseline and checks the original two affected rows / four guard triggers, then checks the reviewed dataset.

```sh
npm run sync:figma -- --check --replay-report scripts/fixtures/figma-sync-added-2026-10-04.json
```

Replay is read-only and supports addition-only reports. It overlays the report additions on baseline records and appends missing additions. The report does not contain the complete live row order: this reconstruction does not verify live ordering. New snapshot records are appended without reordering existing records. With `FIGMA_TOKEN` configured, `npm run check:figma-live` checks the actual live data and order read-only.
