import { STATUS_LABELS, AUDIENCE_LABELS, SOURCE_COLUMNS, validateSourceRows } from '../../src/data/figmaContract.ts';
export const FIGMA_FILE_KEY = 'nVLcu3bbLgz0lJhSUexjvx';
export const TOOLS_FRAME_NODE_ID = '374:1308';
export const KNOWN_STATUS_LABELS = new Set(STATUS_LABELS);
export const KNOWN_AUDIENCE_LABELS = new Set(AUDIENCE_LABELS);
export const normalizeText = value => String(value ?? '')
  .replaceAll('\r\n', '\n').replace(/[\u2028\u2029]/g, '\n').replaceAll('\u00a0', ' ')
  .replace(/[ \t]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').trim();

export async function fetchToolsFrame(token) {
  if (!token) throw new Error('FIGMA_TOKEN is not configured; use an authoritative --frame-json export for a local audit');
  const response = await fetch(`https://api.figma.com/v1/files/${FIGMA_FILE_KEY}/nodes?ids=${encodeURIComponent(TOOLS_FRAME_NODE_ID)}`, {headers:{'X-Figma-Token':token}});
  if (!response.ok) throw new Error(`Figma API request failed (${response.status})`);
  const frame = (await response.json()).nodes?.[TOOLS_FRAME_NODE_ID]?.document;
  if (!frame) throw new Error(`Figma frame ${TOOLS_FRAME_NODE_ID} was not returned`);
  return frame;
}
function textNodes(node) {
  const result = [];
  function visit(current) {
    if (current.hidden === true || current.visible === false) return;
    if (current.type === 'TEXT' && current.characters) result.push(current);
    for (const child of current.children || []) visit(child);
  }
  visit(node);
  return result;
}
const valuesFrom = node => textNodes(node).flatMap(text => normalizeText(text.characters).split(/\n+/)).filter(Boolean);
export function linksFrom(node) {
  const links = [];
  const add = link => {
    const url = typeof link === 'string' ? link : link?.url || (link?.type === 'URL' ? link.value : null);
    if (url) links.push(url);
  };
  for (const text of textNodes(node)) {
    add(text.style?.hyperlink); add(text.hyperlink);
    const usedStyleIds = new Set((text.characterStyleOverrides || []).map(String));
    for (const [id,style] of Object.entries(text.styleOverrideTable || {})) if (usedStyleIds.has(id)) add(style.hyperlink);
    for (const segment of text.linkSegments || []) add(segment.hyperlink);
    links.push(...(normalizeText(text.characters).match(/https?:\/\/[^\s]+/g) || []));
  }
  return [...new Set(links)];
}
export function visibleDockingBadgeStatuses(row) {
  const cell = (row.children || []).find(node => node.name === '31' && node.visible !== false && !node.hidden);
  if (!cell || row.visible === false || row.hidden) return {values:[],evidence:[]};
  const evidence = [];
  function visit(node) {
    if (node.visible === false || node.hidden) return;
    if (node.type === 'INSTANCE' && node.name === 'DockingBadge') {
      for (const value of valuesFrom(node).filter(value => value !== 'Статус')) evidence.push({nodeId:node.id,value});
      return;
    }
    for (const child of node.children || []) visit(child);
  }
  visit(cell);
  return {values:[...new Set(evidence.map(item => item.value))],evidence};
}
export function parseToolsFrame(frame, {onExcluded} = {}) {
  if (frame.id && frame.id !== TOOLS_FRAME_NODE_ID) throw new Error(`Wrong authoritative frame: ${frame.id}`);
  const rows = [];
  let section = '';
  for (const child of frame.children || []) {
    if (child.visible === false || child.hidden) continue;
    if (child.name !== 'Cell') {
      const heading = textNodes(child).map(text => normalizeText(text.characters)).find(value => value && !/^[-–—]$/.test(value));
      if (heading && child.type !== 'INSTANCE') section = heading;
      continue;
    }
    const sourceColumns = {};
    const parseIssues = [];
    for (const column of child.children || []) {
      const key = SOURCE_COLUMNS[column.name];
      if (!key) { parseIssues.push({field:'columns',value:column.name,reason:'unknown source column layout'}); continue; }
      if (key in sourceColumns) parseIssues.push({field:'columns',value:column.name,reason:'duplicate source column'});
      sourceColumns[key] = valuesFrom(column);
    }
    const project = (child.children || []).find(column => column.name === '33');
    const title = normalizeText(textNodes(project || {children:[]}).find(text => text.name === 'Проект')?.characters || '');
    if (title === 'Проект' && sourceColumns.author?.includes('Кто участвует / роль') && sourceColumns.problem?.includes('Какую проблему решает')) {
      onExcluded?.({nodeId:child.id,title,reason:'explicit table header / unfilled template prompts'});
      continue;
    }
    for (const text of textNodes(child)) {
      if (Object.values(text.styleOverrideTable || {}).some(style => style.hyperlink) && !Array.isArray(text.characterStyleOverrides)) parseIssues.push({field:'sourceLinks',value:text.id,reason:'hyperlink style overrides lack active character ranges'});
    }
    const status = visibleDockingBadgeStatuses(child);
    rows.push({
      figmaNodeId:child.id, caseNumber:sourceColumns.caseNumber?.[0] || '', size:sourceColumns.size?.[0] || '',
      title, sourceText:textNodes(child).map(text => normalizeText(text.characters)).filter(Boolean),
      sourceLinks:linksFrom(child), section:normalizeText(section),
      audienceValues:[...new Set((sourceColumns.audience || []).filter(value => value !== 'Кто участвует / роль'))],
      authorValues:(sourceColumns.author || []).filter(value => !['Кто участвует / роль','Автор / участники'].includes(value)),
      sourceStatusValues:status.values, sourceStatusEvidence:status.evidence, sourceColumns,
      ...(parseIssues.length ? {parseIssues} : {}),
    });
  }
  return rows;
}
export function diffSnapshots(before, after, {acceptNew = false} = {}) {
  const beforeById = new Map(before.map(row => [row.figmaNodeId,row]));
  const afterById = new Map(after.map(row => [row.figmaNodeId,row]));
  const added = after.filter(row => !beforeById.has(row.figmaNodeId));
  const removed = before.filter(row => !afterById.has(row.figmaNodeId));
  const duplicateIds = after.map(row => row.figmaNodeId).filter((id,index,ids) => ids.indexOf(id) !== index);
  const changed = [];
  for (const row of after) {
    const old = beforeById.get(row.figmaNodeId);
    if (!old) continue;
    for (const field of [...new Set([...Object.keys(old),...Object.keys(row)])]) {
      if (field !== 'figmaNodeId' && JSON.stringify(old[field]) !== JSON.stringify(row[field])) changed.push({nodeId:row.figmaNodeId,title:row.title,field,before:old[field],after:row[field],classification:'safe-field-change'});
    }
  }
  const unsafe = validateSourceRows(after).map(issue => ({...issue,after:issue.value,classification:'unsafe-invalid-source'}));
  for (const row of removed) unsafe.push({nodeId:row.figmaNodeId,title:row.title,field:'row',classification:'unsafe-removed-row',reason:'removal requires an explicit human decision; snapshot preserved'});
  if (!acceptNew) for (const row of added) unsafe.push({nodeId:row.figmaNodeId,title:row.title,field:'row',classification:'unsafe-added-row',reason:'accept complete additions with npm run sync:figma -- --accept-new'});
  const orderChanged = JSON.stringify(before.map(row => row.figmaNodeId)) !== JSON.stringify(after.map(row => row.figmaNodeId));
  return {changed,added,removed,duplicateIds,unsafe,orderChanged,hasChanges:Boolean(changed.length || added.length || removed.length || orderChanged || unsafe.length),blockedRows:new Set(unsafe.map(item => item.nodeId)).size,guardTriggers:unsafe.length};
}
export function formatDiff(diff) {
  const escape = value => String(typeof value === 'string' ? value : JSON.stringify(value ?? '')).replaceAll('|','\\|').replaceAll('\n',' ');
  return `# Figma sync\n\nChanged rows: ${new Set(diff.changed.map(item => item.nodeId)).size}\nAdded rows: ${diff.added.length}\nRemoved rows: ${diff.removed.length}\nOrder changed: ${diff.orderChanged ? 'yes' : 'no'}\nBlocked rows: ${diff.blockedRows}\nGuard triggers: ${diff.guardTriggers}\n\n| nodeId | title | field | before | after | reason |\n|---|---|---|---|---|---|\n${[...diff.changed,...diff.unsafe].map(item => `| ${item.nodeId} | ${escape(item.title)} | ${item.field} | ${escape(item.before)} | ${escape(item.after)} | ${escape(item.reason || item.classification)} |`).join('\n')}\n`;
}
