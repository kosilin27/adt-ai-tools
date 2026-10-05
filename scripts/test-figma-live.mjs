import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffSnapshots, parseToolsFrame, linksFrom } from './lib/figma-live.mjs';
import { SOURCE_COLUMNS, validateSourceRows } from '../src/data/figmaContract.ts';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
import { mergeTools } from '../src/data/tools.ts';
import { renderSnapshot } from './lib/figma-snapshot.mjs';

const text = (characters,name='Text',extra={}) => ({type:'TEXT',name,characters,...extra});
const badge = (value,id='badge:1',extra={}) => ({type:'INSTANCE',id,name:'DockingBadge',children:[text(value)],...extra});
function cell(id,title='A') {
  return {type:'INSTANCE',name:'Cell',id,children:Object.entries(SOURCE_COLUMNS).map(([name,key]) => ({type:'FRAME',name,children:key==='status' ? [badge('На проде')] : [text(({caseNumber:'1',size:'M',project:title,audience:'Design',author:'Author'})[key] || '',key==='project' ? 'Проект' : 'Text')]}))};
}
const frame = {id:'374:1308',children:[{type:'FRAME',name:'Section',children:[text('Known section')]},cell('1:1'),cell('2:2','B')]};
const base = parseToolsFrame(frame);
assert.deepEqual(validateSourceRows(base),[]);
const results = [];
function test(name,fn) { fn(); results.push({name,result:'PASS'}); }
function safe(next) { const diff=diffSnapshots(base,next); assert.deepEqual(diff.unsafe,[]); return diff; }
function blocked(next,reason,acceptNew=false) { const diff=diffSnapshots(base,next,{acceptNew});assert.ok(diff.unsafe.some(issue => String(issue.reason).includes(reason)),JSON.stringify(diff));return diff; }
const change = (field,value) => [{...base[0],[field]:value},base[1]];

