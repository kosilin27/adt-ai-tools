import assert from 'node:assert/strict';
import { diffSnapshots, parseToolsFrame } from './lib/figma-live.mjs';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
const fixtureFrame = { children: [
  { type: 'FRAME', name: 'Header', children: [{ type: 'TEXT', name: 'Header', characters: 'Проект' }] },
  { type: 'FRAME', name: 'Known section', children: [{ type: 'TEXT', name: 'Section', characters: 'Known section' }] },
  { type: 'INSTANCE', name: 'Cell', id: '1:1', children: [{ type: 'TEXT', name: 'Проект', characters: 'Live title' }, { type: 'FRAME', name: '31', children: [{ type: 'FRAME', name: '2', children: [{ type: 'INSTANCE', name: 'DockingBadge', id: 'badge:1', visible: true, children: [{ type: 'TEXT', characters: 'На проде' }] }] }] }] },
] };
assert.deepEqual(parseToolsFrame(fixtureFrame), [{ figmaNodeId: '1:1', title: 'Live title', sourceText: ['Live title', 'На проде'], sourceLinks: [], section: 'Known section', sourceStatusValues: ['На проде'], sourceStatusEvidence: [{ nodeId: 'badge:1', value: 'На проде' }] }]);
const ambiguousFixture = structuredClone(fixtureFrame);
ambiguousFixture.children[2].children[1].children[0].children.push({ type: 'INSTANCE', name: 'DockingBadge', id: 'badge:2', visible: true, children: [{ type: 'TEXT', characters: 'Тестируется' }] });
const ambiguousRow = parseToolsFrame(ambiguousFixture)[0];
assert.deepEqual(ambiguousRow.sourceStatusValues, ['На проде', 'Тестируется'], 'All visible statuses must be preserved');
assert.equal(ambiguousRow.statusParseError, undefined);
const hiddenFixture = structuredClone(ambiguousFixture);
hiddenFixture.children[2].children[1].children[0].visible = false;
assert.deepEqual(parseToolsFrame(hiddenFixture)[0].sourceStatusValues, [], 'Hidden ancestors suppress all descendant badges');
const binaryFixture = structuredClone(fixtureFrame);
binaryFixture.children[2].children[1].children = [{ type: 'INSTANCE', componentProperties: { Статус: { type: 'VARIANT', value: 'В проде' } } }];
assert.deepEqual(parseToolsFrame(binaryFixture)[0].sourceStatusValues, [], 'Binary variant cannot supply tool status');
const base = [{ figmaNodeId: '1:1', title: 'A', sourceText: ['A'], sourceLinks: [], section: 'Known' }, { figmaNodeId: '2:2', title: 'B', sourceText: ['B'], sourceLinks: [], section: 'Known' }];
const check = (next, expected) => { const diff = diffSnapshots(base, next, ['1:1','2:2']); assert.equal(diff.unsafe.filter(item => !String(item.classification).startsWith('safe-')).length > 0, expected); };
check(base, false);
check([{...base[0], title:'Changed'}, base[1]], false);
check([{...base[0], sourceText:['Changed']}, base[1]], false);
check([{...base[0], sourceLinks:['https://example.com']}, base[1]], false);
check([base[1], base[0]], false);
check([{...base[0], section:'Known 2'}, base[1]], false);
check([...base, {figmaNodeId:'3:3',title:'C',sourceText:['C'],sourceLinks:[],section:'Known'}], true);
check([base[0]], true);
check([base[0], base[0]], true);
check([{...base[0], figmaNodeId:'9:9'}, base[1]], true);
check([{...base[0], sourceStatusValues:['Unknown status']}, base[1]], true);
check([{...base[0], audienceValues:['Unknown audience']}, base[1]], true);
check([{...base[0], ambiguousLinkStructure:true}, base[1]], true);
const selectedStatusRow = FIGMA_CASES_SNAPSHOT.find(row => row.figmaNodeId === '3575:11190');
assert.ok(selectedStatusRow, 'Expected the known briefolog source row');
assert.ok(selectedStatusRow, 'Snapshot row remains available for the contract migration');
const safeStatusChange = [{...base[0], sourceStatusValues:['На проде','Тестируется']}, base[1]];
assert.equal(diffSnapshots(base, safeStatusChange, ['1:1','2:2']).hasChanges, true, 'Known status changes must trigger sync');
const safeAuthorChange = [{...base[0], authorValues:['Автор']}, base[1]];
assert.equal(diffSnapshots(base, safeAuthorChange, ['1:1','2:2']).hasChanges, true, 'Author changes must trigger sync');
const safeAudienceChange = [{...base[0], audienceValues:['Design']}, base[1]];
assert.equal(diffSnapshots(base, safeAudienceChange, ['1:1','2:2']).hasChanges, true, 'Audience changes must trigger sync');
console.log('FIGMA SYNC FIXTURES: PASS');

