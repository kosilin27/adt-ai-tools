import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tools } from '../src/data/tools.ts';
import { TOOL_NODE_IDS, IDEA_NODE_IDS, ACTIONS_BY_NODE_ID } from '../src/data/figmaSource.ts';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot.ts';

const expected = new Set(TOOL_NODE_IDS);
const actual = new Set(tools.map(tool => tool.figmaNodeId));
const statusFromSource = values => values.includes('Разрабатывается') || values.includes('В разработке') ? 'development' : values.includes('Тестируется') ? 'beta' : values.includes('На проде') || values.includes('Разработан') ? 'ready' : null;
const rows = FIGMA_CASES_SNAPSHOT.map(source => {
  const tool = tools.find(item => item.figmaNodeId === source.figmaNodeId);
  const sourceActions = ACTIONS_BY_NODE_ID[source.figmaNodeId] || [];
  const catalogActions = tool?.actions || [];
  const titleMatch = tool?.title === source.title;
  const linksMatch = JSON.stringify(catalogActions) === JSON.stringify(sourceActions);
  const audienceMatch = source.audienceValues === undefined || JSON.stringify(tool?.audiences || []) === JSON.stringify([...new Set(source.audienceValues.map(value => value.toLowerCase()).filter(value => ['design', 'research', 'text'].includes(value)))])
  const authorMatch = source.authorValues === undefined || JSON.stringify(tool?.authors || []) === JSON.stringify(source.authorValues || [])
  const statusMatch = source.sourceStatusValues === undefined || source.sourceStatusValues.length === 0 || tool?.status === statusFromSource(source.sourceStatusValues || [])
  return {
    figmaNodeId: source.figmaNodeId,
    figmaTitle: source.title,
    catalogTitle: tool?.title || '',
    titleMatch,
    linksMatch,
    statusMatch,
    authorsMatch: authorMatch,
    audienceMatch,
    overall: Boolean(tool && titleMatch && linksMatch && statusMatch && authorMatch && audienceMatch),
  };
});
const primary = tools.flatMap(tool => tool.actions || []).filter(action => action.primary);
const guideOnly = tools.filter(tool => (tool.actions || []).length > 0 && (tool.actions || []).every(action => !action.primary && action.kind === 'guide')).length;
const announcementOnly = tools.filter(tool => (tool.actions || []).length > 0 && (tool.actions || []).every(action => !action.primary && action.kind === 'announcement')).length;
const sourceMismatch = tools.filter(tool => JSON.stringify(tool.actions || []) !== JSON.stringify(ACTIONS_BY_NODE_ID[tool.figmaNodeId || ''] || [])).length;
const fallbackMappings = /fallback|fallbackIds|fallbackIndex/i.test(readFileSync(new URL('../src/data/tools.ts', import.meta.url), 'utf8')) ? 1 : 0;
const checks = {
  'FIGMA ROWS': `${FIGMA_CASES_SNAPSHOT.length} / 86`,
  'EXACT TITLE MATCH': `${rows.filter(row => row.titleMatch).length} / 86`,
  'EXPLICIT NODE MAPPING': `${[...expected].filter(id => actual.has(id)).length} / 86`,
  'SOURCE LINK MATCH': `${rows.filter(row => row.linksMatch).length} / 86`,
  'SOURCE STATUS MATCH': `${rows.filter(row => row.statusMatch).length} / 86`,
  'SOURCE AUTHORS MATCH': `${rows.filter(row => row.authorsMatch).length} / 86`,
  'SOURCE AUDIENCE MATCH': `${rows.filter(row => row.audienceMatch).length} / 86`,
  'ORPHAN CATALOG TOOLS': tools.filter(tool => !expected.has(tool.figmaNodeId || '')).length,
  'ORPHAN FIGMA ROWS': TOOL_NODE_IDS.filter(id => !actual.has(id)).length,
  'FALLBACK MAPPINGS': fallbackMappings,
  'FIELD PARITY ERRORS': rows.filter(row => !row.overall).length + sourceMismatch,
  'PRIMARY ACTIONS': primary.length,
  'GUIDE-ONLY TOOLS': guideOnly,
  'ANNOUNCEMENT-ONLY TOOLS': announcementOnly,
  'IDEAS': IDEA_NODE_IDS.length,
};
const failed = Object.entries(checks).filter(([key, value]) => {
  if (key === 'FIGMA ROWS' || key === 'EXACT TITLE MATCH' || key === 'EXPLICIT NODE MAPPING' || key === 'SOURCE LINK MATCH' || key === 'SOURCE STATUS MATCH' || key === 'SOURCE AUTHORS MATCH' || key === 'SOURCE AUDIENCE MATCH') return value !== '86 / 86';
  return ['ORPHAN CATALOG TOOLS','ORPHAN FIGMA ROWS','FALLBACK MAPPINGS','FIELD PARITY ERRORS'].includes(key) ? value !== 0 : false;
});
mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/figma-parity.json', JSON.stringify({ checks, rows }, null, 2));
writeFileSync('test-results/figma-parity.md', `# Figma parity\n\n${Object.entries(checks).map(([key, value]) => `- ${key}: ${value}`).join('\n')}\n\n| figmaNodeId | Figma title | Catalog title | title | links | status | authors | overall |\n|---|---|---|---:|---:|---:|---:|---:|\n${rows.map(row => `| ${row.figmaNodeId} | ${row.figmaTitle.replaceAll('|', '\\|')} | ${row.catalogTitle.replaceAll('|', '\\|')} | ${row.titleMatch ? 'PASS' : 'FAIL'} | ${row.linksMatch ? 'PASS' : 'FAIL'} | ${row.statusMatch ? 'PASS' : 'FAIL'} | ${row.authorsMatch ? 'PASS' : 'FAIL'} | ${row.overall ? 'PASS' : 'FAIL'} |`).join('\n')}\n`);
for (const [key, value] of Object.entries(checks)) console.log(`${key}: ${value}`);
if (failed.length) { console.error(`PARITY FAIL: ${failed.map(([key]) => key).join(', ')}`); process.exit(1); }
console.log('PARITY: PASS');
