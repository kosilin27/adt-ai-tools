import { FIGMA_BACKLOG_SNAPSHOT } from './figmaCasesSnapshot.ts';
import { curatedByNodeId } from './curatedTools.ts';
export interface Idea {
  id: string;
  figmaNodeId: string;
  title: string;
  audiences: string[];
  owner?: string;
  sourceStatus?: string;
  sourceStatusValues: string[];
  problem?: string;
  actionUrl?: string;
  description?: string;
  sourceRecord: typeof FIGMA_BACKLOG_SNAPSHOT[number];
  curated: typeof curatedByNodeId[string] | undefined;
}
export const ideas: Idea[] = FIGMA_BACKLOG_SNAPSHOT.map(row=>({
  id:`idea-${row.figmaNodeId.replace(':','-')}`,figmaNodeId:row.figmaNodeId,
  title:row.title,audiences:row.audienceValues,owner:row.authorValues.join(' / '),
  sourceStatusValues:row.sourceStatusValues,sourceStatus:row.sourceStatusValues.join(' · '),
  problem:row.sourceColumns.problem?.join('\n'),description:curatedByNodeId[row.figmaNodeId]?.shortDescription,
  actionUrl:row.sourceLinks[0],sourceRecord:row,curated:curatedByNodeId[row.figmaNodeId],
}));
