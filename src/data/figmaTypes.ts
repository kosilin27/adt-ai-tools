export interface FigmaCaseSnapshot {
  figmaNodeId: string;
  caseNumber: string;
  size: string;
  title: string;
  sourceText: string[];
  sourceLinks: string[];
  section: string;
  audienceValues: string[];
  authorValues: string[];
  sourceStatusValues: string[];
  sourceStatusEvidence: { nodeId: string; value: string }[];
  sourceColumns: Record<string, string[]>;
  parseIssues?: { field: string; value: unknown; reason: string }[];
}
