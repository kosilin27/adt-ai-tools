import assert from 'node:assert/strict';
import { diffSnapshots, parseToolsFrame } from './lib/figma-live.mjs';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
const fixtureFrame = { children: [
  { type: 'FRAME', name: 'Header', children: [{ type: 'TEXT', name: 'Header', characters: 'Проект' }] },
  { type: 'FRAME', name: 'Known section', children: [{ type: 'TEXT', name: 'Section', characters: 'Known section' }] },
  { type: 'INSTANCE', name: 'Cell', id: '1:1', children: [{ type: 'TEXT', name: 'Проект', characters: 'Live title' }] },
] };
assert.deepEqual(parseToolsFrame(fixtureFrame), [{ figmaNodeId: '1:1', title: 'Live title', sourceText: ['Live title'], sourceLinks: [], section: 'Known section' }]);
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
const emptyStatusRow = FIGMA_CASES_SNAPSHOT.find(row => row.figmaNodeId === '3575:11190');
assert.ok(emptyStatusRow, 'Expected the known briefolog source row');
assert.deepEqual(emptyStatusRow.sourceStatusValues, [], 'The known empty Figma status cell must stay explicitly empty');
const safeStatusChange = [{...base[0], sourceStatusValues:['Тестируется']}, base[1]];
assert.equal(diffSnapshots(base, safeStatusChange, ['1:1','2:2']).hasChanges, true, 'Known status changes must trigger sync');
const safeAuthorChange = [{...base[0], authorValues:['Автор']}, base[1]];
assert.equal(diffSnapshots(base, safeAuthorChange, ['1:1','2:2']).hasChanges, true, 'Author changes must trigger sync');
const safeAudienceChange = [{...base[0], audienceValues:['Design']}, base[1]];
assert.equal(diffSnapshots(base, safeAudienceChange, ['1:1','2:2']).hasChanges, true, 'Audience changes must trigger sync');
console.log('FIGMA SYNC FIXTURES: PASS (16 cases)');
