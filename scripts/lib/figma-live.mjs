export const FIGMA_FILE_KEY = 'nVLcu3bbLgz0lJhSUexjvx';
export const TOOLS_FRAME_NODE_ID = '374:1308';
export const KNOWN_STATUS_LABELS = new Set(['На проде', 'Тестируется', 'Разработан', 'Разрабатывается']);
export const KNOWN_AUDIENCE_LABELS = new Set(['Design', 'Research', 'Text']);
const SOURCE_COLUMN_NAMES = ['caseNumber', 'size', 'project', 'audience', 'link', 'problem', 'metric', 'author', 'status', 'valueAfterLaunch', 'participants', 'related', 'notes'];
const API_ROOT = 'https://api.figma.com/v1';

export const normalizeText = value => String(value ?? '')
  .replaceAll('\r\n', '\n').replace(/[\u2028\u2029]/g, '\n').replaceAll('\u00a0', ' ')
  .replace(/[ \t]+/g, ' ').replace(/[ \t]*\n[ \t]*/g, '\n').trim();

async function figmaRequest(path, token) {
  if (!token) throw new Error('FIGMA_TOKEN is not configured');
  const response = await fetch(API_ROOT + path, { headers: { 'X-Figma-Token': token } });
  if (!response.ok) throw new Error(`Figma API ${response.status}: ${await response.text()}`);
  return response.json();
}

export async function fetchToolsFrame(token) {
  const encoded = encodeURIComponent(TOOLS_FRAME_NODE_ID);
  const payload = await figmaRequest(`/files/${FIGMA_FILE_KEY}/nodes?ids=${encoded}`, token);
  const frame = payload.nodes?.[TOOLS_FRAME_NODE_ID]?.document;
  if (!frame) throw new Error(`Figma frame ${TOOLS_FRAME_NODE_ID} was not returned`);
  return frame;
}

function walk(node, visit) {
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}

function textNodes(node, inheritedHidden = false) {
  const result = [];
  const visit = (current, hidden) => {
    const currentHidden = hidden || current.hidden === true || current.visible === false;
    if (!currentHidden && current.type === 'TEXT' && current.characters) result.push(current);
    for (const child of current.children || []) visit(child, currentHidden);
  };
  visit(node, inheritedHidden);
  return result;
}

function linksFrom(node) {
  const links = [];
  for (const text of textNodes(node)) {
    const hyperlink = text.style?.hyperlink || text.hyperlink;
    if (typeof hyperlink === 'string') links.push({ label: normalizeText(text.characters), url: hyperlink });
    if (hyperlink?.url) links.push({ label: normalizeText(text.characters), url: hyperlink.url });
  }
  return [...new Map(links.map(link => [link.url, link])).values()];
}

function directText(node, name) {
  return textNodes(node).find(text => text.name === name || text.name?.toLowerCase() === name.toLowerCase());
}

function namedNode(node, name) {
  if (node.name === name) return node;
  for (const child of node.children || []) { const found = namedNode(child, name); if (found) return found; }
  return null;
}

function nodeX(node, fallback) {
  return typeof node.x === 'number' ? node.x : typeof node.absoluteBoundingBox?.x === 'number' ? node.absoluteBoundingBox.x : fallback;
}

function directColumnNodes(row) {
  const children = (row.children || []).filter(child => textNodes(child).length || linksFrom(child).length);
  return children.map((child, index) => ({ child, index, x: nodeX(child, index) })).sort((a, b) => a.x - b.x).map(item => item.child);
}

function splitSourceValues(values) {
  return values.flatMap(value => normalizeText(value).split(/\n+/).map(normalizeText)).filter(Boolean);
}

function parseStructuredColumns(row) {
  const columns = directColumnNodes(row);
  if (columns.length < 4) return null;
  const sourceColumns = {};
  columns.forEach((column, index) => {
    const key = SOURCE_COLUMN_NAMES[index] || `column${index + 1}`;
    sourceColumns[key] = splitSourceValues(textNodes(column).map(text => text.characters));
  });
  const audienceValues = [...new Set((sourceColumns.audience || []).filter(value => KNOWN_AUDIENCE_LABELS.has(value)))];
  const sourceStatusValues = columns.length > 8
    ? [...new Set((sourceColumns.status || []).filter(value => KNOWN_STATUS_LABELS.has(value)))]
    : undefined;
  const authorValues = (sourceColumns.author || []).filter(value => value !== 'Кто участвует / роль' && value !== 'Автор / участники');
  return { sourceColumns, audienceValues, ...(sourceStatusValues === undefined ? {} : { sourceStatusValues }), authorValues };
}

