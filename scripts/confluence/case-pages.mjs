import {tools} from '../../src/data/tools.ts';
import {agentSkills, fingerprint, html, link, list, p, sourceLink, status, steps, table} from './render.mjs';

export const readinessHeading = 'Agent readiness';
export const pendingReadiness = 'Требует проверки владельцем';
export const ready = 'Готово для агентов';
export const managedHeading = 'Данные кейса из Figma';
export const stateHeading = 'Source state';
const ownerHeading = 'Разделы владельца';
export const retiredState = 'Кейс больше не находится в active Figma source';
const activeState = 'Кейс находится в active Figma source';
const missing = 'Нужно заполнить владельцу.';
const placeholders = /^(?:[-–—?…\s]+|❇️|какую проблему решает|value (?:после запуска|в конце года)|метрики\s*\/\s*аудитория\s*\/\s*экономия времени|экономия времени|аудитория|метрика успеха|участники|связанные кейсы|позже|tbd|n\/a)\s*[:.?]*$/iu;

export function clean(values = []) {
  return values.map(value => value.trim()).filter(value => value && !placeholders.test(value));
}

function shorten(text, length) {
  return text.length <= length ? text : text.slice(0, length - 1).trimEnd() + '…';
}

const paragraphs = values => (clean(values).length ? clean(values) : [missing])
  .map(value => p(value).replaceAll('\n', '<br />')).join('');
const casePageUrl = (registry, id) => `https://cf.avito.ru/spaces/${registry.space}/pages/${id}`;
const subheading = (heading, body) => `<h3>${html(heading)}</h3>${body}`;
export const section = (heading, body) => `<h2>${html(heading)}</h2>${body}`;
export const identity = id => `ADT Figma node ID: ${id}`;
export const readText = storage => storage.replace(/<[^>]+>/g, '').replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#39;/g, value => ({
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ', '&#39;': "'",
})[value]).trim();

export function caseTitle(tool) {
  const suffix = ` [${tool.figmaNodeId}]`;
  return shorten(tool.title.trim(), 255 - suffix.length) + suffix;
}

export function caseSummary(tool) {
  const [description] = clean([tool.shortDescription]);
  const [problem] = clean(tool.sourceRecord.sourceColumns.problem);
  return description || (problem ? shorten(problem, 320) : missing);
}

function officialInstructions(tool, skills, registry) {
  const curated = skills.filter(skill => registry.skills[skill.key]).map(skill =>
    `<p>${link(casePageUrl(registry, registry.skills[skill.key]), skill.name)}</p>`);
  if (curated.length) return p('Откройте подробную Skill page и следуйте указанной там оригинальной инструкции.') + curated.join('');
  const official = tool.actions.filter(action => ['install', 'tool'].includes(action.kind) || (action.kind === 'guide' && !/^Источник \d+$/u.test(action.label)));
  if (!official.length) {
    return p('Подтверждённая ссылка на оригинальную инструкцию отсутствует. Владельцу нужно дополнить раздел.') +
      (tool.howToStart.length ? p('Подсказки из каталога') + steps(tool.howToStart) : '');
  }
  return official.map(action => `<p>${link(action.url, action.label)}</p>`).join('') +
    steps(['Открыть оригинальную инструкцию или карточку инструмента.', 'Проверить доступ.',
      'Получить необходимые материалы и контекст.', 'Следовать оригинальной инструкции.', 'Вернуть фактический результат.']) +
    (tool.howToStart.length ? p('Подсказки из каталога') + steps(tool.howToStart) : '');
}

