import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { ideas } from '../src/data/ideas';
import { ACTIONS_BY_NODE_ID, TOOL_NODE_IDS } from '../src/data/figmaSource';
import { tools, validateTools, type Tool } from '../src/data/tools';

const auditPath = 'test-results/catalog-audit.json';
const caseSource = (id: string) => 'https://www.figma.com/design/nVLcu3bbLgz0lJhSUexjvx/30-AI-Process-Upgrades?node-id=' + id.replace(':', '-');
const detailUrl = (tool: Tool) => 'tool/' + tool.id;
const primaryFor = (tool: Tool) => (tool.actions || []).find(action => action.primary);

test.beforeAll(async () => {
  validateTools(tools);
  expect(tools.length).toBe(85);
  expect(ideas.length).toBe(13);
  expect(new Set(tools.map(tool => tool.figmaNodeId)).size).toBe(85);
  await mkdir('test-results', { recursive: true });
});

test('catalog smoke flow keeps tools, Ideas, search and filters', async ({ page }) => {
  await page.goto('');
  await expect(page.getByRole('heading', { name: 'AI TOOLS THAT WORK' })).toBeVisible();
  await expect(page.locator('#catalog .tool-card')).toHaveCount(85);
  await expect(page.locator('#ideas .idea-card')).toHaveCount(13);
  await expect(page.getByText('Обогащение беклога', { exact: true })).toBeVisible();
  await page.getByLabel('Что хотите сделать?').fill('TOV & text editor');
  await expect(page.getByRole('heading', { name: 'TOV & text editor', exact: true }).first()).toBeVisible();
  await page.getByLabel('Что хотите сделать?').fill('query-that-cannot-match');
  await expect(page.getByText('No tools match this search.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(page.locator('#catalog .tool-card')).toHaveCount(85);
  for (const role of ['Дизайн', 'Исследования', 'Текст']) {
    await page.locator('.roles').getByRole('button', { name: role, exact: true }).click();
    await expect(page.locator('#catalog .tool-card').first()).toBeVisible();
  }
  for (const status of ['READY', 'BETA', 'IN DEVELOPMENT']) {
    await page.getByLabel('Статус').selectOption({ label: status });
    await expect(page.locator('.tool-card').first()).toBeVisible();
  }
});

test('TOV editor uses the live Figma primary action', async ({ page }) => {
  await page.goto('tool/tov-editor');
  const cta = page.locator('.sheet-cta a');
  await expect(cta).toHaveText('Открыть плагин ↗');
  await expect(cta).toHaveAttribute('href', 'https://www.figma.com/community/plugin/1621150885892028917');
  await expect(cta).toHaveAttribute('target', '_blank');
  await expect(page.locator('.case-source a')).toHaveAttribute('href', caseSource('374:1509'));
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
      sourceActions: ACTIONS_BY_NODE_ID[tool.figmaNodeId || ''] || [],
      datasetActions: tool.actions || [], primaryCtaFound: await primaryCta.count(),
      primaryCtaHref: (await primaryCta.count()) ? await primaryCta.getAttribute('href') : null, result: 'PASS',
    };
    try {
      expect(tool.caseSource).toBe(caseSource(tool.figmaNodeId || ''));
      expect(tool.actions || []).toEqual(ACTIONS_BY_NODE_ID[tool.figmaNodeId || ''] || []);
      if (tool.status === 'development' || !primary) {
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
    'BUILD: PASS', 'TOOLS: ' + tools.length + ' / 85', 'IDEAS: ' + ideas.length + ' / 13',
    'PRIMARY ACTIONS: ' + primaryCount, 'GUIDE-ONLY TOOLS: ' + guideOnly,
    'ANNOUNCEMENT-ONLY TOOLS: ' + announcementOnly,
    'DATASET MISSING NODE IDS: ' + TOOL_NODE_IDS.filter(id => !tools.some(tool => tool.figmaNodeId === id)).length,
    'UNKNOWN NODE IDS: ' + tools.filter(tool => !TOOL_NODE_IDS.includes(tool.figmaNodeId || '')).length,
    'SOURCE ACTION MISMATCH: ' + tools.filter(tool => JSON.stringify(tool.actions || []) !== JSON.stringify(ACTIONS_BY_NODE_ID[tool.figmaNodeId || ''] || [])).length,
    'BROKEN CTA: ' + broken, 'E2E: ' + (broken ? 'FAIL' : 'PASS'),
  ].join('\n'));
  expect(broken, 'Broken CTA count: ' + broken).toBe(0);
});

test('keyboard detail routing regression', async ({ page }) => {
  await page.goto('');
  const card = page.locator('#catalog .tool-card').filter({ has: page.getByRole('heading', { name: 'TOV & text editor', exact: true }) });
  await card.focus();
  await card.press('Enter');
  await expect(page).toHaveURL(/\/tool\/tov-editor$/);
  await expect(page.getByRole('dialog', { name: 'TOV & text editor' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
});