test('1. no changes',() => assert.equal(safe(base).hasChanges,false));
test('2. title change',() => assert.ok(safe(change('title','Changed')).changed.some(item => item.field==='title')));
test('3. link change',() => {assert.ok(safe(change('sourceLinks',['https://example.com/new'])).changed.some(item => item.field==='sourceLinks'));const source={...FIGMA_CASES_SNAPSHOT[0],sourceLinks:['https://example.com/new']};const tool=mergeTools([source])[0];assert.deepEqual(tool.actions.map(action=>action.url),source.sourceLinks,'Stale URL-specific actions must disappear when source URL changes');});
test('4. author change including explicit empty',() => { assert.equal(safe(change('authorValues',['New author'])).hasChanges,true);safe(change('authorValues',[])); });
test('5. multiple links and hyperlink formats',() => {
  const fixture=structuredClone(frame);
  fixture.children[1].children.find(n=>n.name==='35').children=[text('Two links','Text',{hyperlink:{type:'URL',value:'https://example.com/one'},linkSegments:[{hyperlink:{type:'URL',value:'https://example.com/two'}}],characterStyleOverrides:[1],styleOverrideTable:{1:{hyperlink:{url:'https://example.com/three'}},2:{hyperlink:{url:'https://example.com/unused'}}}})];
  assert.deepEqual(parseToolsFrame(fixture)[0].sourceLinks,['https://example.com/one','https://example.com/three','https://example.com/two']);
  assert.deepEqual(linksFrom(text('https://example.com/plain')),['https://example.com/plain']);
  blocked(change('sourceLinks',['https://example.com/a https://example.com/b']),'invalid source URL');
});
test('6. multiple visible statuses',() => {
  const fixture=structuredClone(frame);fixture.children[1].children.find(n=>n.name==='31').children.push(badge('Тестируется','badge:2'));
  assert.deepEqual(parseToolsFrame(fixture)[0].sourceStatusValues,['На проде','Тестируется']);safe(parseToolsFrame(fixture));
});
test('7. hidden badges and hidden ancestor ignored; component property ignored',() => {
  const fixture=structuredClone(frame);const status=fixture.children[1].children.find(n=>n.name==='31');
  status.children.push(badge('Unknown hidden','badge:2',{visible:false}),{type:'FRAME',visible:false,children:[badge('Unknown nested')]},{type:'INSTANCE',name:'Emotional Rubricator',componentProperties:{Статус:{value:'На проде'}}});
  assert.deepEqual(parseToolsFrame(fixture),base);
});
test('8. explicit empty status',() => {
  const fixture=structuredClone(frame);fixture.children[1].children.find(n=>n.name==='31').children=[];
  const rows=parseToolsFrame(fixture);assert.deepEqual(rows[0].sourceStatusValues,[]);assert.deepEqual(rows[0].sourceStatusEvidence,[]);safe(rows);
});
const newRow={...structuredClone(base[0]),figmaNodeId:'3:3',title:'New complete row'};
test('9. new complete row has exactly one acceptance path',() => {
  blocked([...base,newRow],'accept complete additions');assert.deepEqual(diffSnapshots(base,[...base,newRow],{acceptNew:true}).unsafe,[]);
  const original=JSON.parse(readFileSync('scripts/fixtures/figma-sync-added-2026-10-04.json','utf8'));const addedIds=new Set(original.added.map(row=>row.figmaNodeId));const previous=FIGMA_CASES_SNAPSHOT.filter(row=>!addedIds.has(row.figmaNodeId));assert.equal(diffSnapshots(previous,FIGMA_CASES_SNAPSHOT).added.length,addedIds.size);assert.deepEqual(diffSnapshots(previous,FIGMA_CASES_SNAPSHOT,{acceptNew:true}).unsafe,[]);
});
test('10. new incomplete row cannot be accepted',() => {
  const projectNamed=structuredClone(frame);projectNamed.children[1].children.find(n=>n.name==='33').children=[text('Проект','Проект')];assert.equal(parseToolsFrame(projectNamed).length,base.length,'A real row named Проект must not disappear');
  const missingTitle=structuredClone(frame);missingTitle.children[1].children.find(n=>n.name==='33').children=[];blocked(parseToolsFrame(missingTitle),'required nonempty source field',true);
  for(const field of ['title','audienceValues','authorValues','sourceStatusValues','sourceColumns','sourceStatusEvidence']) {
    const incomplete={...newRow};delete incomplete[field];assert.ok(diffSnapshots(base,[...base,incomplete],{acceptNew:true}).unsafe.length,field);
  }
});
test('11. removed row stays blocked even with --accept-new',() => blocked([base[0]],'removal requires',true));
test('12. moved row / section change',() => assert.equal(safe(change('section','Another section')).hasChanges,true));
test('13. unknown audience includes identity title field and unknown value',() => {
  const issue=blocked(change('audienceValues',['Unknown audience']),'unknown audience').unsafe[0];
  assert.equal(issue.nodeId,'1:1');assert.equal(issue.title,'A');assert.equal(issue.field,'audienceValues');assert.equal(issue.after,'Unknown audience');
});
test('14. unknown visible status fails closed on existing and new rows',() => {
  const fixture=structuredClone(frame);fixture.children[1].children.find(n=>n.name==='31').children.push(badge('Unknown status','badge:2'));
  blocked(parseToolsFrame(fixture),'unknown status');blocked([...base,{...newRow,sourceStatusValues:['Unknown status']}],'unknown status',true);
});
test('15. duplicate figmaNodeId',() => blocked([base[0],base[0]],'duplicate node identity',true));
test('16. reordered rows and reordered / empty columns never remap identity or fields',() => {
  const reordered=safe([base[1],base[0]]);assert.equal(reordered.orderChanged,true);
  const fixture=structuredClone(frame);fixture.children[1].children.reverse();const parsed=parseToolsFrame(fixture);for(const field of ['figmaNodeId','title','audienceValues','authorValues','sourceStatusValues','sourceColumns']) assert.deepEqual(parsed[0][field],base[0][field]);
  const malformed=structuredClone(frame);malformed.children[1].children=malformed.children[1].children.filter(n=>n.name!=='31');blocked(parseToolsFrame(malformed),'missing source column');
  const unexpected=structuredClone(frame);unexpected.children[1].children.push({name:'FutureColumn',type:'FRAME',children:[]});blocked(parseToolsFrame(unexpected),'unknown source column');
});

