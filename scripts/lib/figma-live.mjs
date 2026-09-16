export const FIGMA_FILE_KEY = 'nVLcu3bbLgz0lJhSUexjvx';
export const TOOLS_FRAME_NODE_ID = '374:1308';
export const KNOWN_STATUS_LABELS = new Set(['На проде', 'Тестируется', 'Разработан', 'Разрабатывается']);
export const KNOWN_AUDIENCE_LABELS = new Set(['Design', 'Research', 'Text']);
const API_ROOT = 'https://api.figma.com/v1';

export const normalizeText = value => String(value ?? '')
  .replaceAll('\r\n', '\n').replaceAll('\u00a0', ' ')
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

function textNodes(node) {
  const result = [];
  walk(node, child => { if (child.type === 'TEXT' && child.characters) result.push(child); });
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

export function parseToolsFrame(frame) {
  const rows = [];
  let section = '';
  for (const child of frame.children || []) {
    const direct = textNodes(child);
    if (child.type !== 'INSTANCE' || child.name !== 'Cell') {
      const heading = direct.map(text => normalizeText(text.characters)).find(value => value && !/^[-–—]$/.test(value));
      if (heading && child.type !== 'INSTANCE') section = heading;
      continue;
    }
    const text = direct.map(item => normalizeText(item.characters)).filter(Boolean);
    const title = directText(child, 'Проект')?.characters?.trim();
    if (title === 'Проект') continue;
    if (!title) throw new Error(`Unable to parse title for row ${child.id}`);
    const statusNode = namedNode(child, '31');
    const audienceNode = namedNode(child, '32');
    rows.push({
      figmaNodeId: child.id,
      title: normalizeText(title),
      sourceText: text,
      sourceLinks: linksFrom(child).map(link => link.url),
      ...(statusNode ? { sourceStatusValues: textNodes(statusNode).map(item => normalizeText(item.characters)).filter(Boolean) } : {}),
      ...(audienceNode ? { audienceValues: textNodes(audienceNode).map(item => normalizeText(item.characters)).filter(Boolean) } : {}),
      section: normalizeText(section),
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
    for (const field of ['title', 'sourceText', 'sourceLinks', 'section']) {
      if (JSON.stringify(old[field]) !== JSON.stringify(row[field])) changed.push({ nodeId: row.figmaNodeId, field, before: old[field], after: row[field], classification: field === 'sourceLinks' ? 'safe-link-change' : 'safe' });
    }
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
  return { changed, added, removed, duplicateIds, unsafe, orderChanged, hasChanges: changed.length > 0 || added.length > 0 || removed.length > 0 || duplicateIds.length > 0 || orderChanged };
}

export function formatDiff(diff) {
  const rows = [...diff.changed, ...diff.unsafe];
  return `# Figma sync\n\nChanged rows: ${new Set(diff.changed.map(item => item.nodeId)).size}\nAdded rows: ${diff.added.length}\nRemoved rows: ${diff.removed.length}\nOrder changed: ${diff.orderChanged ? 'yes' : 'no'}\nUnsafe changes: ${diff.unsafe.filter(item => !String(item.classification).startsWith('safe-')).length}\n\n| nodeId | field | before | after | classification |\n|---|---|---|---|---|\n${rows.map(item => `| ${item.nodeId} | ${item.field} | ${JSON.stringify(item.before ?? '')} | ${JSON.stringify(item.after ?? '')} | ${item.classification} |`).join('\n')}`;
}
