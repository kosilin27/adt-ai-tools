import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { tools, validateTools } from '../src/data/tools.ts';
import { curatedByNodeId } from '../src/data/curatedTools.ts';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';
import { validateSourceRows } from '../src/data/figmaContract.ts';

validateTools();
assert.deepEqual(validateSourceRows(FIGMA_CASES_SNAPSHOT),[]);
const rows = FIGMA_CASES_SNAPSHOT.map((source,index) => {
  const tool = tools[index];
  const fields = {
    identity:tool.figmaNodeId === source.figmaNodeId,
    title:tool.title === source.title,
    sourceRecord:JSON.stringify(tool.sourceRecord) === JSON.stringify(source),
    text:JSON.stringify(tool.sourceText) === JSON.stringify(source.sourceText),
    links:JSON.stringify(tool.sourceLinks) === JSON.stringify(source.sourceLinks) && source.sourceLinks.every(url => tool.actions.some(action => action.url === url)),
    authors:JSON.stringify(tool.authors) === JSON.stringify(source.authorValues),
    audiences:JSON.stringify(tool.audiences) === JSON.stringify(source.audienceValues.map(value => value.toLowerCase())),
    statuses:JSON.stringify(tool.sourceStatusValues) === JSON.stringify(source.sourceStatusValues),
    section:tool.sourceSection === source.section,
    curated:Object.entries(curatedByNodeId[source.figmaNodeId] || {}).filter(([key]) => !['actionOverrides','supplementalActions'].includes(key)).every(([key,value]) => JSON.stringify(tool[key]) === JSON.stringify(value)),
  };
  return {figmaNodeId:source.figmaNodeId,title:source.title,fields,overall:Object.values(fields).every(Boolean)};
});
const checks = {sourceRows:rows.length,catalogRows:tools.length,passed:rows.filter(row => row.overall).length,fieldParityErrors:rows.filter(row => !row.overall).length,drafts:tools.filter(tool => tool.editorialState === 'draft').length,sourceLinks:FIGMA_CASES_SNAPSHOT.reduce((count,row) => count+row.sourceLinks.length,0)};
mkdirSync('test-results',{recursive:true});
writeFileSync('test-results/figma-parity.json',JSON.stringify({checks,rows},null,2)+'\n');
writeFileSync('test-results/figma-parity.md',`# Figma parity\n\n${Object.entries(checks).map(([key,value]) => `- ${key}: ${value}`).join('\n')}\n\n| nodeId | title | result |\n|---|---|---|\n${rows.map(row => `| ${row.figmaNodeId} | ${row.title.replaceAll('|','\\|').replaceAll('\n',' ')} | ${row.overall ? 'PASS' : 'FAIL'} |`).join('\n')}\n`);
console.log(JSON.stringify(checks));
assert.equal(checks.fieldParityErrors,0,'Full source-to-catalog field parity failed');
console.log('PARITY: PASS');
