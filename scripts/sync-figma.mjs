import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
import { diffSnapshots, fetchToolsFrame, formatDiff, parseToolsFrame } from './lib/figma-live.mjs';
import { mergeTools, validateTools } from '../src/data/tools.ts';
import { writeSnapshotAtomically } from './lib/figma-snapshot.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const acceptNew = args.includes('--accept-new');
const valueFor = flag => {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a path`);
  return value;
};
const framePath = valueFor('--frame-json');
const rowsPath = valueFor('--source-json');
const reportDir = valueFor('--report-dir') || 'test-results';
const allowed = new Set(['--check','--accept-new','--frame-json','--source-json','--report-dir','--json']);
for (let index=0; index<args.length; index++) {
  if (!allowed.has(args[index])) throw new Error(`Unknown argument: ${args[index]}`);
  if (['--frame-json','--source-json','--report-dir'].includes(args[index])) index++;
}
if (framePath && rowsPath) throw new Error('Use only one offline evidence input');
if (check && args.includes('--report-dir')) throw new Error('--check is strictly read-only: capture stdout for a report');
if (process.env.GITHUB_ACTIONS && (framePath || rowsPath || acceptNew)) throw new Error('Scheduled sync must fetch live Figma and must not accept structural additions');
// Read-only checks never create directories, reports, GitHub outputs or summaries.
function report(diff) {
  const markdown = formatDiff(diff);
  if (!check) {
    mkdirSync(reportDir,{recursive:true});
    writeFileSync(resolve(reportDir,'figma-sync-diff.json'),JSON.stringify(diff,null,2)+'\n');
    writeFileSync(resolve(reportDir,'figma-sync-diff.md'),markdown);
    if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY,markdown);
  }
  console.log(args.includes('--json') ? JSON.stringify(diff,null,2) : markdown);
}
function setOutput(changed) {
  if (!check && process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT,`has_changes=${changed}\n`,{flag:'a'});
}
try {
  const excludedRows = [];
  const live = rowsPath ? JSON.parse(readFileSync(rowsPath,'utf8')) : parseToolsFrame(framePath ? JSON.parse(readFileSync(framePath,'utf8')) : await fetchToolsFrame(process.env.FIGMA_TOKEN),{onExcluded:row => excludedRows.push(row)});
  if (!Array.isArray(live)) throw new Error('Source export must be an array of complete source rows');
  const diff = diffSnapshots(FIGMA_CASES_SNAPSHOT,live,{acceptNew});
  diff.excludedRows = excludedRows;
  diff.evidence = framePath ? 'offline frame export' : rowsPath ? 'offline parsed source export (does not prove current live state)' : 'live Figma REST frame';
  if (!diff.unsafe.length) validateTools(mergeTools(live),live);
  report(diff);
  if (diff.unsafe.length) {
    setOutput(false);
    console.error(`UNSAFE FIGMA CHANGE: ${diff.blockedRows} rows, ${diff.guardTriggers} guard triggers`);
    for (const issue of diff.unsafe) console.error(`${issue.nodeId} | ${issue.title} | ${issue.field} | ${JSON.stringify(issue.after ?? '')} | ${issue.reason}`);
    process.exitCode = 1;
  } else if (check) {
    if (!args.includes('--json')) console.log(diff.hasChanges ? 'Valid source changes detected; no files written.' : 'No Figma changes detected; no files written.');
  } else if (!diff.hasChanges) {
    setOutput(false);
    console.log('No Figma changes detected.');
  } else {
    const changed = writeSnapshotAtomically(live);
    setOutput(changed);
    console.log(`Snapshot updated atomically. ${diff.added.length} accepted additions; runtime creates drafts without manual registration.`);
  }
} catch (error) {
  const diff = {changed:[],added:[],removed:[],duplicateIds:[],unsafe:[{nodeId:'374:1308',title:'Authoritative tools frame',field:'fetch/parse',after:String(error.message),reason:String(error.message)}],orderChanged:false,hasChanges:false,blockedRows:1,guardTriggers:1};
  report(diff);
  setOutput(false);
  console.error(error.message);
  process.exitCode = 1;
}
