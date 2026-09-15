export const FIGMA_FILE_KEY='nVLcu3bbLgz0lJhSUexjvx';
export const FIGMA_FILE_URL=`https://www.figma.com/design/${FIGMA_FILE_KEY}/30-AI-Process-Upgrades`;
export const TOOL_NODE_IDS=[
'374:1509','374:7329','374:5992','2687:10311','3469:10969','374:5594','374:7695','2988:9922','470:6413','374:7207','3469:10852','374:1580','374:7451','374:3855','374:8305','3188:10318','374:1651','374:10246','374:614','842:10794','1862:8991','1971:9081','2988:9842','374:3761','842:11282','374:9636','374:8061','842:10306','842:10672','2465:9156','2466:9226','374:9026','2687:10083','3469:10501','842:11160','4734:14155','842:11038','3712:11319','2687:10197','2687:9969','3469:11086','374:3577','3575:11190','374:9880','374:10612','842:10550','374:8660','374:8904','374:9392','469:8077','374:9758','374:10124','2577:9936','2589:10131','842:9940','374:5779','3469:10618','3469:10735','374:5155','374:8538','374:10002','842:10184','842:11404','3443:10471','3444:10543','3498:10916','1960:9455','2270:9129','580:6121','2957:9843','4108:11515','4108:11632','4996:14045','4996:13925','4108:11866','4108:11983','4108:12100','4108:12217','4108:12334','4108:12451','4108:12568','4108:12685','4108:12802','4108:12919','5003:15213'
];
export const IDEA_NODE_IDS=['2439:10986','2439:11056','374:4725','374:9270','374:6233','2439:11126','3119:10683','3119:10753','2537:9197','867:9066','2538:9300','2578:10028','4327:13514'];
export type ActionKind='tool'|'install'|'chat'|'channel'|'guide'|'discussion'|'announcement';
export interface ToolAction{kind:ActionKind;label:string;url:string;primary:boolean}
const a=(kind:ActionKind,label:string,url:string,primary=false):ToolAction=>({kind,label,url,primary});
export const ACTIONS_BY_NODE_ID:Record<string,ToolAction[]>= {
 '374:1509':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1621150885892028917',true),a('channel','Канал для доступов и обратной связи','https://mt.avito.ru/avito/channels/avito-editor-plugin')],
 '374:5992':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1610550602787796018/textsync',true)],
 '2687:10311':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1638816840468168578',true)],
 '470:6413':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1638571943514590458',true)],
 '3469:10852':[a('tool','Открыть инструмент','https://artifact.avito.ru/share/zwE3KaqEvy4JjsW7zh0-Tg',true)],
 '374:3855':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1611331720808016861',true)],
 '374:1651':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1605221516079243201',true)],
 '374:10246':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1636333597458971823/re-logo-resizer',true)],
 '842:10794':[a('tool','Открыть виджет','https://www.figma.com/community/widget/1646914114905321708/a-notes',true)],
 '1862:8991':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1608051932465313128',true)],
 '1971:9081':[a('tool','Открыть виджет','https://www.figma.com/community/widget/1611717453383378342',true)],
 '374:9026':[a('guide','Открыть описание процесса','https://cf.avito.ru/spaces/RES/pages/895376163/%D0%A1%D0%BF%D0%B5%D1%86%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%86%D0%B8%D1%8F+%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D1%81%D1%81%D0%B0+%E2%80%94+Meta+User+Voice+Travel+CES')],
 '2687:10083':[a('guide','Открыть документацию','https://docs.k.avito.ru/service-paas-docs/genai/pages/use_cases/prototype_hosting/')],
 '3469:10501':[a('tool','Открыть сервис','https://n8n-tns.k.avito.ru/webhook/b8b1fdbd-af34-4531-a031-e34c00893306',true),a('guide','Описание в Confluence','https://cf.avito.ru/x/bygmNg')],
 '374:9636':[a('install','Получить плагин','https://drive.google.com/drive/folders/1rAJJGC14wwQs_mCBNgvT0xcBjS5acvC_?usp=sharing',true),a('discussion','Инструкция по корпоративному GitHub','https://mt.avito.ru/avito/pl/u9y5h5wrftni7b4mxpcmerynjo')],
 '2687:10197':[a('tool','Открыть инструмент','https://apakulova.github.io/skills-matrix/',true)],
 '2687:9969':[a('tool','Открыть инструмент','https://caxapoff.github.io/design_osmotr/',true)],
 '3575:11190':[a('tool','Открыть брифолог','https://llm.k.avito.ru/project/afb0e117-1315-4d54-834a-9d0adffc14ce',true)],
 '842:10550':[a('chat','Открыть редактор','https://chatgpt.com/g/g-6900c234c8c88191ad9e2d7daf38e418-ruchnoi-redaktor-dlia-issledovatelei',true)],
 '374:5779':[a('chat','Открыть UX-аудит','https://chatgpt.com/g/g-68ee5b25ffd481919f78683f6a2bc5bc-ux-audit/c/69e779af-7aa8-8324-a120-3e51ef08c598',true)],
 '3469:10618':[a('channel','Открыть канал','https://t.me/classifiedsnews',true)],
 '3469:10735':[a('tool','Открыть квиз','https://teamquiz-production.up.railway.app',true)],
 '842:10184':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1628831664417940031',true)],
 '842:11404':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1629179776041025350',true)],
 '3443:10471':[a('install','Получить скилл','https://nc.k.avito.ru/f/52184774',true),a('guide','Открыть документацию','https://cf.avito.ru/spaces/DS/pages/908478754/Regress')],
 '3444:10543':[a('tool','Открыть скилл','https://plato.k.avito.ru/skills/cd2ae6c4-c2f4-4371-826a-4c920a4d24a4',true)],
 '3498:10916':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1654863800712143195',true)],
 '2270:9129':[a('tool','Открыть виджет','https://www.figma.com/community/widget/1672591916994786530',true)],
 '2957:9843':[a('tool','Открыть плагин','https://www.figma.com/community/plugin/1643602237421717731',true)],
 '4996:14045':[a('announcement','Посмотреть анонс','https://t.me/iidem_dalshe/309')],
 '4996:13925':[a('announcement','Посмотреть анонс','https://t.me/iidem_dalshe/309')]
};

export function validateSourceSnapshot(){
  if(TOOL_NODE_IDS.length!==85||new Set(TOOL_NODE_IDS).size!==85) throw new Error('Figma tool snapshot must contain 85 unique node IDs');
  if(IDEA_NODE_IDS.length!==13||new Set(IDEA_NODE_IDS).size!==13) throw new Error('Figma idea snapshot must contain 13 unique node IDs');
  for(const [nodeId, actions] of Object.entries(ACTIONS_BY_NODE_ID)){
    if(!TOOL_NODE_IDS.includes(nodeId)) throw new Error('Unknown action node ID: '+nodeId);
    if(actions.filter(action=>action.primary).length>1) throw new Error('Multiple primary actions: '+nodeId);
    for(const action of actions){
      if(action.primary&&!['tool','install','chat','channel'].includes(action.kind)) throw new Error('Invalid primary action kind: '+nodeId);
      if(['guide','discussion','announcement'].includes(action.kind)&&action.primary) throw new Error('Secondary action marked primary: '+nodeId);
    }
  }
  return true;
}
validateSourceSnapshot();
