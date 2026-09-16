import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
import { TOOL_NODE_IDS } from '../src/data/figmaSource.ts';
import { diffSnapshots, fetchToolsFrame, formatDiff, parseToolsFrame } from './lib/figma-live.mjs';

const reportJson = 'test-results/figma-sync-diff.json';
const reportMd = 'test-results/figma-sync-diff.md';
const token = process.env.FIGMA_TOKEN;
mkdirSync('test-results', { recursive: true });
const setOutput = (name, value) => process.env.GITHUB_OUTPUT && writeFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`, { flag: 'a' });
if (!token) {
  const manual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
  const message = manual ? 'FIGMA_TOKEN is not configured — manual sync cannot run.' : 'FIGMA_TOKEN is not configured — scheduled sync skipped.';
  setOutput('has_changes', 'false');
  console.log(message);
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, `## Figma sync\n\n${message}\n`);
  process.exit(manual ? 1 : 0);
}
const live = parseToolsFrame(await fetchToolsFrame(token));
const diff = diffSnapshots(FIGMA_CASES_SNAPSHOT, live, TOOL_NODE_IDS);
const hardUnsafe = diff.unsafe.filter(item => !String(item.classification).startsWith('safe-'));
writeFileSync(reportJson, JSON.stringify(diff, null, 2));
writeFileSync(reportMd, formatDiff(diff));
if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, formatDiff(diff));
if (!diff.hasChanges) { setOutput('has_changes', 'false'); console.log('No Figma changes detected.'); process.exit(0); }
if (hardUnsafe.length || process.argv.includes('--check')) {
  if (hardUnsafe.length) console.error(`UNSAFE FIGMA CHANGE: ${hardUnsafe.length}`);
  else console.log(`Figma changes detected: ${diff.changed.length}`);
  process.exit(hardUnsafe.length ? 1 : 0);
}
const source = readFileSync('src/data/figmaCasesSnapshot.ts', 'utf8');
const start = source.indexOf('export const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = [');
const end = source.lastIndexOf('\n];');
if (start < 0 || end < 0) throw new Error('Unable to update Figma snapshot');
const replacement = `export const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = ${JSON.stringify(live, null, 2)};`;
writeFileSync('src/data/figmaCasesSnapshot.ts', source.slice(0, start) + replacement + source.slice(end + 3));
setOutput('has_changes', 'true');
console.log(`Safe Figma changes applied: ${diff.changed.length}`);
