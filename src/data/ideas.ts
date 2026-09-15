import { IDEA_NODE_IDS } from './figmaSource';

export interface Idea {
  id: string;
  figmaNodeId: string;
  title: string;
  audiences: string[];
  owner?: string;
  sourceStatus?: string;
  problem?: string;
  actionUrl?: string;
  description?: string;
  status?: 'EXPLORING'|'LOOKING FOR OWNER';
}

const rawIdeas: Omit<Idea, 'figmaNodeId'>[] = [
  { id:'idea-text-check', title:'Сервис для проверки текстов на ТоВ и термины', audiences:['Text'], owner:'Стас Бортник / @ssbortnik', sourceStatus:'Разрабатывается', problem:'Упрощаем для редактора процесс работы над своими текстами. Потенциально можно масштабировать на другие функции' },
  { id:'idea-market-references', title:'Сбор текстовых референсов с рынка', audiences:['Text'], owner:'Лера Жидких / @vszhidkikh', sourceStatus:'Разрабатывается', problem:'Сбор референсов занимает время, иногда можем охватывать не все варианты' },
  { id:'idea-ai-tasks', title:'Использование AI для описания и структурирования задач', audiences:['Design'], owner:'Валентин Димитров', sourceStatus:'Тестируется', actionUrl:'https://llm.k.avito.ru/project/8134c049-78ad-4846-bf6f-46adbf3278f5' },
  { id:'idea-ai-backlog', title:'AI беклог в SPT', audiences:['Research'], owner:'Мария Московкина' },
  { id:'idea-auto-labeling', title:'Авторазметка', audiences:['Design'], owner:'@dashabanov' },
  { id:'idea-nemode-figma', title:'Поженить немоды и Figma', audiences:['Research'], owner:'@makorotkevich' },
  { id:'idea-roastframe', title:'Roastframe', audiences:['Design'], owner:'Настя Лощёнкина [Goods]' },
  { id:'idea-rewards', title:'Начисление вознаграждений', audiences:['Research'], owner:'Анна Латышева' },
  { id:'idea-presentations', title:'AI-оформление презентаций', audiences:['Research'], owner:'Гульнур Гибаева' },
  { id:'idea-communication-map', title:'Communication map', audiences:['Design','Text','Research'], owner:'Никита Чернецкий' },
  { id:'idea-concept-tests', title:'Быстрый тест продуктовых концепций', audiences:['Research'], owner:'???' },
  { id:'idea-hypothesis-okr', title:'AI-агент генерации гипотез/OKR', audiences:['Research'], owner:'Маша Нижегородова' },
  { id:'idea-unmoderated-test', title:'Навык, который поможет дизайнеру создать немодерируемый тест без физических движений мышки', audiences:['Research'], owner:'Дима Баршев' },
];

export const ideas: Idea[] = rawIdeas.map((idea, index) => ({ ...idea, description: idea.problem, status: idea.sourceStatus as Idea['status'], figmaNodeId: IDEA_NODE_IDS[index] }));
