import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
import { fetchToolsFrame, parseToolsFrame } from './lib/figma-live.mjs';

const evidencePath = process.argv[2];
let live;
if (evidencePath) {
  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
  const byId = new Map(evidence.map(row => [row.id, row]));
  if (evidence.length !== FIGMA_CASES_SNAPSHOT.length || FIGMA_CASES_SNAPSHOT.some(row => !byId.has(row.figmaNodeId))) throw new Error('Live evidence IDs differ from snapshot');
  live = FIGMA_CASES_SNAPSHOT.map(row => ({ ...row,
    sourceStatusValues: [...new Set(byId.get(row.figmaNodeId).badges.map(badge => badge.value))],
    sourceStatusEvidence: byId.get(row.figmaNodeId).badges,
  }));
} else {
  if (!process.env.FIGMA_TOKEN) throw new Error('FIGMA_TOKEN or a live MCP evidence file is required');
  live = parseToolsFrame(await fetchToolsFrame(process.env.FIGMA_TOKEN));
}
const labels = ['На проде', 'Тестируется', 'Разработан', 'Разрабатывается'];
const counts = Object.fromEntries(labels.map(label => [label, live.filter(row => row.sourceStatusValues.includes(label)).length]));
counts['Без статуса'] = live.filter(row => !row.sourceStatusValues.length).length;
const report = { auditedAt: new Date().toISOString(), source: 'effectively visible DockingBadge text', workingRule: 'sourceStatusValues.includes("На проде")', multiStatusAllowed: true, rows: live.length, counts, multiStatusRows: live.filter(row => row.sourceStatusValues.length > 1).length, rowsData: live };
mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/status-forensics.json', JSON.stringify(report, null, 2) + '\n');
writeFileSync('test-results/status-forensics.md', '# Live status audit\n\nWorking = at least one visible DockingBadge with На проде. Multi-status is allowed; badge counts overlap.\n\n' + Object.entries(counts).map(([label, count]) => '- ' + label + ': ' + count).join('\n') + '\n\n| node | title | statuses | working |\n|---|---|---|---|\n' + live.map(row => '| ' + row.figmaNodeId + ' | ' + row.title.replaceAll('|', '/') + ' | ' + row.sourceStatusValues.join(', ') + ' | ' + row.sourceStatusValues.includes('На проде') + ' |').join('\n') + '\n');
console.log(JSON.stringify({ rows: live.length, counts, multiStatusRows: report.multiStatusRows }));
