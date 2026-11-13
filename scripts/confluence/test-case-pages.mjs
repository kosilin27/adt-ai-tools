import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {tools} from '../../src/data/tools.ts';
import {agentSkills, agentSections, caseSections, catalogSections, html, metaSections} from './render.mjs';
import {
  caseBody, caseModels, caseReadiness, caseSummary, caseUpdate,
  clean, identity, managedHeading, pendingReadiness, ready, retiredState, section, sectionsIn,
} from './case-pages.mjs';
import {publishCasePages} from './publish-case-pages.mjs';

const registry = JSON.parse(readFileSync(new URL('./pages.json', import.meta.url)));
const models = caseModels(registry);

test('one complete model per active Figma ID, including duplicate source titles', () => {
  assert.equal(models.length, tools.length);
  assert.deepEqual(models.map(model => model.figmaNodeId), tools.map(tool => tool.figmaNodeId));
  assert.equal(new Set(models.map(model => model.figmaNodeId)).size, tools.length);
  assert.equal(new Set(models.map(model => model.title)).size, tools.length);
  for (const model of models) {
    assert.match(model.figmaNodeId, /^\d+:\d+$/);
    assert.ok(model.title.length <= 255);
    assert.ok(model.managed.includes(identity(model.figmaNodeId)));
    for (const heading of ['Source facts', 'Коротко', 'Problem', 'Инструменты и ссылки', 'Source / Provenance']) {
      assert.ok(model.managed.includes(`<h3>${heading}</h3>`), heading);
    }
    assert.equal(model.owner['Agent readiness'], `<p>${pendingReadiness}</p>`);
    for (const heading of ['Когда использовать', 'Когда НЕ использовать', 'Что нужно получить от пользователя',
      'Как использовать', 'Ожидаемый результат', 'Ограничения / prerequisites', 'Примеры запросов',
      'Советы агенту', 'Дополнительная документация владельца', 'Нужно проверить владельцу']) {
      assert.ok(model.owner[heading], heading);
    }
    assert.ok((model.owner['Когда использовать'].match(/<li>/g) || []).length >= 2);
    assert.ok((model.owner['Примеры запросов'].match(/<li>/g) || []).length >= 3);
  }
  const uxf = agentSkills.find(skill => skill.key === 'uxf-bundle');
  const uxfModels = models.filter(model => uxf.nodeIds.includes(model.figmaNodeId));
  assert.equal(uxfModels.length, 2);
  assert.equal(uxfModels[0].sourceTitle, uxfModels[1].sourceTitle);
  assert.notEqual(uxfModels[0].title, uxfModels[1].title);
});

test('placeholders, statuses, links and curated instructions', () => {
  assert.deepEqual(clean(['-', '???', '—', 'Какую проблему решает?', 'Value после запуска', 'Источник']), ['Источник']);
  assert.equal(caseSummary({shortDescription:'-', sourceRecord:{sourceColumns:{problem:['Какую проблему решает', '???']}}}),
    'Нужно заполнить владельцу.');
  for (const [index, tool] of tools.entries()) {
    const {managed} = models[index];
    assert.ok(managed.includes(html(tool.sourceStatusValues.join(' · '))));
    for (const url of new Set([...tool.sourceLinks, ...tool.actions.map(action => action.url)])) {
      assert.ok(managed.includes(`href="${html(url)}"`), url);
    }
  }
  for (const skill of agentSkills) for (const nodeId of skill.nodeIds) {
    const model = models.find(item => item.figmaNodeId === nodeId);
    const url = `/pages/${registry.skills[skill.key]}`;
    assert.ok(model.managed.includes(url), skill.key);
    assert.ok(model.owner['Как использовать'].includes(url), skill.key);
  }
});