// Reproduce the saved failure without inventing the missing live row order.
const { readFileSync, mkdtempSync, mkdirSync, cpSync, rmSync } = await import('node:fs');
const { spawnSync } = await import('node:child_process');
const { tmpdir } = await import('node:os');
const { join } = await import('node:path');
const { TOOL_NODE_IDS } = await import('../src/data/figmaSource.ts');
const { tools, validateTools } = await import('../src/data/tools.ts');
const reportPath = 'scripts/fixtures/figma-sync-added-2026-10-04.json';
const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const addedIds = report.added.map(row => row.figmaNodeId);
const previous = FIGMA_CASES_SNAPSHOT.filter(row => !addedIds.includes(row.figmaNodeId));
const reconstructed = [...previous, ...report.added];
const originalDiff = diffSnapshots(previous, reconstructed, TOOL_NODE_IDS.filter(id => !addedIds.includes(id)));
assert.deepEqual(originalDiff.changed, []);
assert.deepEqual(originalDiff.unsafe.filter(item => !item.classification.startsWith('safe-')).map(({nodeId, classification}) => ({nodeId, classification})), report.unsafe.map(({nodeId, classification}) => ({nodeId, classification})));
assert.equal(new Set(originalDiff.unsafe.map(item => item.nodeId)).size, 2);
assert.equal(diffSnapshots(FIGMA_CASES_SNAPSHOT, reconstructed, TOOL_NODE_IDS).unsafe.filter(item => !item.classification.startsWith('safe-')).length, 0);
for (const row of report.added) {
  assert.deepEqual(FIGMA_CASES_SNAPSHOT.find(item => item.figmaNodeId === row.figmaNodeId), row);
  const tool = tools.find(item => item.figmaNodeId === row.figmaNodeId);
  assert.deepEqual(tool.sourceStatusValues, row.sourceStatusValues);
  assert.deepEqual(tool.authors, row.authorValues);
  assert.deepEqual(tool.actions, []);
  assert.deepEqual(tool.sourceLinks, []);
}
assert.throws(() => validateTools([...tools.slice(1), tools[1]]), /Duplicate/);
assert.throws(() => validateTools(tools.slice(1)), /count/);
const statusFixture = structuredClone(fixtureFrame);
statusFixture.children[2].children[1].children[0].children[0].children.push({type:'TEXT', characters:'Новый статус'});
const unknownStatusRow = parseToolsFrame(statusFixture)[0];
assert.ok(unknownStatusRow.sourceStatusValues.includes('Новый статус'));
for (const before of [[], [unknownStatusRow]]) {
  assert.ok(diffSnapshots(before, [unknownStatusRow], ['1:1']).unsafe.some(item => item.classification === 'unsafe-unknown-status'));
}
const structuredFixture = {children:[{id:'3:3',name:'Cell',type:'INSTANCE',children: Array.from({length:13}, (_,i)=>({type:'FRAME',name:i===8?'31':String(i),x:i*100,children:[{type:'TEXT',name:i===2?'Проект':'Text',characters: i===2?'Structured row':i===3?'Design\nUnknown audience':i===8?'На проде\nUnknown status':i===0?'1':'-'}]}))}]};
const structuredRow = parseToolsFrame(structuredFixture)[0];
assert.deepEqual(structuredRow.audienceValues, ['Design','Unknown audience']);
const invalidAdded = diffSnapshots([], [structuredRow], []);
for (const classification of ['unsafe-added-row','unsafe-unknown-row','unsafe-unknown-status','unsafe-unknown-audience']) assert.ok(invalidAdded.unsafe.some(item => item.classification === classification));
structuredFixture.children[0].children[3].children.push({type:'TEXT',characters:'Hidden audience',visible:false});
structuredFixture.children[0].children[8].children.push({type:'TEXT',characters:'Hidden status',visible:false});
assert.deepEqual(parseToolsFrame(structuredFixture)[0], structuredRow);
const headerFixture = structuredClone(structuredFixture);
headerFixture.children.unshift({...structuredClone(headerFixture.children[0]),id:'hidden',visible:false});
headerFixture.children.push({type:'INSTANCE',name:'Cell',id:'header',children:[{type:'TEXT',name:'Проект',characters:'Проект'}]});
assert.equal(parseToolsFrame(headerFixture).length,1);