function digestTree(root) {
  const entries=[];
  function walk(path,relative='') {
    for(const name of readdirSync(path).sort()) {
      if(name==='.git')continue;
      const full=join(path,name);const rel=join(relative,name);const stat=statSync(full);
      if(stat.isDirectory()){entries.push([rel,'directory']);walk(full,rel);}
      else entries.push([rel,createHash('sha256').update(readFileSync(full)).digest('hex')]);
    }
  }
  walk(root);return JSON.stringify(entries);
}
const sandbox=mkdtempSync(join(tmpdir(),'adt-figma-sync-'));
try {
  for(const directory of ['scripts','src/data']) {mkdirSync(join(sandbox,directory),{recursive:true});cpSync(directory,join(sandbox,directory),{recursive:true});}
  cpSync('package.json',join(sandbox,'package.json'));
  const curatedPath=join(sandbox,'src/data/curatedTools.ts');
  writeFileSync(curatedPath,readFileSync(curatedPath,'utf8').split('export const curatedByNodeId:')[0]+'export const curatedByNodeId: Record<string, CuratedTool> = {};\n');
  const snapshotPath=join(sandbox,'src/data/figmaCasesSnapshot.ts');
  const inputPath=join(sandbox,'source-input.json');
  const outputPath=join(sandbox,'github-output.txt');const summaryPath=join(sandbox,'github-summary.txt');
  writeFileSync(outputPath,'sentinel-output');writeFileSync(summaryPath,'sentinel-summary');
  const cli=(...args)=>spawnSync(process.execPath,['--experimental-strip-types','scripts/sync-figma.mjs',...args],{cwd:sandbox,encoding:'utf8',env:{...process.env,FIGMA_TOKEN:'',GITHUB_ACTIONS:'',GITHUB_OUTPUT:outputPath,GITHUB_STEP_SUMMARY:summaryPath}});
  const git=(...args)=>spawnSync('git',args,{cwd:sandbox,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}});
  writeFileSync(snapshotPath,renderSnapshot(base));writeFileSync(inputPath,JSON.stringify(base));
  git('init');git('add','.');const commit=git('-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','-m','Read-only baseline');assert.equal(commit.status,0,commit.stderr);
  test('17. repeated --check hashes every file and directory, keeps clean Git tree and GitHub sentinels',() => {
    for(const [rows,expected] of [[base,0],[change('title','Changed'),0],[[...base,newRow],1],[[base[0]],1],[change('audienceValues',['Unknown']),1]]) {
      writeFileSync(inputPath,JSON.stringify(rows));git('add','source-input.json');git('-c','user.name=Fixture','-c','user.email=fixture@example.com','commit','--allow-empty','-m','Input');
      const before=digestTree(sandbox);
      for(let n=0;n<3;n++){const result=cli('--check','--source-json',inputPath);assert.equal(result.status,expected,result.stderr);assert.equal(digestTree(sandbox),before);assert.equal(git('status','--porcelain').stdout,'');}
    }
    const before=digestTree(sandbox);const missingToken=cli('--check');assert.equal(missingToken.status,1);assert.match(missingToken.stderr,/FIGMA_TOKEN/);assert.equal(digestTree(sandbox),before);
    assert.equal(existsSync(join(sandbox,'test-results')),false);
  });
  test('18. repeated --accept-new is idempotent and changes only one generated file',() => {
    writeFileSync(inputPath,JSON.stringify([...base,newRow]));
    const curatedBefore=readFileSync(join(sandbox,'src/data/curatedTools.ts'),'utf8');
    const accepted=cli('--accept-new','--source-json',inputPath);assert.equal(accepted.status,0,accepted.stderr);
    const runtime=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',"import {tools} from './src/data/tools.ts';console.log(JSON.stringify(tools));"],{cwd:sandbox,encoding:'utf8'});assert.equal(runtime.status,0,runtime.stderr);const dataset=JSON.parse(runtime.stdout);assert.equal(dataset.length,base.length+1);const draft=dataset.find(tool=>tool.figmaNodeId===newRow.figmaNodeId);assert.equal(draft.id,'figma-3-3');assert.equal(draft.editorialState,'draft');assert.equal(draft.shortDescription,'');assert.equal(draft.type,'unspecified');assert.deepEqual(draft.authors,newRow.authorValues);assert.deepEqual(draft.sourceStatusValues,newRow.sourceStatusValues);
    const bytes=readFileSync(snapshotPath,'utf8');const modifiedAt=statSync(snapshotPath).mtimeMs;
    const repeat=cli('--accept-new','--source-json',inputPath);assert.equal(repeat.status,0,repeat.stderr);assert.match(repeat.stdout,/No Figma changes/);
    assert.equal(readFileSync(snapshotPath,'utf8'),bytes);assert.equal(statSync(snapshotPath).mtimeMs,modifiedAt);assert.equal(readFileSync(join(sandbox,'src/data/curatedTools.ts'),'utf8'),curatedBefore);
    writeFileSync(inputPath,JSON.stringify([base[0],newRow]));const removal=cli('--accept-new','--source-json',inputPath);assert.equal(removal.status,1);assert.equal(readFileSync(snapshotPath,'utf8'),bytes);
    const report=JSON.parse(readFileSync(join(sandbox,'test-results/figma-sync-diff.json')));assert.equal(report.removed[0].figmaNodeId,'2:2');assert.match(readFileSync(join(sandbox,'test-results/figma-sync-diff.md'),'utf8'),/2:2/);
    writeFileSync(inputPath,JSON.stringify([...base,{...newRow,title:''}]));const incomplete=cli('--accept-new','--source-json',inputPath);assert.equal(incomplete.status,1);assert.equal(readFileSync(snapshotPath,'utf8'),bytes);
    const scheduled=spawnSync(process.execPath,['--experimental-strip-types','scripts/sync-figma.mjs','--accept-new','--source-json',inputPath],{cwd:sandbox,encoding:'utf8',env:{...process.env,GITHUB_ACTIONS:'true'}});assert.equal(scheduled.status,1);assert.equal(readFileSync(snapshotPath,'utf8'),bytes);
  });
} finally {rmSync(sandbox,{recursive:true,force:true});}
assert.deepEqual(validateSourceRows(FIGMA_CASES_SNAPSHOT),[],'Committed generated source must satisfy the contract');
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/figma-regression-matrix.json',JSON.stringify(results,null,2)+'\n');
console.log(results.map(result=>`${result.name}: ${result.result}`).join('\n'));
console.log(`FIGMA SYNC REGRESSION MATRIX: ${results.length}/${results.length} PASS`);