export function parseToolsFrame(frame) {
  const rows = [];
  let section = '';
  for (const child of frame.children || []) {
    const direct = textNodes(child);
    if (child.name !== 'Cell') {
      const heading = direct.map(text => normalizeText(text.characters)).find(value => value && !/^[-–—]$/.test(value));
      if (heading && child.type !== 'INSTANCE') section = heading;
      continue;
    }
    const text = direct.map(item => normalizeText(item.characters)).filter(Boolean);
    const title = directText(child, 'Проект')?.characters?.trim();
    if (title === 'Проект') continue;
    if (!title) throw new Error(`Unable to parse title for row ${child.id}`);
    const structured = parseStructuredColumns(child);
    rows.push({
      figmaNodeId: child.id,
      ...(structured ? { caseNumber: structured.sourceColumns.caseNumber?.[0] || '', size: structured.sourceColumns.size?.[0] || '' } : {}),
      title: normalizeText(title),
      sourceText: text,
      sourceLinks: linksFrom(child).map(link => link.url),
      section: normalizeText(section),
      ...(structured || {}),
    });
  }
  if (!rows.length) throw new Error('No tool rows parsed from authoritative frame');
  return rows;
}

export function diffSnapshots(before, after, expectedIds) {
  const beforeById = new Map(before.map(row => [row.figmaNodeId, row]));
  const afterById = new Map(after.map(row => [row.figmaNodeId, row]));
  const duplicateIds = after.map(row => row.figmaNodeId).filter((id, index, ids) => ids.indexOf(id) !== index);
  const added = after.filter(row => !beforeById.has(row.figmaNodeId));
  const removed = before.filter(row => !afterById.has(row.figmaNodeId));
  const changed = [];
  const unsafe = [];
  for (const row of after) {
    const old = beforeById.get(row.figmaNodeId);
    if (!old) continue;
    for (const field of ['title', 'sourceText', 'sourceLinks', 'section', 'audienceValues', 'authorValues', 'sourceStatusValues', 'sourceColumns']) {
      if (JSON.stringify(old[field]) !== JSON.stringify(row[field])) changed.push({ nodeId: row.figmaNodeId, field, before: old[field], after: row[field], classification: field === 'sourceLinks' ? 'safe-link-change' : 'safe' });
    }
    if (JSON.stringify(old.authorValues || []) !== JSON.stringify(row.authorValues || [])) changed.push({ nodeId: row.figmaNodeId, field: 'authors', before: old.authorValues || [], after: row.authorValues || [], classification: 'safe-author-change' });
    for (const value of row.sourceStatusValues || []) if (!KNOWN_STATUS_LABELS.has(value) && value !== 'Статус') unsafe.push({ nodeId: row.figmaNodeId, field: 'sourceStatus', before: '', after: value, classification: 'unsafe-unknown-status' });
    for (const value of row.audienceValues || []) if (!KNOWN_AUDIENCE_LABELS.has(value) && value !== 'Кто участвует / роль') unsafe.push({ nodeId: row.figmaNodeId, field: 'audience', before: '', after: value, classification: 'unsafe-unknown-audience' });
    if (row.ambiguousLinkStructure) unsafe.push({ nodeId: row.figmaNodeId, field: 'links', classification: 'unsafe-ambiguous-link' });
  }
  const expected = new Set(expectedIds);
  if (duplicateIds.length) unsafe.push(...duplicateIds.map(nodeId => ({ nodeId, field: 'figmaNodeId', classification: 'unsafe-duplicate' })));
  if (added.length) unsafe.push(...added.map(row => ({ nodeId: row.figmaNodeId, field: 'row', classification: 'unsafe-added-row' })));
  if (removed.length) unsafe.push(...removed.map(row => ({ nodeId: row.figmaNodeId, field: 'row', classification: 'unsafe-removed-row' })));
  for (const row of after) if (!expected.has(row.figmaNodeId)) unsafe.push({ nodeId: row.figmaNodeId, field: 'figmaNodeId', classification: 'unsafe-unknown-row' });
  const orderChanged = before.map(row => row.figmaNodeId).join('|') !== after.map(row => row.figmaNodeId).join('|');
  if (orderChanged && !added.length && !removed.length) unsafe.push({ nodeId: '', field: 'row-order', classification: 'safe-order-change' });
  const structuralChanges = changed.length > 0 || added.length > 0 || removed.length > 0 || duplicateIds.length > 0 || orderChanged || unsafe.some(item => !String(item.classification).startsWith('safe-'));
  return { changed, added, removed, duplicateIds, unsafe, orderChanged, hasChanges: structuralChanges };
}

export function formatDiff(diff) {
  const rows = [...diff.changed, ...diff.unsafe];
  return `# Figma sync\n\nChanged rows: ${new Set(diff.changed.map(item => item.nodeId)).size}\nAdded rows: ${diff.added.length}\nRemoved rows: ${diff.removed.length}\nOrder changed: ${diff.orderChanged ? 'yes' : 'no'}\nUnsafe changes: ${diff.unsafe.filter(item => !String(item.classification).startsWith('safe-')).length}\n\n| nodeId | field | before | after | classification |\n|---|---|---|---|---|\n${rows.map(item => `| ${item.nodeId} | ${item.field} | ${JSON.stringify(item.before ?? '')} | ${JSON.stringify(item.after ?? '')} | ${item.classification} |`).join('\n')}`;
}
