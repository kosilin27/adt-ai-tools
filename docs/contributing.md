# Как внести изменение

## Локальная работа

```sh
git clone <canonical-repo-url>
cd adt-ai-tools
git switch -c feature/my-change
npm ci
npx playwright install chromium
npm run dev
```

Требуется Node.js 22. GitHub остаётся canonical до доказанного переезда в Stash. Актуальный адрес указан в README.

## Я хочу добавить новый кейс

Добавьте заполненную строку в Figma `374:1308`. Заголовок, раздел и audience обязательны; links/authors/status могут быть явно пустыми. Статусы — видимые DockingBadge, несколько значений допустимы. Затем один acceptance: `npm run sync:figma -- --accept-new` с доступом к live Figma либо **Actions → Sync Figma → Run workflow → accept_new**. Проверьте diff по `figmaNodeId`, затем PR и CI. Generated snapshot руками не редактировать.

## Я хочу поменять описание

Измените `shortDescription` в `src/data/curatedTools.ts` по Figma node ID. Categories, how-to и специальные CTA labels находятся там же. Не переносите туда title/authors/status из Figma.

## Я хочу добавить ссылку

Source link измените в Figma; sync перенесёт все ссылки. Особую подпись действия можно добавить в `actionOverrides`, привязав её к точному URL. Дополнительная product-owned ссылка — `supplementalActions` с объяснением в PR. Не маскируйте ссылкой на документацию запуск инструмента.

## Я хочу поменять UI

Меняйте app code и стили. `npm run verify` проверяет parser → build → parity → browser E2E. Для Prototype Hosting дополнительно `VITE_BASE=./ npm run build`, затем проверка реальной версии и latest URL.

## Я хочу добавить новый skill

Сначала проверьте, что capability существует и её можно повторно применять. Найдите оригинальный skill/tool/agent и его инструкцию. Добавьте запись в `src/data/agentSkills.ts`: stable key, Figma node ID, результат, intents, boundaries, inputs, output, steps, 3–5 естественных запросов, keywords и source references. Не дублируйте source status/авторов.

`npm run check:confluence` показывает план. `npm run sync:confluence -- --apply` создаёт/обновляет реальные страницы через корпоративный MCP; нужен доступ к Confluence. Publisher сохраняет destination IDs в `scripts/confluence/pages.json`; включите их в PR. Повторный запуск с тем же content fingerprint должен ничего не менять. Вручную добавленные разделы и комментарии сохраняются, managed sections редактируются через repo. Страницы кейсов создаются под страницей cases, а `casePages` хранит соответствия Figma node ID → Confluence page ID. Проверяйте состав live main frame перед публикацией. Разделы владельца, включая Agent readiness, сохраняются при обновлении исходных данных. Если кейс исчезает из активного снимка, publisher обновляет Source state и сохраняет страницу и запись в реестре.

Confluence discovery page не устанавливает skill автоматически. Исполняемый skill должен следовать корпоративному формату `skills/<name>/SKILL.md` в Bitbucket; агент загружает оригинальные инструкции и проверяет prerequisites перед вызовом.

## Почему Sync Figma упал

Откройте Actions run и artifact `figma-sync-report`: nodeId → title → field → value → reason. Выключенный ноутбук не влияет на GitHub runner.

- `401/403`: проверить доступ и CI secret `FIGMA_TOKEN`, не передавать токен в чат.
- Новый complete row: один reviewed acceptance.
- Новый incomplete row: заполнить исходную Figma-строку.
- Unknown audience/status: проверить live источник; не расширять словарь автоматически.
- Missing/duplicate column, malformed URL: исправить источник/парсер с regression fixture.
- Перенос в Backlog: проверить node parent live, согласовать и выполнить `--accept-moves` с обоими frames; metadata сохраняется.
- Исчезновение из обоих frames: pipeline блокируется; не применять force-removal.
- Push race: обновить ветку и повторно сверить live; не force-push.
- Browser/remote QA: проверить реальный base path, assets и распространение новой версии. Локальный PASS не означает production PASS.

`npm run check:figma-live` строго read-only, включая отсутствие reports/GitHub outputs. Вывод перенаправляйте вне checkout, если нужен файл. Offline frame replay не доказывает актуальность live Figma.

## Contribution flow

Clone → branch → change → `npm run verify` → PR → green CI → review/merge → build/deploy → remote QA. Никому не нужен прямой push в main. Не обходите branch protection. Бот sync — отдельная ограниченная identity, если настройка protection требует исключения.