const existingParsedDiff = diffSnapshots([structuredRow], [structuredRow], ['3:3']);
assert.ok(existingParsedDiff.unsafe.some(item => item.classification === 'unsafe-unknown-audience'));
assert.ok(existingParsedDiff.unsafe.some(item => item.classification === 'unsafe-unknown-status'));
const guards = [
  [[base[0]], 'unsafe-removed-row'],
  [[base[0], base[0]], 'unsafe-duplicate'],
  [[{...base[0],figmaNodeId:'9:9'},base[1]], 'unsafe-unknown-row'],
];
for (const [next,classification] of guards) assert.ok(diffSnapshots(base,next,['1:1','2:2']).unsafe.some(item => item.classification === classification));
assert.ok(diffSnapshots([], [{...base[0],ambiguousLinkStructure:true}], []).unsafe.some(item => item.classification === 'unsafe-ambiguous-link'));
const reordered = diffSnapshots(base,[base[1],base[0]],['1:1','2:2']);
assert.equal(reordered.orderChanged,true);
assert.equal(reordered.guardTriggers,0);

// Actual CLI: report persistence on failure and byte-for-byte --check immutability.
const sandbox = mkdtempSync(join(tmpdir(), 'figma-sync-'));
try {
  for (const dir of ['scripts','src/data']) { mkdirSync(join(sandbox,dir),{recursive:true}); cpSync(dir,join(sandbox,dir),{recursive:true}); }
  cpSync('package.json',join(sandbox,'package.json'));
  const snapshotPath = join(sandbox,'src/data/figmaCasesSnapshot.ts');
  const snapshotSource = readFileSync(snapshotPath,'utf8');
  const cli = () => spawnSync(process.execPath,['--experimental-strip-types','scripts/sync-figma.mjs','--check','--replay-report',reportPath], {cwd:sandbox,encoding:'utf8',env:{...process.env,FIGMA_TOKEN:'',GITHUB_OUTPUT:'',GITHUB_STEP_SUMMARY:''}});
  assert.equal(cli().status,0);
  assert.equal(readFileSync(snapshotPath,'utf8'),snapshotSource);
  const { writeFileSync } = await import('node:fs');
  const changedSource = snapshotSource.replace(report.added[0].title, 'Old approval title');
  writeFileSync(snapshotPath,changedSource);
  const safeCheck = cli();
  assert.equal(safeCheck.status,0,safeCheck.stderr);
  assert.match(safeCheck.stdout,/1 rows, 1 field changes/);
  assert.equal(readFileSync(snapshotPath,'utf8'),changedSource);
  const start = snapshotSource.indexOf('export const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = [');
  const end = snapshotSource.lastIndexOf('\n];');
  const oldSource = snapshotSource.slice(0,start)+'export const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = '+JSON.stringify(previous)+';'+snapshotSource.slice(end+3);
  writeFileSync(snapshotPath,oldSource);
  const registryPath = join(sandbox,'src/data/figmaSource.ts');
  writeFileSync(registryPath,readFileSync(registryPath,'utf8').replace(",'5580:15311','5158:14545'",''));
  const failed = cli();
  assert.equal(failed.status,1,failed.stderr);
  assert.match(failed.stderr,/2 rows, 4 guard triggers/); // original registry and snapshot both lack the new IDs
  for (const row of report.added) { assert.ok(failed.stderr.includes(row.figmaNodeId)); assert.ok(failed.stderr.includes(row.title)); }
  assert.equal(readFileSync(snapshotPath,'utf8'),oldSource);
  assert.equal(JSON.parse(readFileSync(join(sandbox,'test-results/figma-sync-diff.json'),'utf8')).added.length,2);
  assert.match(readFileSync(join(sandbox,'test-results/figma-sync-diff.md'),'utf8'),/Guard triggers: 4/);
} finally { rmSync(sandbox,{recursive:true,force:true}); }
console.log('FIGMA SYNC REGRESSIONS: PASS');
