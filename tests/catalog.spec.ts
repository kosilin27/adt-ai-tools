import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { ideas } from '../src/data/ideas';
import { actionsForSource } from '../src/data/figmaSource';
import { FIGMA_CASES_SNAPSHOT } from '../src/data/figmaCasesSnapshot';
const sourceNodeIds = FIGMA_CASES_SNAPSHOT.map(row => row.figmaNodeId);
import { tools, validateTools, type Tool } from '../src/data/tools';

const auditPath = 'test-results/catalog-audit.json';
const caseSource = (id: string) => 'https://www.figma.com/design/nVLcu3bbLgz0lJhSUexjvx/30-AI-Process-Upgrades?node-id=' + id.replace(':', '-');
const hostedHashRoutes = /prototype-hosting\.k\.avito\.ru|artifact\.avito\.ru/.test(process.env.REMOTE_BASE_URL || '');
const detailUrl = (tool: Tool) => (hostedHashRoutes ? '#/tool/' : 'tool/') + tool.id;
const primaryFor = (tool: Tool) => (tool.actions || []).find(action => action.primary);
const appRootUrl = () => new URL('./', process.env.REMOTE_BASE_URL || 'http://127.0.0.1:4173/adt-ai-tools/').toString();
const tovTitle = 'Плагин-редактор в Figma с оценкой текста на соответствие корпоративным стандартам (TOV и редполитика), реадактирование на основе ИИ';

test.beforeAll(async () => {
  validateTools(tools);
  expect(tools.length).toBe(sourceNodeIds.length);
  expect(ideas.length).toBe(13);
  expect(new Set(tools.map(tool => tool.figmaNodeId)).size).toBe(sourceNodeIds.length);
  await mkdir('test-results', { recursive: true });
});

test('catalog smoke flow keeps tools, Ideas, search and filters', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'AI TOOLS THAT WORK' })).toBeVisible();
  await expect(page.locator('#catalog .tool-card')).toHaveCount(sourceNodeIds.length);
  await expect(page.locator('#ideas .idea-card')).toHaveCount(13);
  await expect(page.getByText('NEW THIS MONTH')).toHaveCount(0);
  await expect(page.getByText('6 new this month')).toHaveCount(0);
  await expect(page.getByText('See what\'s new')).toHaveCount(0);
  await page.locator('#catalog-search').fill('TOV и редполитика');
  await expect(page.getByRole('heading', { name: tovTitle, exact: true }).first()).toBeVisible();
  await page.locator('#catalog-search').fill('query-that-cannot-match');
  await expect(page.getByText('Ничего не нашли.')).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить всё' }).click();
  await expect(page.locator('#catalog .tool-card')).toHaveCount(sourceNodeIds.length);
  for (const role of ['Дизайн', 'Исследования', 'Текст']) {
    await page.locator('.search-wrap .roles').getByRole('button', { name: role, exact: true }).click();
    await expect(page.locator('#catalog .tool-card').first()).toBeVisible();
  }
  await page.getByRole('button', { name: 'Фильтры' }).click();
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  await page.getByLabel('Статус', { exact: true }).selectOption('На проде');
  const selectedUrl = new URL(page.url());
  expect(new URLSearchParams(hostedHashRoutes ? selectedUrl.hash.split('?')[1] : selectedUrl.search).get('status')).toBe('На проде');
  await page.getByRole('button', { name: /Фильтры/ }).click();
});

test('visible multi-status badges drive counts, membership filters and Detail', async ({ page }) => {
  await page.goto('');
  const labels = ['На проде', 'Тестируется', 'Разработан', 'Разрабатывается'];
  const counts = labels.map(label => tools.filter(tool => tool.sourceStatusValues?.includes(label as any)).length);
  await expect(page.locator('.stats strong')).toHaveText(counts.map(String));
  await page.getByRole('button', { name: 'Фильтры', exact: true }).click();
  await page.getByLabel('Статус', { exact: true }).selectOption('На проде');
  await expect(page.locator('#catalog .tool-card')).toHaveCount(counts[0]);
  const multi = tools.find(tool => tool.sourceStatusValues?.includes('На проде') && tool.sourceStatusValues.length > 1)!;
  await page.goto(detailUrl(multi));
  const sheet = page.getByRole('dialog', { name: multi.title });
  for (const label of multi.sourceStatusValues!) await expect(sheet.locator('.case-details .status').filter({ hasText: label })).toBeVisible();
});

