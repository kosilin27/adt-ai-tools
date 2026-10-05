import { FIGMA_FILE_URL, actionsForSource } from './figmaSource.ts';
import { FIGMA_CASES_SNAPSHOT, type FigmaCaseSnapshot } from './figmaCasesSnapshot.ts';
import { curatedByNodeId } from './curatedTools.ts';
import { validateSourceRows } from './figmaContract.ts';
import type { Tool, Role, SourceStatus } from './toolTypes.ts';
export type { Tool, Role, SourceStatus, ToolStatus, ToolType } from './toolTypes.ts';

export function mergeTools(rows: FigmaCaseSnapshot[]): Tool[] {
  const errors = validateSourceRows(rows);
  if (errors.length) throw new Error(JSON.stringify(errors));
  return rows.map(sourceRecord => {
    const figmaNodeId = sourceRecord.figmaNodeId;
    const curated = curatedByNodeId[figmaNodeId];
    const {actionOverrides: _overrides, supplementalActions: _supplemental, ...metadata} = curated || {};
    const statuses = sourceRecord.sourceStatusValues as SourceStatus[];
    return {
      id: `figma-${figmaNodeId.replace(':', '-')}`,
      shortDescription: '', categories: [], type: 'unspecified', status: 'development',
      impactTags: [], howToStart: [], createdAt: '', updatedAt: '',
      ...metadata,
      editorialState: curated ? 'curated' : 'draft',
      figmaNodeId, title: sourceRecord.title,
      audiences: sourceRecord.audienceValues.map(value => value.toLowerCase()) as Role[],
      authors: sourceRecord.authorValues,
      sourceStatus: statuses.includes('На проде') ? 'На проде' : statuses[0],
      sourceStatusValues: statuses, sourceAudienceValues: sourceRecord.audienceValues,
      sourceText: sourceRecord.sourceText, sourceLinks: sourceRecord.sourceLinks,
      sourceSection: sourceRecord.section, sourceRecord,
      actions: actionsForSource(sourceRecord),
      caseSource: FIGMA_FILE_URL + '?node-id=' + figmaNodeId.replace(':', '-'),
    };
  });
}
export const tools: Tool[] = mergeTools(FIGMA_CASES_SNAPSHOT);
export function validateTools(dataset: Tool[] = tools, sourceRows: FigmaCaseSnapshot[] = FIGMA_CASES_SNAPSHOT) {
  const expected = sourceRows.map(row => row.figmaNodeId);
  const ids = dataset.map(tool => tool.figmaNodeId);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate Figma node ID');
  if (new Set(dataset.map(tool => tool.id)).size !== dataset.length) throw new Error('Duplicate catalog route ID');
  if (ids.length !== expected.length || expected.some(id => !ids.includes(id))) throw new Error('Catalog ID set does not match snapshot');
  for (const id of Object.keys(curatedByNodeId)) if (!expected.includes(id)) throw new Error('Orphan curated metadata: ' + id);
  for (const tool of dataset) {
    const source = sourceRows.find(row => row.figmaNodeId === tool.figmaNodeId)!;
    if (tool.title !== source.title) throw new Error('Title mismatch: ' + tool.figmaNodeId);
    if ((tool.actions || []).filter(action => action.primary).length > 1) throw new Error('Multiple primary actions: ' + tool.figmaNodeId);
    for (const action of tool.actions || []) {
      if (!/^https?:\/\//.test(action.url)) throw new Error('Invalid action URL: ' + tool.figmaNodeId);
      if (action.primary && !['tool','install','chat','channel'].includes(action.kind)) throw new Error('Invalid primary action: ' + tool.figmaNodeId);
    }
  }
  return true;
}
validateTools();
