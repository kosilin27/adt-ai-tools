import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
import { TOOL_NODE_IDS } from '../src/data/figmaSource.ts';
import { diffSnapshots, fetchToolsFrame, formatDiff, parseToolsFrame } from './lib/figma-live.mjs';

const reportJson = 'test-results/figma-sync-diff.json';
const reportMd = 'test-results/figma-sync-diff.md';
const token = process.env.FIGMA_TOKEN;
const replayIndex = process.argv.indexOf('--replay-report');
const replayPath = replayIndex >= 0 ? process.argv[replayIndex + 1] : null;
if (replayIndex >= 0 && !replayPath) throw new Error('--replay-report requires a JSON report path');
if (replayPath && !process.argv.includes('--check')) throw new Error('Report replay requires --check (live order is unavailable)');
mkdirSync('test-results', { recursive: true });
const setOutput = (name, value) => process.env.GITHUB_OUTPUT && writeFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, { flag: 'a' });
if (!token && !replayPath) {
  const manual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  const message = manual ? 'FIGMA_TOKEN is not configured — manual sync cannot run.' : 'FIGMA_TOKEN is not configured — scheduled sync skipped.';
  setOutput('has_changes', 'false');
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `## Figma sync\n\n${message}\n`);
  process.exit(manual ? 1 : 0);
}
let live;
if (replayPath) {
  const report = JSON.parse(readFileSync(replayPath, 'utf8'));
  if (report.changed.length || report.removed.length || report.duplicateIds.length) throw new Error('Replay supports addition-only reports');
  const addedById = new Map(report.added.map(row => [row.figmaNodeId, row]));
  live = [...FIGMA_CASES_SNAPSHOT.map(row => addedById.get(row.figmaNodeId) || row), ...report.added.filter(row => !FIGMA_CASES_SNAPSHOT.some(old => old.figmaNodeId === row.figmaNodeId))];
  console.log('Report replay: baseline order plus additions; exact live order is unavailable.');
} else live = parseToolsFrame(await fetchToolsFrame(token));
const diff = diffSnapshots(FIGMA_CASES_SNAPSHOT, live, TOOL_NODE_IDS);
const hardUnsafe = diff.unsafe.filter(item => !String(item.classification).startsWith('safe-'));
writeFileSync(reportJson, JSON.stringify(diff, null, 2));
writeFileSync(reportMd, formatDiff(diff));
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, formatDiff(diff));
if (!diff.hasChanges) { setOutput('has_changes', 'false'); console.log('No Figma changes detected.'); process.exit(0); }
if (hardUnsafe.length || process.argv.includes('--check')) {
  if (hardUnsafe.length) {
    console.error(`UNSAFE FIGMA CHANGE: ${new Set(hardUnsafe.map(item => item.nodeId)).size} rows, ${hardUnsafe.length} guard triggers`);
    for (const item of hardUnsafe) console.error(`${item.nodeId} | ${item.title} | ${item.classification}${item.after ? ': ' + JSON.stringify(item.after) : ''}`);
  }
  else console.log(`Figma changes detected: ${new Set(diff.changed.map(item => item.nodeId)).size} rows, ${diff.changed.length} field changes`);
  process.exit(hardUnsafe.length ? 1 : 0);
}
const source = readFileSync('src/data/figmaCasesSnapshot.ts', 'utf8');
const start = source.indexOf('export const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = [');
const end = source.lastIndexOf('\n];');
if (start < 0 || end < 0) throw new Error('Unable to update Figma snapshot');
const replacement = `export const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = ${JSON.stringify(live, null, 2)};`;
writeFileSync('src/data/figmaCasesSnapshot.ts', source.slice(0, start) + replacement + source.slice(end + 3));
setOutput('has_changes', 'true');
console.log(`Safe Figma changes applied: ${new Set(diff.changed.map(item => item.nodeId)).size} rows, ${diff.changed.length} field changes`);
