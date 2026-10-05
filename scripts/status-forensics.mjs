import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { STATUS_LABELS, validateSourceRows } from '../src/data/figmaContract.ts';
import { fetchToolsFrame, parseToolsFrame } from './lib/figma-live.mjs';
const sourcePath = process.argv[2];
// A complete export is required; a badges-only overlay cannot establish source parity.
const live = sourcePath ? JSON.parse(readFileSync(sourcePath,'utf8')) : parseToolsFrame(await fetchToolsFrame(process.env.FIGMA_TOKEN));
const issues = validateSourceRows(live);
const counts = Object.fromEntries(STATUS_LABELS.map(label => [label,live.filter(row => row.sourceStatusValues.includes(label)).length]));
counts['Без статуса'] = live.filter(row => !row.sourceStatusValues.length).length;
const report = {auditedAt:new Date().toISOString(),evidence:sourcePath ? 'complete source export; verify capture provenance separately' : 'live Figma REST frame',workingRule:'sourceStatusValues.includes("На проде")',rows:live.length,counts,multiStatusRows:live.filter(row => row.sourceStatusValues.length>1).length,issues,rowsData:live};
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/status-forensics.json',JSON.stringify(report,null,2)+'\n');
writeFileSync('test-results/status-forensics.md',`# Source status audit\n\n${Object.entries(counts).map(([label,count]) => `- ${label}: ${count}`).join('\n')}\n\nValidation: ${issues.length ? 'FAIL' : 'PASS'}\n${issues.map(issue => `- ${issue.nodeId}: ${issue.field} = ${JSON.stringify(issue.value)} (${issue.reason})`).join('\n')}\n`);
console.log(JSON.stringify({rows:live.length,counts,multiStatusRows:report.multiStatusRows,issues}));
if(issues.length)process.exitCode=1;
