import type { FigmaCaseSnapshot } from './figmaCasesSnapshot.ts';

export const STATUS_LABELS = ['На проде', 'Тестируется', 'Разработан', 'Разрабатывается'];
export const AUDIENCE_LABELS = ['Design', 'Research', 'Text'];
export const SOURCE_COLUMNS: Record<string, string> = {
  '19':'caseNumber', '38':'size', '33':'project', '32':'audience', '35':'link',
  '20':'problem', '34':'metric', '30':'author', '31':'status',
  '29':'valueAfterLaunch', '28':'participants', '36':'related', '37':'notes',
};
export interface SourceIssue { nodeId: string; title: string; field: string; value: unknown; reason: string }
export function validateSourceRows(rows: FigmaCaseSnapshot[]): SourceIssue[] {
  const issues: SourceIssue[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const add = (field: string, value: unknown, reason: string) => issues.push({nodeId:row.figmaNodeId || '',title:row.title || '',field,value,reason});
    if (!/^\d+:\d+$/.test(row.figmaNodeId || '')) add('figmaNodeId',row.figmaNodeId,'invalid node identity');
    if (seen.has(row.figmaNodeId)) add('figmaNodeId',row.figmaNodeId,'duplicate node identity');
    seen.add(row.figmaNodeId);
    for (const field of ['title','section'] as const) if (typeof row[field] !== 'string' || !row[field].trim()) add(field,row[field],'required nonempty source field');
    for (const field of ['caseNumber','size'] as const) if (typeof row[field] !== 'string') add(field,row[field],'missing source field');
    for (const field of ['sourceText','sourceLinks','audienceValues','authorValues','sourceStatusValues'] as const) {
      if (!Array.isArray(row[field]) || row[field].some(value => typeof value !== 'string')) add(field,row[field],'required string array (empty must be explicit)');
    }
    if (!row.audienceValues?.length) add('audienceValues',row.audienceValues,'at least one source audience is required');
    for (const value of row.audienceValues || []) if (!AUDIENCE_LABELS.includes(value)) add('audienceValues',value,'unknown audience');
    for (const value of row.sourceStatusValues || []) if (!STATUS_LABELS.includes(value)) add('sourceStatusValues',value,'unknown status');
    for (const value of row.sourceLinks || []) {
      try { if (/\s/.test(value)) throw new Error(); const url = new URL(value); if (!['https:','http:'].includes(url.protocol)) throw new Error(); }
      catch { add('sourceLinks',value,'invalid source URL'); }
    }
    for (const key of Object.values(SOURCE_COLUMNS)) if (!Array.isArray(row.sourceColumns?.[key])) add('sourceColumns.'+key,row.sourceColumns?.[key],'missing source column');
    if (!Array.isArray(row.sourceStatusEvidence)) add('sourceStatusEvidence',row.sourceStatusEvidence,'missing visible badge evidence');
    else {
      const evidenceValues = [...new Set(row.sourceStatusEvidence.map(item => item.value))];
      if (JSON.stringify(evidenceValues) !== JSON.stringify(row.sourceStatusValues)) add('sourceStatusEvidence',row.sourceStatusEvidence,'statuses must come only from visible DockingBadge evidence');
    }
    for (const issue of row.parseIssues || []) add(issue.field,issue.value,issue.reason);
  }
  if (!rows.length) issues.push({nodeId:'',title:'',field:'rows',value:[],reason:'authoritative frame is empty'});
  return issues;
}