test('owner rewrite and readiness survive source changes and retirement', () => {
  const [original] = models;
  const nodeId = original.figmaNodeId;
  const body = caseBody(original).replace(pendingReadiness, ready)
    .replace(original.owner['Когда использовать'], '<p><strong>OWNER_TEST_PRESERVE</strong></p><h3>Уточнение</h3><p>Мой текст</p>');
  const page = {page_id:'99', body};
  assert.deepEqual(caseUpdate(page, nodeId, original), []);
  assert.equal(caseReadiness(page), ready);
  const [updated] = caseModels(registry, [{...tools[0], shortDescription:'Обновлённое описание'}]);
  const operations = caseUpdate(page, nodeId, updated);
  assert.equal(operations.length, 1);
  assert.equal(operations[0].heading, managedHeading);
  const updatedBody = body.replace(original.managed, operations[0].body);
  assert.equal(sectionsIn(updatedBody).get('Когда использовать')[0], sectionsIn(body).get('Когда использовать')[0]);
  assert.equal(caseReadiness({body:updatedBody}), ready);
  assert.deepEqual(caseUpdate({...page, body:updatedBody}, nodeId, updated), []);
  const missingBody = body.replace(section('Примеры запросов', original.owner['Примеры запросов']), '');
  const inserts = caseUpdate({...page, body:missingBody}, nodeId, original);
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].op, 'insert_block');
  assert.match(inserts[0].body, /<h2>Примеры запросов<\/h2>/);
  const retirement = caseUpdate(page, nodeId, null);
  assert.deepEqual(retirement, [{op:'replace_section', heading:'Source state', body:`<p>${retiredState}</p>`}]);
  assert.throws(() => caseUpdate({...page, body:body.replace('<h2>Разделы владельца</h2>', '')}, nodeId, updated), /boundaries/);
  assert.throws(() => caseUpdate(page, '0:1', updated), /identity/);
  const redacted = body.replace(identity(nodeId), 'ADT Figma node ID: {{PII:test:USER_ID:1}}');
  assert.deepEqual(caseUpdate({...page, body:redacted}, nodeId, original), []);
  assert.throws(() => caseUpdate({...page, body:redacted}, '0:1', updated), /identity/);
});

test('registry maps Figma IDs, recovered pages are adopted and repeat sync is a no-op', async () => {
  const store = new Map();
  const workingRegistry = {...registry, casePages:{}};
  let writes = 0;
  const call = async (tool, args) => {
    assert.equal(tool, 'save_page');
    assert.equal(args.parent_page_id, registry.cases);
    const id = String(9000000 + ++writes);
    store.set(id, {page_id:id, title:args.title, body:args.body, version:1, space_key:registry.space});
    return writes === 1 ? `Page created. URL: https://cf.avito.ru/spaces/${registry.space}/pages/${id}` : {page_id:id};
  };
  const read = async id => store.get(id);
  const locate = async (title, parent, relationship) => {
    assert.equal(parent, registry.cases);
    assert.equal(relationship, 'parent');
    return [...store.values()].find(page => page.title === title)?.page_id;
  };
  const run = async apply => {
    const report = [];
    await publishCasePages({registry:workingRegistry, apply, call, read, locate, saveRegistry:()=>{}, report});
    return report;
  };
  assert.equal((await run(false)).filter(row => row.operation === 'would-create').length, tools.length);
  assert.equal(writes, 0);
  assert.equal((await run(true)).filter(row => row.operation === 'created').length, tools.length);
  assert.deepEqual(Object.keys(workingRegistry.casePages), models.map(model => model.figmaNodeId));
  delete workingRegistry.casePages[models[0].figmaNodeId];
  assert.equal((await run(true)).filter(row => row.operation === 'unchanged').length, tools.length);
  assert.equal(writes, tools.length);
  workingRegistry.casePages['human title'] = '123';
  await assert.rejects(run(false), /Invalid or duplicate casePages mapping/);
});

test('one agent discovery entry plus one full human catalog on the case parent', () => {
  const meta = Object.values(metaSections(registry)).join('');
  assert.ok(meta.includes(`ancestor = ${registry.cases}`));
  assert.ok(meta.includes(`ancestor = ${registry.meta}`));
  for (const id of Object.values(registry.skills)) assert.ok(meta.includes(`/pages/${id}`));

  const cases = Object.values(caseSections(registry)).join('');
  const agents = Object.values(agentSections(registry)).join('');
  const catalog = Object.values(catalogSections(registry)).join('');

  assert.ok(cases.includes('<table>'));
  assert.ok(cases.includes('Cmd/Ctrl+F'));
  assert.ok(cases.includes('Страница для агента'));
  assert.equal((cases.match(/Открыть страницу/g) || []).length, tools.length);
  for (const tool of tools) {
    const id = registry.casePages[tool.figmaNodeId];
    assert.ok(id, tool.figmaNodeId);
    assert.ok(cases.includes(`/pages/${id}`), tool.figmaNodeId);
  }
  for (const header of ['Какую проблему решает','Метрики / экономия времени','Value после запуска','Нужна помощь','Связанные кейсы / заметки']) {
    assert.ok(cases.includes(header), header);
  }

  assert.ok(catalog.includes(`/pages/${registry.cases}`));
  assert.ok(catalog.includes(`/pages/${registry.meta}`));
  assert.ok(!catalog.includes('<table>'));
  assert.ok(!agents.includes('<table>'));
  assert.ok(!meta.includes('<table>'));
  for (const id of Object.values(registry.casePages)) {
    assert.ok(!catalog.includes(`/pages/${id}`));
    assert.ok(!agents.includes(`/pages/${id}`));
    assert.ok(!meta.includes(`/pages/${id}`));
  }
});