import {caseBody, caseModels, caseReadiness, caseUpdate, sectionsIn, verifyIdentity} from './case-pages.mjs';

function validateRegistry(registry) {
  const {casePages, skills, ...destinations} = registry;
  const pageIds = new Set([...Object.values(destinations), ...Object.values(skills)].filter(id => /^\d+$/.test(id)));
  for (const [nodeId, pageId] of Object.entries(casePages)) {
    if (!/^\d+:\d+$/.test(nodeId) || typeof pageId !== 'string' || !/^\d+$/.test(pageId) || pageIds.has(pageId)) {
      throw new Error(`Invalid or duplicate casePages mapping: ${nodeId} → ${pageId}`);
    }
    pageIds.add(pageId);
  }
}

function duplicateTitles(models) {
  const titles = Map.groupBy(models, model => model.sourceTitle.trim().toLowerCase());
  return [...titles.values()].filter(group => group.length > 1)
    .map(group => ({title:group[0].sourceTitle, figmaNodeIds:group.map(model => model.figmaNodeId)}));
}

function checkPage(page, registry, figmaNodeId, id) {
  if (!page?.body || !Number.isInteger(page.version) || String(page.page_id) !== id || page.space_key !== registry.space) {
    throw new Error(`Unreadable, unversioned or wrong-space page ${id}`);
  }
  verifyIdentity(page, figmaNodeId);
}

function verifyOwnerContent(before, after, owner) {
  const previous = sectionsIn(before.body);
  const current = sectionsIn(after.body);
  for (const heading of Object.keys(owner)) {
    if (previous.has(heading) && JSON.stringify(previous.get(heading)) !== JSON.stringify(current.get(heading))) {
      throw new Error(`Owner section changed during readback on ${after.page_id}: ${heading}`);
    }
  }
}

export async function publishCasePages({registry, apply, call, read, locate, saveRegistry, report}) {
  validateRegistry(registry);
  const models = caseModels(registry);
  const modelsById = new Map(models.map(model => [model.figmaNodeId, model]));
  if (modelsById.size !== models.length) throw new Error('Duplicate Figma identities');
  const ids = [...new Set([...modelsById.keys(), ...Object.keys(registry.casePages)])];
  const knownPages = new Map(Object.entries(registry.casePages).map(([nodeId, pageId]) => [pageId, nodeId]));
  const readiness = new Map();
  const plans = [];
  report.push({active:models.length, duplicates:duplicateTitles(models),
    removed:ids.filter(id => !modelsById.has(id))});
  for (const figmaNodeId of ids) {
    const model = modelsById.get(figmaNodeId);
    const title = model?.title;
    try {
      const mappedId = registry.casePages[figmaNodeId];
      const pageId = mappedId || await locate(title, registry.cases, 'parent');
      if (!pageId) {
        const entry = {figmaNodeId, title, operation:'would-create', parent:registry.cases};
        plans.push({figmaNodeId, model, entry});
        report.push(entry);
        continue;
      }
      const priorMapping = knownPages.get(pageId);
      if (priorMapping && priorMapping !== figmaNodeId) throw new Error(`Page ${pageId} already maps to ${priorMapping}`);
      const page = await read(pageId);
      checkPage(page, registry, figmaNodeId, pageId);
      knownPages.set(pageId, figmaNodeId);
      const operations = caseUpdate(page, figmaNodeId, model);
      if (operations.length && !apply) {
        await call('edit_page', {page_id:pageId, expected_version:page.version, operations, dry_run:true});
      }
      const entry = {figmaNodeId, title:page.title, pageId, version:page.version,
        retired:!model, operation:operations.length ? 'would-update' : 'unchanged'};
      report.push(entry);
      plans.push({figmaNodeId, model, page, operations, entry});
      readiness.set(figmaNodeId, caseReadiness(page));
    } catch (error) {
      report.push({figmaNodeId, title, error:error.message});
    }
  }
  if (report.some(entry => entry.error)) throw new Error('Case page preflight failed');
  for (const {figmaNodeId, model, page, operations, entry} of plans) {
    if (!page && !apply) continue;
    if (!page) {
      const result = await call('save_page', {title:model.title, parent_page_id:registry.cases, body:caseBody(model)});
      const responseText = typeof result === 'string' ? result : '';
      const responseId = responseText.match(/https:\/\/cf\.avito\.ru\/spaces\/[^/\s]+\/pages\/(\d+)/)?.[1]
        || responseText.match(/\*\*ID:\*\* (\d+)/)?.[1];
      const pageId = String(result?.page_id || result?.id || responseId ||
        await locate(model.title, registry.cases, 'parent') || '');
      if (!/^\d+$/.test(pageId) || knownPages.has(pageId)) {
        throw new Error(`Create response needs reconciliation for ${figmaNodeId}`);
      }
      const verified = await read(pageId);
      checkPage(verified, registry, figmaNodeId, pageId);
      if (verified.version < 1 || caseUpdate(verified, figmaNodeId, model).length) {
        throw new Error(`Create readback mismatch for ${figmaNodeId}: ${pageId}`);
      }
      registry.casePages[figmaNodeId] = pageId;
      knownPages.set(pageId, figmaNodeId);
      saveRegistry();
      Object.assign(entry, {pageId, operation:'created', verifiedVersion:verified.version});
      readiness.set(figmaNodeId, caseReadiness(verified));
      continue;
    }
    registry.casePages[figmaNodeId] = entry.pageId;
    if (apply) saveRegistry();
    if (!apply || !operations.length) continue;
    await call('edit_page', {page_id:entry.pageId, expected_version:page.version, operations});
    const verified = await read(entry.pageId);
    checkPage(verified, registry, figmaNodeId, entry.pageId);
    if (verified.version <= page.version || caseUpdate(verified, figmaNodeId, model).length) {
      throw new Error(`Case readback mismatch: ${entry.pageId}`);
    }
    verifyOwnerContent(page, verified, model?.owner || {'Agent readiness': ''});
    Object.assign(entry, {operation:'updated', verifiedVersion:verified.version});
    readiness.set(figmaNodeId, caseReadiness(verified));
  }
  return readiness;
}
