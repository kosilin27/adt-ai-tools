import { diffSnapshots } from './figma-live.mjs';
// Membership is held only by the two arrays in the same atomic generated source.
export function diffSourceSets(before, after, {acceptNew = false, acceptMoves = false} = {}) {
  const diff = diffSnapshots([...before.cases,...before.backlog],[...after.cases,...after.backlog],{acceptNew});
  const oldLocation = new Map([...before.cases.map(r=>[r.figmaNodeId,'cases']),...before.backlog.map(r=>[r.figmaNodeId,'backlog'])]);
  diff.moves = [...after.cases.map(r=>[r,'cases']),...after.backlog.map(r=>[r,'backlog'])].flatMap(([row,to])=>{
    const from=oldLocation.get(row.figmaNodeId);
    return from && from!==to ? [{nodeId:row.figmaNodeId,title:row.title,from,to}] : [];
  });
  if (!acceptMoves) for (const move of diff.moves) diff.unsafe.push({...move,field:'membership',reason:'frame move requires reviewed --accept-moves; source preserved',classification:'unsafe-moved-row'});
  diff.counts = {cases:after.cases.length,backlog:after.backlog.length,working:after.cases.filter(r=>r.sourceStatusValues.includes('На проде')).length};
  diff.blockedRows = new Set(diff.unsafe.map(r=>r.nodeId)).size;
  diff.guardTriggers = diff.unsafe.length;
  diff.hasChanges ||= Boolean(diff.moves.length);
  return diff;
}
