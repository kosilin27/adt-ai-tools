import {createHash} from 'node:crypto';
import {tools} from '../../src/data/tools.ts';
import {FIGMA_BACKLOG_SNAPSHOT} from '../../src/data/figmaCasesSnapshot.ts';
import {agentSkills} from '../../src/data/agentSkills.ts';
export const html = value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const p=t=>`<p>${html(t)}</p>`;
export const link=(url,label)=>`<a href="${html(url)}">${html(label)}</a>`;
export const list=items=>`<ul>${items.map(t=>`<li>${html(t)}</li>`).join('')}</ul>`;
export const steps=items=>`<ol>${items.map(t=>`<li>${html(t)}</li>`).join('')}</ol>`;
export const table=(headers,rows)=>`<table><tbody><tr>${headers.map(t=>`<th>${html(t)}</th>`).join('')}</tr>${rows.map(row=>`<tr>${row.map(t=>`<td>${t}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export const sourceLink=row=>link(`https://www.figma.com/design/nVLcu3bbLgz0lJhSUexjvx/30-AI-Process-Upgrades?node-id=${row.figmaNodeId.replace(':','-')}`,row.figmaNodeId);
export const status=row=>row.sourceStatusValues.length?row.sourceStatusValues.join(' · '):'Не указан в источнике';
export const fingerprint=sections=>createHash('sha256').update(JSON.stringify(sections)).digest('hex');
export const marker=hash=>p(`ADT sync fingerprint: ${hash}`);
const literal=values=>html((values||[]).join('\n')).replaceAll('\n','<br />');
export const pageUrl = (registry, id) => `https://cf.avito.ru/spaces/${registry.space}/pages/${id}`;
export const discoveryLink = registry => link(pageUrl(registry, registry.meta), 'AI Skills for Agents — единый вход для агента');

export function caseSections(registry) {
 return {
  'Страницы кейсов':p(`Дочерние страницы этой папки содержат отдельные карточки кейсов. В активном снимке Figma: ${tools.length}. Идентификатор кейса — figmaNodeId.`)+
   `<p>Для поиска инструмента по задаче открой ${discoveryLink(registry)}.</p>`,
 };
}

export function catalogSections(registry) {
 return {
  'Готовые инструменты и плагины':`<p>Витрина для сотрудников: ${link('https://prototype-hosting.k.avito.ru/prototype/adt-ai-tools-5stb3/5/index.html','AI Tools')}. Резервная витрина: ${link('https://artifact.avito.ru/share/O3vtJD5CMQh7QIwJUgwzGg/index.html','Artifact')}. Исходный код: ${link('https://github.com/kosilin27/adt-ai-tools','GitHub')}.</p>`,
  'Поиск и подключение':`<p>Поиск возможностей для агента: ${discoveryLink(registry)}. Подключение инструментов: ${link(pageUrl(registry, registry.setup),'Настроить себе AI')}. ${link(pageUrl(registry,'1020052017'),'Предложить кейс')}.</p>`,
 };
}

export function agentSections(registry) {
 return {
  'Где искать агентские инструменты':p('Историческая страница раздела. Предыдущие списки доступны в истории версий.')+
   `<p>Актуальный поиск по задаче: ${discoveryLink(registry)}.</p>`,
 };
}

export function skillSections(skill){
 const rows=skill.nodeIds.map(id=>{const t=tools.find(t=>t.figmaNodeId===id);if(!t)throw new Error(`Skill ${skill.key}: missing source ${id}`);return t.sourceRecord;});
 return {
 'What this skill does':p(skill.outcome),
 'Use this skill when':list(skill.intents),
 'Do not use when':list(skill.avoid),
 Inputs:list(skill.inputs),Output:p(skill.output),
 'How to use':steps(skill.steps)+p('Эта страница помогает выбрать capability. Для исполнения загрузить актуальную оригинальную инструкцию; наличие ссылки не подтверждает установку или доступ. Не сообщать об исполнении без результата инструмента.'),
 'Tools / Links':list([])+[...new Set([...rows.flatMap(r=>r.sourceLinks),...(skill.references||[])])].map(u=>p('').replace('<p></p>',`<p>${link(u,u)}</p>`)).join('')+rows.map(r=>`<p>Source: ${sourceLink(r)}</p>`).join(''),
 Audience:p([...new Set(rows.flatMap(r=>r.audienceValues))].join(' / ')),
 Status:rows.map(r=>p(`${r.figmaNodeId}: ${status(r)}`)).join('')+p(rows.every(r=>r.sourceStatusValues.includes('На проде'))?'В Figma отмечен «На проде». Установка, доступы и фактическое исполнение проверяются отдельно.':'Не рекомендовать как готовую capability: текущий source status требует проверки доступности у владельца.'),
 Examples:list(skill.examples),
 'Keywords / discovery terms':p(skill.keywords.join(', ')),
 Provenance:rows.map(r=>`<p>${sourceLink(r)} — ${html(r.title)}; авторы: ${literal(r.authorValues)}.</p>`).join(''),
 };}
export function metaSections(registry) {
 const caseScope = `type = page AND space = "${registry.space}" AND ancestor = ${registry.cases}`;
 const skillScope = `type = page AND space = "${registry.space}" AND ancestor = ${registry.meta}`;
 const skillLinks = agentSkills.filter(skill=>registry.skills[skill.key]).map(skill=>
  `<li>${link(pageUrl(registry,registry.skills[skill.key]),skill.name)}</li>`).join('');
 return {
  'Как агенту искать capability':p('Единая точка входа в базу инструментов ADT. Здесь описано, как найти карточку или инструкцию по задаче пользователя.')+
   steps([
    'Выдели задачу, входные материалы и ожидаемый результат. Начни с полнотекстового поиска по страницам кейсов. Используй короткие фразы из запроса и переформулируй их, если результатов мало.',
    'Открой наиболее релевантную карточку. Сверь «Когда использовать», ограничения, входные данные и результат. Объединяй совпадения по figmaNodeId. Разные figmaNodeId могут описывать разные реализации близкой задачи.',
    'Если карточка ссылается на curated Skill, открой её за подробными шагами. Можно искать среди Skill pages напрямую по Examples и Keywords. Проверь связанные Figma node IDs, если навык покрывает несколько кейсов.',
    'Проверь Source state, Source status и Agent readiness на карточке. Если владелец ещё не подтвердил карточку, обозначь это. Даже при статусе «На проде» отдельно проверь prerequisites, разрешения, установку и доступ.',
    'Загрузи оригинальную инструкцию и используй доступный инструмент в рамках поручения. Сообщай о выполнении после получения результата. Если входные данные меняют выбор инструмента, уточни их.',
   ])+
   p(`CQL для карточек: ${caseScope} AND text ~ "ключевая фраза"`)+
   p(`CQL для инструкций: ${skillScope} AND text ~ "ключевая фраза"`)+
   `<p>Без CQL используй поиск в DES и проверяй тип документа. Если поиска нет, открой ${link(pageUrl(registry,registry.cases),'дерево карточек кейсов')} или одну из инструкций ниже.</p>`,
  'Подробные инструкции к отдельным возможностям':`<ul>${skillLinks}</ul>`,
  'Page contract':p('Case page — карточка одного figmaNodeId с данными из Figma и инструкциями владельца. Curated Skill page — подробная инструкция к возможности, которая может охватывать несколько figmaNodeId. Figma задаёт identity, состав и исходные статусы. Актуальная готовность к работе агента хранится на карточке кейса.'),
  'Corporate standard':p('Confluence публикует описание и ссылки. Устанавливаемые Agent Skills следуют формату SKILL.md.')+
   `<p>${link('https://docs.k.avito.ru/skills-hub/concepts/agent-skills/','Agent Skills: корпоративная документация')} · ${link('https://cf.avito.ru/spaces/RES/pages/890382644','Research Skills — оригинальные инструкции')}</p>`,
 };
}
export function renderBody(title,sections){return `<h1>${html(title)}</h1>`+Object.entries(sections).map(([h,b])=>`<h2>${html(h)}</h2>${b}`).join('')+marker(fingerprint(sections));}
export {agentSkills};

export function sourceSections(){return {
 Architecture:p('Figma → Generated Source + Curated Metadata → Catalog → Avito Prototype Hosting / GitHub Pages fallback → Confluence → Agent Skills. Identity: figmaNodeId.')+p(`Основной frame: ${tools.length} кейсов; «На проде»: ${tools.filter(t=>t.sourceStatusValues.includes('На проде')).length}; Backlog / Ideas: ${FIGMA_BACKLOG_SNAPSHOT.length}. Числа вычислены из source arrays.`),
 'Sync contract':steps(['Получить оба live Figma frame: 374:1308 и 2439:9151.','Parse visible text, active links и DockingBadge. Проверить vocabulary и полноту.','Сопоставить по figmaNodeId. Не принимать удаления, переносы, unknown values или новые строки автоматически.','Применить безопасный diff атомарно в одном generated source; сохранить curated metadata.','Regression → parity → build → browser E2E. Verified source-only commit проходит через bot PR.','Публикации проверяются отдельно. Confluence publisher сохраняет MANUAL-разделы, использует expected_version, content fingerprint и readback.']),
 Schedule:p('Figma sync: GitHub Actions, ежедневно 17:05 Europe/Moscow; возможны задержки платформы. Runner — hosted Ubuntu, от ноутбука не зависит. No changes → success без commit/deploy. Внутренний CI / Stash и автоматическая публикация в Hosting/Confluence требуют подтверждённого runner access и machine identity; локальный OAuth publish не считается server-side automation.')+`<p>${link('https://github.com/kosilin27/adt-ai-tools/actions/workflows/sync-figma.yml','Scheduled Figma sync')} · ${link('https://github.com/kosilin27/adt-ai-tools/blob/main/docs/architecture.md','Архитектура и границы публикации')}</p>`,
 };}
export function setupSections(registry){return {'Использовать эту базу':p('Подключить Confluence к агенту через корпоративный MCP с доступом к Design space. Дать агенту единый вход AI Skills for Agents. Найти карточку кейса или подробную инструкцию по задаче и проверить prerequisites. Доступ к Confluence сам по себе не устанавливает исполняемый skill.')+`<p>${link(`https://cf.avito.ru/spaces/DES/pages/${registry.meta}`,'AI Skills for Agents — intent discovery')}</p>`+p('Готовые запросы: «Хочу проанализировать интервью», «Собери кликабельный прототип из Figma», «Проверь бриф по прошлым исследованиям». Если подходящей capability или доступа нет, агент должен сообщить об этом, а не имитировать исполнение.')};}
