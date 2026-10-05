import type { FigmaCaseSnapshot } from './figmaCasesSnapshot.ts';
import { curatedByNodeId } from './curatedTools.ts';
export const FIGMA_FILE_KEY='nVLcu3bbLgz0lJhSUexjvx';
export const FIGMA_FILE_URL=`https://www.figma.com/design/${FIGMA_FILE_KEY}/30-AI-Process-Upgrades`;
export type ActionKind='tool'|'install'|'chat'|'channel'|'guide'|'discussion'|'announcement';
export interface ToolAction { kind:ActionKind; label:string; url:string; primary:boolean }

// Source links always appear. Editorial labels apply only while that exact URL exists.
// Supplemental actions are explicitly product-owned (not a second source URL registry).
export function actionsForSource(source: FigmaCaseSnapshot): ToolAction[] {
  const curated = curatedByNodeId[source.figmaNodeId];
  const overrides = curated?.actionOverrides || [];
  const supplemental = curated?.supplementalActions || [];
  const matched = overrides.filter(action => source.sourceLinks.includes(action.url));
  const actions = [...matched, ...supplemental.filter(action => !matched.some(item => item.url === action.url))];
  for (const url of source.sourceLinks) {
    if (!actions.some(action => action.url === url)) actions.push({kind:'guide',label:`Источник ${actions.length + 1}`,url,primary:false});
  }
  return actions;
}