function ownerDraft(tool, registry, skills, summary) {
  const row = tool.sourceRecord;
  const name = shorten(tool.title.trim(), 100);
  const subject = `«${name}»`;
  const intents = [tool.whenToUse, ...skills.flatMap(skill => skill.intents)].filter(Boolean).slice(0, 5);
  if (!intents.length) {
    intents.push(summary === missing
      ? `Когда нужно разобраться, какую задачу решает ${subject}.`
      : `Когда задача похожа на описанную в кейсе ${subject}: ${shorten(summary, 160)}`);
  }
  if (intents.length < 2) intents.push(`Когда нужно проверить, подходит ли ${subject} для конкретной задачи.`);
  const examples = skills.flatMap(skill => skill.examples).slice(0, 5);
  for (const example of [
    `Помоги понять, подходит ли мне ${subject}.`,
    `Что нужно подготовить, чтобы воспользоваться ${subject}?`,
    `Подскажи, где найти инструкцию для ${subject}.`,
  ]) if (examples.length < 3) examples.push(example);
  const inputs = {
    plugin: 'Ссылка на файл или рабочий материал для плагина.',
    agent: 'Контекст задачи, исходные материалы и нужный формат ответа.',
    skill: 'Исходные материалы и ссылки, которые требует оригинальная инструкция.',
  }[tool.type] || 'Исходные материалы и ссылки, если они нужны для задачи.';
  const problem = clean(row.sourceColumns.problem);
  const prerequisitesAt = problem.findIndex(line => /^что нужно для использования:/iu.test(line));
  const sourcePrerequisites = prerequisitesAt === -1 ? [] : problem.slice(prerequisitesAt + 1);
  const avoid = ['Запрос выходит за задачу, описанную в кейсе.', 'У пользователя нет необходимых материалов.'];
  if (!row.sourceStatusValues.includes('На проде')) avoid.push('Применение нужно согласовать с владельцем по текущему статусу.');
  if (!tool.actions.some(action => ['install', 'tool'].includes(action.kind))) avoid.push('Запуск требует подтверждённой ссылки на инструмент.');
  return {
    [readinessHeading]: p(pendingReadiness),
    'Когда использовать': list(intents),
    'Когда НЕ использовать': list(avoid),
    'Что нужно получить от пользователя': list(['Задачу, контекст и желаемый результат.', inputs,
      ...new Set([...skills.flatMap(skill => skill.inputs), ...sourcePrerequisites])]),
    'Как использовать': officialInstructions(tool, skills, registry),
    'Ожидаемый результат': p(skills[0]?.output || (tool.shortDescription && summary !== missing
      ? `Ориентир из описания кейса. ${summary} Точный формат результата требуется проверить у владельца.`
      : 'Точный результат и формат нужно подтвердить у владельца.')),
    'Ограничения / prerequisites': list([
      `Статусы в Figma: ${status(row)}.`,
      'Проверить установку, подключение skill или MCP, доступ к материалам и разрешения пользователя.',
    ]),
    'Дополнения владельца к связанным кейсам': p(missing),
    'Примеры запросов': list(examples),
    'Советы агенту': p(missing),
    'Дополнительная документация владельца': p(missing),
    'Нужно проверить владельцу': list([
      'Короткое описание', 'Когда использовать', 'Когда не использовать', 'Входные данные',
      'Пошаговая инструкция', 'Ожидаемый результат', 'Все ссылки', 'Ограничения и доступы',
      'Примеры запросов', 'Контакты владельца',
    ].map(item => `☐ ${item}`)) + p(`После проверки установите Agent readiness → ${ready}.`),
  };
}

