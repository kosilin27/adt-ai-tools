import type { Tool } from './toolTypes.ts';
import type { ToolAction } from './figmaSource.ts';

// Editorial data only. id preserves legacy URLs; identity and joining use the object key.
export type CuratedTool = Partial<Pick<Tool, 'id'|'shortDescription'|'problem'|'whenToUse'|'whatItDoes'|'categories'|'type'|'status'|'statusNote'|'metrics'|'impactTags'|'howToStart'|'updatedAt'|'createdAt'|'relatedToolIds'|'featured'>> & { actionOverrides?: ToolAction[]; supplementalActions?: ToolAction[] };
export const curatedByNodeId: Record<string, CuratedTool> = {
  "374:1509": {
    "id": "tov-editor",
    "shortDescription": "Проверяет тексты интерфейса по стандартам Avito и предлагает правки.",
    "problem": "Разные формулировки и позднее редакторское ревью создают лишние итерации.",
    "whenToUse": "Когда нужно проверить или переписать текст интерфейса перед релизом.",
    "whatItDoes": "Плагин Figma с редакционной политикой, tone of voice и AI-редактированием в контексте.",
    "categories": [
      "Text",
      "Design review"
    ],
    "type": "plugin",
    "status": "beta",
    "statusNote": "Being tested with the team.",
    "metrics": [
      {
        "value": "−50%",
        "label": "iterations after review"
      },
      {
        "value": "+75%",
        "label": "first-pass rate"
      }
    ],
    "impactTags": [
      "Improve quality",
      "Save time"
    ],
    "howToStart": [
      "Откройте плагин в Figma.",
      "Выберите фрейм с текстом.",
      "Запустите проверку и изучите предложения."
    ],
    "updatedAt": "2026-09-08",
    "createdAt": "2026-06-01",
    "relatedToolIds": [
      "typography-text",
      "editorial-policy"
    ],
    "featured": true,
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1621150885892028917",
        "primary": true
      },
      {
        "kind": "channel",
        "label": "Канал для доступов и обратной связи",
        "url": "https://mt.avito.ru/avito/channels/avito-editor-plugin",
        "primary": false
      }
    ]
  },
  "2687:10311": {
    "id": "typography-text",
    "shortDescription": "Готовит текст к разработке по правилам типографики и редакционной политики Avito.",
    "whenToUse": "Когда текст готов к передаче в разработку и нужен финальный формат.",
    "whatItDoes": "Переключает текст между готовыми символами и форматом для разработчиков.",
    "categories": [
      "Text",
      "Design System"
    ],
    "type": "plugin",
    "status": "beta",
    "metrics": [
      {
        "value": "4 sec",
        "label": "instead of ~3 min"
      }
    ],
    "impactTags": [
      "Save time",
      "Improve quality"
    ],
    "howToStart": [
      "Запустите плагин в Figma.",
      "Выберите текстовые слои.",
      "Выберите режим передачи."
    ],
    "updatedAt": "2026-09-02",
    "createdAt": "2026-05-20",
    "relatedToolIds": [
      "tov-editor",
      "editorial-policy"
    ],
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1638816840468168578",
        "primary": true
      }
    ]
  },
  "3469:10969": {
    "id": "editorial-policy",
    "shortDescription": "Единый источник правил написания интерфейсных текстов с поиском и примерами.",
    "whenToUse": "Когда нужно быстро найти правило или пример для интерфейсного текста.",
    "whatItDoes": "Отдельный сайт с практическими примерами и поиском по редакционной политике.",
    "categories": [
      "Text",
      "Knowledge"
    ],
    "type": "service",
    "status": "development",
    "statusNote": "Looking for a home for the policy site.",
    "impactTags": [
      "Find knowledge"
    ],
    "howToStart": [
      "Join the team channel for access."
    ],
    "updatedAt": "2026-08-31",
    "createdAt": "2026-08-31",
    "relatedToolIds": [
      "tov-editor"
    ]
  },
  "470:6413": {
    "id": "graphics-plugin",
    "shortDescription": "Создаёт графику в стиле Avito прямо в Figma и отправляет её на ревью.",
    "problem": "Генерация и согласование графики требуют переключения между инструментами.",
    "whenToUse": "Когда нужна брендированная иллюстрация или изображение прямо в макете.",
    "whatItDoes": "Создаёт графику в макете, позволяет выбрать формат и синхронизирует результат с ревью.",
    "categories": [
      "Graphics",
      "Automation"
    ],
    "type": "plugin",
    "status": "beta",
    "metrics": [
      {
        "value": "−70%",
        "label": "graphics creation TTM"
      },
      {
        "value": "38 h",
        "label": "time saved"
      }
    ],
    "impactTags": [
      "Save time",
      "Improve quality"
    ],
    "howToStart": [
      "Откройте плагин в Figma.",
      "Опишите нужную графику.",
      "Отправьте результат на ревью."
    ],
    "updatedAt": "2026-09-05",
    "createdAt": "2026-06-08",
    "relatedToolIds": [
      "stiletto-bot"
    ],
    "featured": true,
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1638571943514590458",
        "primary": true
      }
    ]
  },
  "374:7695": {
    "id": "stiletto-bot",
    "shortDescription": "Командный бот для генерации графики в стиле Avito.",
    "whenToUse": "Когда нужно быстро получить брендированное изображение в мессенджере.",
    "whatItDoes": "Интерфейс бота для генерации визуальных материалов на моделях внутри контура Avito.",
    "categories": [
      "Graphics"
    ],
    "type": "bot",
    "status": "beta",
    "statusNote": "Usage metrics are being established.",
    "impactTags": [
      "Save time"
    ],
    "howToStart": [
      "Open the bot in the team messenger.",
      "Describe the image and context."
    ],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-07-01",
    "relatedToolIds": [
      "graphics-plugin"
    ]
  },
  "3469:10852": {
    "id": "confetti-shader",
    "shortDescription": "Настраиваемый эффект конфетти с экспортом конфигурации в JSON.",
    "whenToUse": "Когда нужно быстро прототипировать motion-эффект с собственными цветами и физикой.",
    "whatItDoes": "Настраивает частицы, физику, стиль и источники; готовую конфигурацию можно скопировать.",
    "categories": [
      "Animation",
      "Prototyping"
    ],
    "type": "plugin",
    "status": "ready",
    "statusNote": "Used in the Auction launch.",
    "impactTags": [
      "Save time"
    ],
    "howToStart": [
      "Open the effect.",
      "Tap once to run, hold to configure.",
      "Copy the JSON into the handoff."
    ],
    "updatedAt": "2026-08-20",
    "createdAt": "2026-06-12",
    "relatedToolIds": [
      "video-to-json"
    ],
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть инструмент",
        "url": "https://artifact.avito.ru/share/zwE3KaqEvy4JjsW7zh0-Tg",
        "primary": true
      }
    ]
  },
  "2988:9922": {
    "id": "video-to-json",
    "shortDescription": "Мгновенно конвертирует видео в JSON без сложного пайплайна.",
    "whenToUse": "Когда нужно быстро подготовить анимацию к передаче в разработку.",
    "whatItDoes": "Превращает видео в JSON для handoff и убирает ручные шаги пайплайна.",
    "categories": [
      "Animation",
      "Automation"
    ],
    "type": "service",
    "status": "beta",
    "metrics": [
      {
        "value": "−85%",
        "label": "animation preparation TTM"
      },
      {
        "value": "−90%",
        "label": "manual pipeline steps"
      }
    ],
    "impactTags": [
      "Save time",
      "Remove manual work"
    ],
    "howToStart": [
      "Open the converter.",
      "Upload a video.",
      "Download the JSON output."
    ],
    "updatedAt": "2026-09-08",
    "createdAt": "2026-07-15",
    "relatedToolIds": [
      "lottie-prompt",
      "confetti-shader"
    ],
    "featured": true
  },
  "374:7207": {
    "id": "lottie-prompt",
    "shortDescription": "Генерирует Lottie-анимацию по текстовому описанию прямо в Figma.",
    "whenToUse": "Когда нужно быстро проверить идею анимации без долгой интеграции.",
    "whatItDoes": "Плагин Figma превращает короткое описание движения в первый вариант анимации.",
    "categories": [
      "Animation",
      "Prototyping"
    ],
    "type": "plugin",
    "status": "development",
    "statusNote": "Being developed and tested.",
    "impactTags": [
      "Save time"
    ],
    "howToStart": [
      "Write the motion brief.",
      "Generate a first version."
    ],
    "updatedAt": "2026-08-22",
    "createdAt": "2026-08-22",
    "relatedToolIds": [
      "video-to-json"
    ]
  },
  "374:3855": {
    "id": "reviews",
    "shortDescription": "Управляет списком замечаний дизайн-ревью после разработки.",
    "whenToUse": "Когда нужно собрать и упорядочить комментарии к результату.",
    "whatItDoes": "Плагин Figma для фиксации и организации замечаний в одном месте.",
    "categories": [
      "Design review",
      "Team processes"
    ],
    "type": "plugin",
    "status": "ready",
    "metrics": [
      {
        "value": "34",
        "label": "users on Sep 1"
      }
    ],
    "impactTags": [
      "Save time",
      "Improve quality"
    ],
    "howToStart": [
      "Open the plugin in Figma.",
      "Add or review comments."
    ],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-07-01",
    "relatedToolIds": [
      "feedback-service"
    ],
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1611331720808016861",
        "primary": true
      }
    ]
  },
  "374:1580": {
    "id": "feedback-service",
    "shortDescription": "Помогает быстро получить обратную связь по продуктовым макетам на этапе дизайна.",
    "whenToUse": "Когда нужен ранний продуктовый feedback с сохранением контекста задачи.",
    "whatItDoes": "Сохраняет обратную связь рядом с задачей, чтобы каждая итерация учитывала общий контекст.",
    "categories": [
      "Design review",
      "Research"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [
      "Improve quality"
    ],
    "howToStart": [
      "Add the service to a design task.",
      "Share the layout for feedback."
    ],
    "updatedAt": "2026-08-25",
    "createdAt": "2026-08-25",
    "relatedToolIds": [
      "reviews"
    ]
  },
  "374:7451": {
    "id": "real-content",
    "shortDescription": "За секунды заполняет карточки в Figma реальным контентом айтемов.",
    "whenToUse": "Когда прототипу нужен реалистичный контент перед тестированием.",
    "whatItDoes": "Массово подставляет релевантные данные в карточки для реалистичных макетов.",
    "categories": [
      "Prototyping",
      "Automation"
    ],
    "type": "plugin",
    "status": "ready",
    "metrics": [
      {
        "value": "−70%",
        "label": "TTM"
      },
      {
        "value": "531",
        "label": "items generated"
      },
      {
        "value": "35 h",
        "label": "time saved"
      }
    ],
    "impactTags": [
      "Save time",
      "Work without specialist"
    ],
    "howToStart": [
      "Open the plugin.",
      "Select the cards.",
      "Generate relevant content."
    ],
    "updatedAt": "2026-08-26",
    "createdAt": "2026-08-26",
    "relatedToolIds": [
      "charts-plugin"
    ],
    "featured": true
  },
  "374:1651": {
    "id": "charts-plugin",
    "shortDescription": "Создаёт редактируемые графики из табличных данных прямо в Figma.",
    "whenToUse": "Когда в концепте нужно быстро проверить несколько вариантов графиков.",
    "whatItDoes": "Превращает данные таблицы в гибкие графики без ручного переноса из Excel.",
    "categories": [
      "Graphics",
      "Prototyping"
    ],
    "type": "plugin",
    "status": "beta",
    "metrics": [
      {
        "value": "20",
        "label": "installs on Sep 1"
      }
    ],
    "impactTags": [
      "Save time"
    ],
    "howToStart": [
      "Open the plugin.",
      "Paste tabular data.",
      "Choose and edit a chart."
    ],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-07-10",
    "relatedToolIds": [
      "real-content"
    ],
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1605221516079243201",
        "primary": true
      }
    ]
  },
  "374:10246": {
    "id": "logo-resizer",
    "shortDescription": "Готовит логотип под все форматы для брендированных спецпроектов.",
    "whenToUse": "Когда логотип партнёра нужно адаптировать под несколько размещений.",
    "whatItDoes": "Автоматизирует подготовку вариантов логотипа для Брендспейсов.",
    "categories": [
      "Automation",
      "Graphics"
    ],
    "type": "plugin",
    "status": "ready",
    "metrics": [
      {
        "value": "424",
        "label": "logos prepared"
      },
      {
        "value": "17.5 h",
        "label": "time saved"
      }
    ],
    "impactTags": [
      "Remove manual work",
      "Save time"
    ],
    "howToStart": [
      "Open the plugin.",
      "Upload the source logo.",
      "Export all formats."
    ],
    "updatedAt": "2026-08-31",
    "createdAt": "2026-06-10",
    "relatedToolIds": [
      "real-content"
    ],
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1636333597458971823/re-logo-resizer",
        "primary": true
      }
    ]
  },
  "374:8305": {
    "id": "research-skills",
    "shortDescription": "Каталог AI-скиллов и агентов, которые уже используются в исследованиях.",
    "whenToUse": "Когда исследовательской задаче нужен готовый AI-сценарий.",
    "whatItDoes": "Собирает skills, инструкции по установке и карту исследовательских агентов.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [
      "Find knowledge",
      "Work without specialist"
    ],
    "howToStart": [
      "Open the catalog.",
      "Choose a skill.",
      "Follow the installation guide."
    ],
    "updatedAt": "2026-09-03",
    "createdAt": "2026-07-01",
    "relatedToolIds": [
      "interview-analyzer"
    ],
    "featured": true
  },
  "3188:10318": {
    "id": "interview-analyzer",
    "shortDescription": "Кодирует транскрипты интервью и готовит отчёт с привязкой к доказательствам.",
    "whenToUse": "Когда есть транскрипты и нужно найти паттерны, гипотезы и структуру отчёта.",
    "whatItDoes": "Строит матрицу «респондент × задача», находит паттерны и связывает выводы с цитатами.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [
      "Save time",
      "Improve quality"
    ],
    "howToStart": [
      "Prepare a transcript in TXT, MD, DOCX, PDF or Google Docs.",
      "Run the skill in Claude Code or Codex."
    ],
    "updatedAt": "2026-09-03",
    "createdAt": "2026-07-01",
    "relatedToolIds": [
      "research-skills"
    ]
  },
  "374:5992": {
    "id": "text-version-control",
    "shortDescription": "Делает этап работы с текстами прозрачным для команды разработки.",
    "categories": [
      "Text",
      "Team processes"
    ],
    "type": "plugin",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1610550602787796018/textsync",
        "primary": true
      }
    ]
  },
  "374:614": {
    "id": "script-tov-check",
    "shortDescription": "Автоматически проверяет скрипты КЦ по TOV и редакционной политике.",
    "categories": [
      "Text",
      "Automation"
    ],
    "type": "skill",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "1862:8991": {
    "id": "comments-system",
    "shortDescription": "Добавляет систему управления комментариями редакторов.",
    "categories": [
      "Text",
      "Team processes"
    ],
    "type": "plugin",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1608051932465313128",
        "primary": true
      }
    ]
  },
  "2988:9842": {
    "id": "design-review-auto",
    "shortDescription": "Механически проверяет расхождения между макетами и реализацией.",
    "categories": [
      "Design review",
      "Automation"
    ],
    "type": "plugin",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:10794": {
    "id": "annotation-widget",
    "shortDescription": "Упрощает создание аннотаций к макетам и компонентам.",
    "categories": [
      "Design System",
      "Team processes"
    ],
    "type": "plugin",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть виджет",
        "url": "https://www.figma.com/community/widget/1646914114905321708/a-notes",
        "primary": true
      }
    ]
  },
  "1971:9081": {
    "id": "stakeholder-approvals",
    "shortDescription": "Собирает отметки согласования макетов у разных стейкхолдеров.",
    "categories": [
      "Team processes",
      "Design review"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть виджет",
        "url": "https://www.figma.com/community/widget/1611717453383378342",
        "primary": true
      }
    ]
  },
  "374:3761": {
    "id": "visual-search",
    "shortDescription": "Ищет похожие макеты по изображению и контексту.",
    "categories": [
      "Knowledge",
      "Graphics"
    ],
    "type": "service",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:8061": {
    "id": "safe-json-handoff",
    "shortDescription": "Превращает изменения в макете в безопасный JSON для разработки.",
    "categories": [
      "Automation",
      "Design System"
    ],
    "type": "plugin",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:11282": {
    "id": "platform-reviewer",
    "shortDescription": "Помогает выравнивать платформы, добавлять уникальные компоненты и находить ответственных.",
    "categories": [
      "Design System",
      "Design review"
    ],
    "type": "skill",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:10306": {
    "id": "similar-layouts",
    "shortDescription": "Собирает похожие кейсы и референсы из Figma для повторного использования.",
    "categories": [
      "Knowledge",
      "Graphics"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:10672": {
    "id": "edge-case-generator",
    "shortDescription": "Помогает не пропускать corner cases при разработке и дизайне.",
    "categories": [
      "Design review",
      "Automation"
    ],
    "type": "skill",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2465:9156": {
    "id": "figma-production-map",
    "shortDescription": "Хранит соответствие компонентов Figma и продакшена и синхронизирует обновления.",
    "categories": [
      "Design System",
      "Knowledge"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2466:9226": {
    "id": "cjm-tech-stack",
    "shortDescription": "Показывает актуальное состояние backend-driven UI, Bricks и native-стека.",
    "categories": [
      "Design System",
      "Knowledge"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:9880": {
    "id": "platform-consistency",
    "shortDescription": "Оценивает консистентность платформенных интерфейсов и синхронизацию обновлений.",
    "categories": [
      "Design review",
      "Design System"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:9026": {
    "id": "day-of-judgement-machine",
    "shortDescription": "Обрабатывает обратную связь пользователей, показывает динамику и обогащает SPT-тикеты.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "workflow",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "guide",
        "label": "Открыть описание процесса",
        "url": "https://cf.avito.ru/spaces/RES/pages/895376163/%D0%A1%D0%BF%D0%B5%D1%86%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D1%8F+%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D1%81%D1%81%D0%B0+%E2%80%94+Meta+User+Voice+Travel+CES",
        "primary": false
      }
    ]
  },
  "2687:10083": {
    "id": "vibe-code-hosting",
    "shortDescription": "Позволяет делиться вайбкод-прототипами с коллегами и респондентами.",
    "categories": [
      "Prototyping",
      "Team processes"
    ],
    "type": "service",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://docs.k.avito.ru/service-paas-docs/genai/pages/use_cases/prototype_hosting/",
        "primary": false
      }
    ]
  },
  "3469:10501": {
    "id": "ux-research-hub",
    "shortDescription": "Размечает интервью и собирает единую базу пользовательских знаний.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "service",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть сервис",
        "url": "https://n8n-tns.k.avito.ru/webhook/b8b1fdbd-af34-4531-a031-e34c00893306",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Описание в Confluence",
        "url": "https://cf.avito.ru/x/bygmNg",
        "primary": false
      }
    ]
  },
  "842:11160": {
    "id": "library-refresh",
    "shortDescription": "Находит изменения в библиотеке и создаёт задачу ответственному дизайнеру.",
    "categories": [
      "Design System",
      "Automation"
    ],
    "type": "workflow",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "4734:14155": {
    "id": "stiletto-slides",
    "shortDescription": "Веб-сервис для работы с презентациями в шаблонах Авито.",
    "categories": [
      "Automation",
      "Knowledge"
    ],
    "type": "service",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:11038": {
    "id": "task-decomposer",
    "shortDescription": "Декомпозирует фичу и создаёт пачку задач по шаблону.",
    "categories": [
      "Team processes",
      "Automation"
    ],
    "type": "bot",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "3712:11319": {
    "id": "figma-prototype-builder",
    "shortDescription": "Собирает кликабельный прототип из макетов Figma для UX-тестов.",
    "categories": [
      "Prototyping",
      "Automation"
    ],
    "type": "plugin",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2687:10197": {
    "id": "competency-matrix",
    "shortDescription": "Помогает оценить навыки и понять готовность к повышению грейда.",
    "categories": [
      "Team processes",
      "Knowledge"
    ],
    "type": "service",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть инструмент",
        "url": "https://apakulova.github.io/skills-matrix/",
        "primary": true
      }
    ]
  },
  "3469:11086": {
    "id": "bootcamp-review-bot",
    "shortDescription": "Ускоряет проверку тестовых заданий в буткемпе.",
    "categories": [
      "Team processes",
      "Automation"
    ],
    "type": "bot",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2687:9969": {
    "id": "sync-critique",
    "shortDescription": "Помогает проводить внутренние синки и дизайн-критику команды.",
    "categories": [
      "Team processes",
      "Design review"
    ],
    "type": "service",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть инструмент",
        "url": "https://caxapoff.github.io/design_osmotr/",
        "primary": true
      }
    ]
  },
  "374:3577": {
    "id": "mattermost-digest",
    "shortDescription": "Ежедневно собирает статусы задач, отпусков и запусков в единый дайджест.",
    "categories": [
      "Team processes",
      "Automation"
    ],
    "type": "bot",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "3575:11190": {
    "id": "briefolog",
    "shortDescription": "Уточняет бриф на рассылку и помогает быстрее получить качественный текст.",
    "categories": [
      "Text",
      "Team processes"
    ],
    "type": "bot",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть брифолог",
        "url": "https://llm.k.avito.ru/project/afb0e117-1315-4d54-834a-9d0adffc14ce",
        "primary": true
      }
    ]
  },
  "4108:11866": {
    "id": "reminder-coordinator",
    "shortDescription": "Напоминает о шагах процесса, дежурных и согласованиях.",
    "categories": [
      "Team processes",
      "Automation"
    ],
    "type": "bot",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "guide",
        "label": "Открыть описание",
        "url": "https://cf.avito.ru/x/NlbbOw",
        "primary": false
      }
    ]
  },
  "374:10612": {
    "id": "adt-training-app",
    "shortDescription": "Telegram-приложение для развития дизайн-принципов и visibility.",
    "categories": [
      "Team processes",
      "Knowledge"
    ],
    "type": "bot",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:8660": {
    "id": "respondent-exporter",
    "shortDescription": "Готовит скрипт для выгрузки респондентов из базы для исследования.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "agent",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:10550": {
    "id": "research-copy-editor",
    "shortDescription": "Помогает писать тексты для опросов, анкет и приглашений.",
    "categories": [
      "Research",
      "Text"
    ],
    "type": "bot",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "chat",
        "label": "Открыть редактор",
        "url": "https://chatgpt.com/g/g-6900c234c8c88191ad9e2d7daf38e418-ruchnoi-redaktor-dlia-issledovatelei",
        "primary": true
      }
    ]
  },
  "374:8904": {
    "id": "survey-structurer",
    "shortDescription": "Даёт рекомендации по формулировкам с опорой на базу знаний.",
    "categories": [
      "Research",
      "Text"
    ],
    "type": "agent",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:9392": {
    "id": "research-report-reviewer",
    "shortDescription": "Проверяет исследовательские отчёты и ищет критические блокеры.",
    "categories": [
      "Research",
      "Design review"
    ],
    "type": "agent",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "469:8077": {
    "id": "briefing-assistant",
    "shortDescription": "Задаёт вопросы заказчику, уточняет бриф и создаёт задачу в Jira.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "bot",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:9758": {
    "id": "cursor-csat",
    "shortDescription": "Склеивает выгрузки опросов, считает метрики и готовит отчёт.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "agent",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "guide",
        "label": "Открыть описание",
        "url": "https://cf.avito.ru/x/x2wmNg",
        "primary": false
      }
    ]
  },
  "374:10124": {
    "id": "competitor-agents",
    "shortDescription": "Собирает условия, релизы и новости рынка в сводку.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "agent",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "guide",
        "label": "Открыть описание",
        "url": "https://cf.avito.ru/x/sDyaNQ",
        "primary": false
      }
    ]
  },
  "2577:9936": {
    "id": "gate-okr-docs",
    "shortDescription": "Наполняет документы по гейтам и OKR из разных источников.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "agent",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2589:10131": {
    "id": "ai-backlog",
    "shortDescription": "Помогает запросить сводку ключевых проблем по сценарию.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "bot",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:9940": {
    "id": "production-copy-agent",
    "shortDescription": "Находит текст в коде, проверяет его скиллом и создаёт pull request.",
    "categories": [
      "Text",
      "Automation"
    ],
    "type": "agent",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:5779": {
    "id": "heuristic-screen-audit",
    "shortDescription": "Ускоряет первичный UX-аудит экранов и помогает находить проблемы во flow.",
    "categories": [
      "Research",
      "Design review"
    ],
    "type": "skill",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "chat",
        "label": "Открыть UX-аудит",
        "url": "https://chatgpt.com/g/g-68ee5b25ffd481919f78683f6a2bc5bc-ux-audit/c/69e779af-7aa8-8324-a120-3e51ef08c598",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть исследование",
        "url": "https://arxiv.org/pdf/2507.02306",
        "primary": false
      }
    ]
  },
  "3469:10618": {
    "id": "classified-news",
    "shortDescription": "Собирает новости рынка классифайда и формулирует продуктовые гипотезы.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "workflow",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "channel",
        "label": "Открыть канал",
        "url": "https://t.me/classifiedsnews",
        "primary": true
      }
    ]
  },
  "3469:10735": {
    "id": "team-building-quiz",
    "shortDescription": "Помогает командам узнавать друг друга через игровые вопросы.",
    "categories": [
      "Team processes"
    ],
    "type": "service",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть квиз",
        "url": "https://teamquiz-production.up.railway.app",
        "primary": true
      }
    ]
  },
  "374:5155": {
    "id": "ai-research-search",
    "shortDescription": "Ищет данные и исследования через AI Research.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:8538": {
    "id": "knowledge-base-ai",
    "shortDescription": "Объединяет хранение, разметку и поиск внутренних знаний.",
    "categories": [
      "Knowledge",
      "Research"
    ],
    "type": "service",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "842:10184": {
    "id": "akita-icon-generator",
    "shortDescription": "Создаёт component set из одной готовой иконки в трёх размерах.",
    "categories": [
      "Design System",
      "Automation"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1628831664417940031",
        "primary": true
      }
    ]
  },
  "842:11404": {
    "id": "akita-icons-validator",
    "shortDescription": "Проверяет ошибки оформления и часть проблем исправляет автоматически.",
    "categories": [
      "Design System",
      "Design review"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1629179776041025350",
        "primary": true
      }
    ]
  },
  "3443:10471": {
    "id": "component-regression",
    "shortDescription": "Сверяет ожидаемое поведение компонента в Figma с реализацией в коде.",
    "categories": [
      "Design System",
      "Design review"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "install",
        "label": "Получить скилл",
        "url": "https://nc.k.avito.ru/f/52184774",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/spaces/DS/pages/908478754/Regress",
        "primary": false
      }
    ]
  },
  "3444:10543": {
    "id": "component-spec-generator",
    "shortDescription": "Собирает каноническую спецификацию компонента по чеклисту.",
    "categories": [
      "Design System",
      "Knowledge"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть скилл",
        "url": "https://plato.k.avito.ru/skills/cd2ae6c4-c2f4-4371-826a-4c920a4d24a4",
        "primary": true
      }
    ]
  },
  "3498:10916": {
    "id": "akita-variables-export",
    "shortDescription": "Выгружает данные из variables для чтения скрытых значений.",
    "categories": [
      "Design System",
      "Automation"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1654863800712143195",
        "primary": true
      }
    ]
  },
  "1960:9455": {
    "id": "design-system-check",
    "shortDescription": "Проверяет макет на соответствие токенам, стилям и deprecated-компонентам.",
    "categories": [
      "Design System",
      "Design review"
    ],
    "type": "plugin",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2270:9129": {
    "id": "akita-version",
    "shortDescription": "Фиксирует изменения библиотеки на отдельной странице с датой.",
    "categories": [
      "Design System",
      "Team processes"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть виджет",
        "url": "https://www.figma.com/community/widget/1672591916994786530",
        "primary": true
      }
    ]
  },
  "580:6121": {
    "id": "avito-ds-autohub",
    "shortDescription": "Собирает мастер-компонент, спецификацию и код для Storybook.",
    "categories": [
      "Design System",
      "Automation"
    ],
    "type": "workflow",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "2957:9843": {
    "id": "semantic-tokens",
    "shortDescription": "Расставляет семантические цветовые токены и текстовые стили из AKITA.",
    "categories": [
      "Design System",
      "Automation"
    ],
    "type": "plugin",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть плагин",
        "url": "https://www.figma.com/community/plugin/1643602237421717731",
        "primary": true
      }
    ]
  },
  "4108:11515": {
    "id": "claude-design-system",
    "shortDescription": "Помогает быстро визуализировать Avito-like прототипы без Figma.",
    "categories": [
      "Prototyping",
      "Design System"
    ],
    "type": "skill",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "4108:11632": {
    "id": "vscode-ui",
    "shortDescription": "Генерирует UI на основе технологий Бедуин и Брикс.",
    "categories": [
      "Prototyping",
      "Automation"
    ],
    "type": "plugin",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "4996:14045": {
    "id": "atlas",
    "shortDescription": "Объединяет AI-сервисы в одной точке входа для исследования, прототипов и презентаций.",
    "categories": [
      "Knowledge",
      "Automation"
    ],
    "type": "service",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "announcement",
        "label": "Посмотреть анонс",
        "url": "https://t.me/iidem_dalshe/309",
        "primary": false
      }
    ]
  },
  "4996:13925": {
    "id": "cjm-analysis",
    "shortDescription": "Сокращает анализ flow с 60 до 15 минут и выдаёт карту экранов с проблемами.",
    "categories": [
      "Research",
      "Design review"
    ],
    "type": "agent",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "announcement",
        "label": "Посмотреть анонс",
        "url": "https://t.me/iidem_dalshe/309",
        "primary": false
      }
    ]
  },
  "4108:12100": {
    "id": "research-report-skill",
    "shortDescription": "Помогает разложить доказательства, посчитать показатели и собрать черновик отчёта.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:11983": {
    "id": "skills-agents-catalog",
    "shortDescription": "Собирает skills и инструкции по их установке в одном месте.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:12217": {
    "id": "quant-survey-analyzer",
    "shortDescription": "Анализирует CSV, TSV и XLSX с количественными опросами.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:12334": {
    "id": "guide-builder",
    "shortDescription": "Создаёт и проверяет топик-гайд, анкету или сценарий теста.",
    "categories": [
      "Research",
      "Text"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:12451": {
    "id": "brief-audit",
    "shortDescription": "Ищет прошлые исследования, противоречия и пробелы по брифу.",
    "categories": [
      "Research",
      "Knowledge"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:12568": {
    "id": "methodology-planner",
    "shortDescription": "Помогает выбрать метод, аудиторию, выборку и план исследования.",
    "categories": [
      "Research",
      "Team processes"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:12685": {
    "id": "voc-report-generator",
    "shortDescription": "Собирает квартальный VoC-отчёт с проверкой источников.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "skill",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть каталог скиллов",
        "url": "https://prototype-hosting.k.avito.ru/prototype/research-skills-catalog-talx4/index.html",
        "primary": true
      },
      {
        "kind": "guide",
        "label": "Открыть документацию",
        "url": "https://cf.avito.ru/x/NCkSNQ",
        "primary": false
      }
    ]
  },
  "4108:12802": {
    "id": "synthetic-respondents",
    "shortDescription": "Создаёт AI-аватары на основе баз данных для мини-интервью.",
    "categories": [
      "Research"
    ],
    "type": "service",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "4108:12919": {
    "id": "survey-alert-bot",
    "shortDescription": "Предупреждает, когда опрос собирает больше 1000 ответов.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "bot",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "5003:15213": {
    "id": "uxf-bundle",
    "shortDescription": "Находит свежие UXF, группирует срезы и готовит отчёт по шаблону.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "workflow",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:7329": {
    "id": "text-editor-legacy",
    "shortDescription": "Плагин для работы с текстами и редакционной политикой.",
    "categories": [
      "Text"
    ],
    "type": "plugin",
    "status": "beta",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:5594": {
    "id": "ai-editor-development",
    "shortDescription": "Развитие внутреннего AI-редактора текстов.",
    "categories": [
      "Text"
    ],
    "type": "agent",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:10002": {
    "id": "backlog-enrichment",
    "shortDescription": "Дополняет тикеты актуальной информацией и помогает считать сигналы.",
    "categories": [
      "Research",
      "Automation"
    ],
    "type": "workflow",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "374:9636": {
    "id": "ai-prototyping",
    "shortDescription": "Создаёт прототипы для тестирования.",
    "categories": [
      "Prototyping"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "install",
        "label": "Получить плагин",
        "url": "https://drive.google.com/drive/folders/1rAJJGC14wwQs_mCBNgvT0xcBjS5acvC_?usp=sharing",
        "primary": true
      },
      {
        "kind": "discussion",
        "label": "Инструкция по корпоративному GitHub",
        "url": "https://mt.avito.ru/avito/pl/u9y5h5wrftni7b4mxpcmerynjo",
        "primary": false
      }
    ]
  },
  "5084:13751": {
    "id": "avikot-review-extension",
    "shortDescription": "",
    "categories": [
      "Design review"
    ],
    "type": "service",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01",
    "actionOverrides": [
      {
        "kind": "tool",
        "label": "Открыть инструмент",
        "url": "https://avikot.k.avito.ru/",
        "primary": true
      }
    ]
  },
  "5158:14469": {
    "id": "uxf-bundle-5158",
    "shortDescription": "",
    "categories": [
      "Research"
    ],
    "type": "workflow",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "5580:15311": {
    "id": "layout-approval",
    "shortDescription": "",
    "categories": [
      "Design review"
    ],
    "type": "plugin",
    "status": "development",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  },
  "5158:14545": {
    "id": "loader-plugin",
    "shortDescription": "Подготавливает лоадер по DS Akita во время подготовки спек",
    "categories": [
      "Design System"
    ],
    "type": "plugin",
    "status": "ready",
    "impactTags": [],
    "howToStart": [],
    "updatedAt": "2026-09-01",
    "createdAt": "2026-09-01"
  }
};