test('intent filters are semantic and shareable', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: /Сделать прототип/ }).click();
  await expect(page).toHaveURL(/intent=prototype/);
  await expect(page.locator('.active-intent')).toContainText('Сделать прототип');
  await expect(page.locator('#catalog .tool-card')).not.toHaveCount(sourceNodeIds.length);
  await page.getByRole('button', { name: /Автоматизировать/ }).click();
  await expect(page).toHaveURL(/intent=automate/);
  await expect(page.locator('.intent-row button.active')).toHaveCount(1);
});

test('favorites persist, do not open cards, and filter independently', async ({ page }) => {
  await page.goto('');
  const card = page.locator('#catalog .tool-card').filter({ has: page.getByRole('heading', { name: tovTitle, exact: true }) });
  const star = card.locator('.favorite');
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await expect(page).not.toHaveURL(/\/tool\//);
  await page.locator('.search-wrap .favorites-toggle').click();
  await expect(page.locator('#catalog .tool-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.search-wrap .favorites-toggle')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#catalog .tool-card')).toHaveCount(sourceNodeIds.length);
});

test('status groups stay ordered and shortcut focuses active search', async ({ page }) => {
  await page.goto('');
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#catalog-search')).toBeFocused();
  const groups = page.locator('.status-group');
  await expect(groups).toHaveCount(5);
  await expect(groups.nth(0)).toHaveClass(/status-group-на-проде/);
  await expect(groups.nth(1)).toHaveClass(/status-group-тестируется/);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect(page.locator('.sticky-toolbar')).toBeVisible();
  await page.keyboard.press('Meta+k');
  await expect(page.locator('#sticky-catalog-search')).toBeFocused();
});

test('mobile catalog keeps controls, drawer and detail usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect(page.locator('.sticky-toolbar')).toBeVisible();
  await page.locator('.sticky-toolbar .filter-button').click();
  await expect(page.getByRole('dialog', { name: 'Фильтры' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#catalog .tool-card').first().click();
  await expect(page.getByRole('dialog').last()).toBeVisible();
  await expect(page.getByRole('dialog').last()).toHaveCSS('width', '390px');
});

test('TOV editor uses the live Figma primary action', async ({ page }) => {
  await page.goto(detailUrl(tools.find(tool => tool.id === 'tov-editor')!));
  const cta = page.locator('.sheet-cta a');
  await expect(cta).toHaveText('Открыть плагин ↗');
  await expect(cta).toHaveAttribute('href', 'https://www.figma.com/community/plugin/1621150885892028917');
  await expect(cta).toHaveAttribute('target', '_blank');
  await expect(page.locator('.case-source a')).toHaveAttribute('href', caseSource('374:1509'));
});

test('canonical source titles and aliases remain searchable', async ({ page }) => {
  await page.goto('');
  const cases = [
    ['Анализатор качественных интервью', 'Анализатор качественных интервью (qual-interview-analyzer)'],
    ['qual-interview-analyzer', 'Анализатор качественных интервью (qual-interview-analyzer)'],
    ['Анализатор количественных опросов', 'Анализатор количественных опросов (quant-survey-analyzer)'],
    ['quant-survey-analyzer', 'Анализатор количественных опросов (quant-survey-analyzer)'],
    ['Конструктор исследовательских инструментов', 'Конструктор исследовательских инструментов (guide-builder)'],
    ['guide-builder', 'Конструктор исследовательских инструментов (guide-builder)'],
    ['эвристик', 'AI для проведения анализа экранов по эвристическому методу (исследование)'],
    ['Figma плагин для редактуры текста', 'Figma плагин для редактуры текста'],
    ['Развитие и тестирование AI-редактора', 'Развитие и тестирование AI-редактора'],
    ['Автоматическая проверка скриптов КЦ', 'Автоматическая проверка скриптов КЦ по ТоВ и редполитике'],
    ['Система комментарирования', 'Система комментарирования и отслеживания комментариев редакторов'],
  ];
  for (const [query, title] of cases) {
    await page.locator('#catalog-search').fill(query);
    await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
  }
});

test('full source snapshot to UI actions audit', async ({ page, context }) => {
  test.setTimeout(180_000);
  const results: Array<Record<string, unknown>> = [];
  let broken = 0;
  for (const tool of tools) {
    await page.goto(detailUrl(tool));
    const sheet = page.getByRole('dialog', { name: tool.title });
    await expect(sheet).toBeVisible();
    const primary = primaryFor(tool);
    const primaryCta = sheet.locator('.sheet-cta a');
    const row: Record<string, unknown> = {
      figmaNodeId: tool.figmaNodeId, title: tool.title, status: tool.status,
      sourceActions: actionsForSource(tool.sourceRecord!),
      datasetActions: tool.actions || [], primaryCtaFound: await primaryCta.count(),
      primaryCtaHref: (await primaryCta.count()) ? await primaryCta.getAttribute('href') : null, result: 'PASS',
    };
    try {
      expect(tool.caseSource).toBe(caseSource(tool.figmaNodeId || ''));
      expect(tool.actions || []).toEqual(actionsForSource(tool.sourceRecord!));
      if (!primary) {
        await expect(primaryCta).toHaveCount(0);
      } else {
        await expect(primaryCta).toHaveCount(1);
        await expect(primaryCta).toHaveAttribute('href', primary.url);
        await expect(primaryCta).toHaveAttribute('target', '_blank');
        await expect(primaryCta).toHaveAttribute('rel', 'noopener noreferrer');
      }
      for (const action of (tool.actions || []).filter(action => !action.primary)) {
        const link = sheet.getByRole('link', { name: action.label + ' ↗', exact: true });
        await expect(link).toHaveCount(1);
        await expect(link).toHaveAttribute('href', action.url);
        await expect(link).not.toHaveClass(/sheet-cta/);
      }
      await expect(sheet.locator('.case-source a')).toHaveAttribute('href', tool.caseSource!);
    } catch (error) {
      broken += 1; row.result = 'FAIL'; row.error = String(error);
    }
    results.push(row);
  }
  await writeFile(auditPath, JSON.stringify(results, null, 2));
  const primaryCount = tools.filter(tool => primaryFor(tool)).length;
  const guideOnly = tools.filter(tool => !primaryFor(tool) && (tool.actions || []).some(action => action.kind === 'guide')).length;
  const announcementOnly = tools.filter(tool => !primaryFor(tool) && (tool.actions || []).some(action => action.kind === 'announcement')).length;
  console.log([
    'BUILD: PASS', 'TOOLS: ' + tools.length + ' / ' + sourceNodeIds.length, 'IDEAS: ' + ideas.length + ' / 13',
    'PRIMARY ACTIONS: ' + primaryCount, 'GUIDE-ONLY TOOLS: ' + guideOnly,
    'ANNOUNCEMENT-ONLY TOOLS: ' + announcementOnly,
    'DATASET MISSING NODE IDS: ' + sourceNodeIds.filter(id => !tools.some(tool => tool.figmaNodeId === id)).length,
    'UNKNOWN NODE IDS: ' + tools.filter(tool => !sourceNodeIds.includes(tool.figmaNodeId || '')).length,
    'SOURCE ACTION MISMATCH: ' + tools.filter(tool => JSON.stringify(tool.actions || []) !== JSON.stringify(actionsForSource(tool.sourceRecord!))).length,
    'BROKEN CTA: ' + broken, 'E2E: ' + (broken ? 'FAIL' : 'PASS'),
  ].join('\n'));
  expect(broken, 'Broken CTA count: ' + broken).toBe(0);
});

test('keyboard detail routing regression', async ({ page }) => {
  await page.goto('');
  const card = page.locator('#catalog .tool-card').filter({ has: page.getByRole('heading', { name: tovTitle, exact: true }) });
  await card.focus();
  await card.press('Enter');
  await expect(page).toHaveURL(/\/tool\/tov-editor$/);
  await expect(page.getByRole('dialog', { name: tovTitle })).toBeVisible();
  await page.keyboard.press('Escape');
  if (hostedHashRoutes) await expect(page).toHaveURL(/#\/$/);
  else await expect(page).toHaveURL(appRootUrl());
});

test('runtime assets and refresh keep hosted status data usable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && /\/assets\//.test(response.url())) errors.push(response.url() + ': ' + response.status()); });
  await page.goto(detailUrl(tools.find(tool => tool.id === 'tov-editor')!));
  await page.reload();
  await expect(page.locator('.case-details')).toContainText('На проде');
  await expect(page.locator('.stats strong').first()).toHaveText(String(tools.filter(tool => tool.sourceStatusValues?.includes('На проде')).length));
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/status-runtime.png', fullPage: true });
});