export function caseModels(registry, catalog = tools, sourceSyncAt = new Date().toISOString()) {
  return catalog.map(tool => {
    const row = tool.sourceRecord;
    const {figmaNodeId} = row;
    const skills = agentSkills.filter(skill => skill.nodeIds.includes(figmaNodeId));
    const summary = caseSummary(tool);
    const urls = new Map(row.sourceLinks.filter(url => /^https?:\/\//i.test(url)).map(url => [url, url]));
    for (const action of tool.actions) urls.set(action.url, action.label);
    for (const skill of skills) if (registry.skills[skill.key]) {
      urls.set(casePageUrl(registry, registry.skills[skill.key]), `Подробная инструкция · ${skill.name}`);
    }
    const managed = {
      'Source facts': table(['Поле', 'Значение'], [
        ['Название', tool.title], ['Source status', status(row)], ['Size', row.size],
        ['Audience', row.audienceValues.join(' · ')], ['Owner', row.authorValues.join(' · ')],
        ['Type', tool.type], ['Section', row.section], ['Categories', tool.categories.join(' · ')],
      ].map(([key, value]) => [html(key), html(value || missing)])),
      'Коротко': p(summary),
      'Инструменты и ссылки': [...urls].map(([url, label]) => `<p>${link(url, label)}</p>`).join('') +
        `<p>Строка Figma · ${sourceLink(row)}</p>`,
      Problem: paragraphs(row.sourceColumns.problem),
      'Метрики / аудитория / экономия времени': paragraphs(row.sourceColumns.metric),
      'Value после запуска': paragraphs(row.sourceColumns.valueAfterLaunch),
      'Участники / нужна помощь': paragraphs(row.sourceColumns.participants),
      'Связанные кейсы': paragraphs([...row.sourceColumns.related || [], ...row.sourceColumns.notes || []]),
      'Для агента': steps([
        'Сопоставь запрос пользователя с разделом «Когда использовать».',
        'Проверь Agent readiness, Source status и prerequisites.',
        'Если владелец ещё не подтвердил страницу, сообщи об этом.',
        'Получи недостающие входные данные.',
        'При наличии ссылки и доступа используй оригинальный tool, skill или plugin.',
        'Используй только подтверждённые возможности и инструкции.',
        'Сообщай о выполнении только после получения фактического результата инструмента.',
      ]),
      'Владелец и поддержка': paragraphs(row.authorValues) +
        p('Если вы владелец этого кейса — проверьте owner-editable разделы ниже.'),
      'Source / Provenance': p(identity(figmaNodeId)) + `<p>Figma source · ${sourceLink(row)}</p>` +
        p(`Case number: ${row.caseNumber || missing} · Section: ${row.section || missing}`) +
        p(`Source statuses: ${status(row)} · Editorial state: ${tool.editorialState}`) +
        p(`Last source sync · ревизия строки: ${fingerprint(row)}`),
    };
    const stamp = `ADT case source fingerprint: ${fingerprint(managed)}`;
    // The recorded time changes only when this source fingerprint requires a write.
    managed['Source / Provenance'] += p(`Данные опубликованы в Confluence: ${sourceSyncAt}`);
    return {
      figmaNodeId, title: caseTitle(tool), sourceTitle: tool.title, stamp,
      managed: Object.entries(managed).map(([heading, body]) => subheading(heading, body)).join('') + p(stamp),
      owner: ownerDraft(tool, registry, skills, summary),
    };
  });
}

export function caseBody(model) {
  const {[readinessHeading]: readiness, ...owner} = model.owner;
  return `<h1>${html(model.sourceTitle)}</h1>` + section(readinessHeading, readiness) +
    section(stateHeading, p(activeState)) + section(managedHeading, model.managed) +
    section(ownerHeading, '') +
    Object.entries(owner).map(([heading, body]) => section(heading, body)).join('');
}

export function sectionsIn(storage) {
  const headings = [...storage.matchAll(/<h([12])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const sections = new Map();
  for (const [index, match] of headings.entries()) {
    const name = readText(match[2]);
    const values = sections.get(name) || [];
    values.push(storage.slice(match.index + match[0].length, headings[index + 1]?.index));
    sections.set(name, values);
  }
  return sections;
}

export function verifyIdentity(page, figmaNodeId) {
  // The connector may redact part of the prose identifier. The canonical link
  // in provenance retains the Figma file and node ID without that redaction.
  const provenance = [...page.body.matchAll(/<h3\b[^>]*>Source \/ Provenance<\/h3>([\s\S]*?)(?=<h[123]\b|$)/g)];
  const identifiers = [...(provenance[0]?.[1] || '').matchAll(/<p\b[^>]*>ADT Figma node ID: ([^<]+)<\/p>/g)];
  const recorded = identifiers[0]?.[1] || '';
  const canonical = sourceLink({figmaNodeId}).split(">")[0] + ">";
  const validProse = recorded === figmaNodeId || recorded.includes('{{PII:') || /<USER_ID-/.test(recorded);
  if (provenance.length !== 1 || identifiers.length !== 1 || !validProse || !provenance[0][1].includes(canonical)) {
    throw new Error(`Page ${page.page_id} has no unambiguous identity for ${figmaNodeId}`);
  }
}

export function caseUpdate(page, figmaNodeId, model) {
  verifyIdentity(page, figmaNodeId);
  const existing = sectionsIn(page.body);
  const state = model ? activeState : retiredState;
  const operations = [];
  for (const heading of [stateHeading, managedHeading]) {
    if (existing.get(heading)?.length !== 1) throw new Error(`Ambiguous managed section "${heading}" on ${page.page_id}`);
  }
  const headingOrder = [...page.body.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)].map(match => readText(match[1]));
  const stateIndex = headingOrder.indexOf(stateHeading);
  if (headingOrder[stateIndex + 1] !== managedHeading ||
      headingOrder[stateIndex + 2] !== ownerHeading ||
      existing.get(ownerHeading)?.length !== 1) {
    throw new Error(`Managed section boundaries changed on ${page.page_id}`);
  }
  const storedState = readText(existing.get(stateHeading)[0]);
  if (![activeState, retiredState].includes(storedState)) {
    throw new Error(`Unexpected content in Source state on ${page.page_id}`);
  }
  if (storedState !== state) {
    operations.push({op:'replace_section', heading:stateHeading, body:p(state)});
  }
  if (!model) return operations;
  if (!existing.get(managedHeading)[0].includes(model.stamp)) {
    operations.push({op:'replace_section', heading:managedHeading, body:model.managed});
  }
  const missingOwner = Object.entries(model.owner).filter(([heading]) => !existing.has(heading));
  const readiness = missingOwner.find(([heading]) => heading === readinessHeading);
  if (readiness) operations.push({
    op:'insert_block', element:'h2', find:stateHeading, position:'before',
    body:section(...readiness),
  });
  const otherMissing = missingOwner.filter(([heading]) => heading !== readinessHeading);
  if (otherMissing.length) operations.push({
    op:'insert_block', element:'h2', find:ownerHeading, position:'after',
    body:otherMissing.map(([heading, body]) => section(heading, body)).join(''),
  });
  return operations;
}

export function caseReadiness(page) {
  const blocks = sectionsIn(page.body).get(readinessHeading);
  if (blocks?.length !== 1) return pendingReadiness;
  return readText(blocks[0]) === ready ? ready : pendingReadiness;
}
