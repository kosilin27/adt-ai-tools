export type Role = 'design'|'research'|'text';
export type SourceStatus = 'На проде'|'Тестируется'|'Разработан'|'Разрабатывается';
export type ToolStatus = 'ready'|'beta'|'development';
export type ToolType = 'plugin'|'agent'|'bot'|'service'|'skill'|'workflow'|'unspecified';
import type { ToolAction } from './figmaSource.ts';
import type { FigmaCaseSnapshot } from './figmaCasesSnapshot.ts';
export interface Tool { id:string; figmaNodeId?:string; title:string; shortDescription:string; problem?:string; whenToUse?:string; whatItDoes?:string; audiences:Role[]; categories:string[]; type:ToolType; status:ToolStatus; sourceStatus?:SourceStatus; statusNote?:string; metrics?:{value:string;label:string}[]; impactTags:string[]; howToStart:string[]; authors:string[]; updatedAt:string; createdAt:string; relatedToolIds?:string[]; actions?:ToolAction[]; caseSource?:string; links?:{tool?:string;guide?:string;caseSource?:string}; sourceRecord?:FigmaCaseSnapshot; sourceText?:string[]; sourceLinks?:string[]; sourceSection?:string; sourceAudienceValues?:string[]; sourceStatusValues?:SourceStatus[]; featured?:boolean; editorialState?:'draft'|'curated'; }
