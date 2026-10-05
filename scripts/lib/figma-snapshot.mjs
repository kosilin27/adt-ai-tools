import { readFileSync, writeFileSync, renameSync, unlinkSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
export const SNAPSHOT_PATH = 'src/data/figmaCasesSnapshot.ts';
export function renderSnapshot(rows) {
  return `// GENERATED from Figma ${'nVLcu3bbLgz0lJhSUexjvx'} / ${'374:1308'}. Edit with sync:figma only.\nimport type { FigmaCaseSnapshot } from './figmaTypes.ts';\nexport type { FigmaCaseSnapshot } from './figmaTypes.ts';\nexport const FIGMA_CASES_SNAPSHOT: FigmaCaseSnapshot[] = ${JSON.stringify(rows,null,2)};\n`;
}
// Exactly one generated file: all validation precedes an atomic same-directory rename.
export function writeSnapshotAtomically(rows, path = SNAPSHOT_PATH) {
  const candidate = renderSnapshot(rows);
  if (readFileSync(path,'utf8') === candidate) return false;
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary,candidate,{flag:'wx'});
    const fd = openSync(temporary,'r');
    try { fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temporary,path);
  } finally {
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return true;
}
