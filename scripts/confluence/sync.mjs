import {readFileSync,writeFileSync,mkdirSync,renameSync,rmdirSync} from 'node:fs';
import {FIGMA_CASES_SNAPSHOT,FIGMA_BACKLOG_SNAPSHOT} from '../../src/data/figmaCasesSnapshot.ts';
import {resolve} from 'node:path';
import {connectMcp} from '../lib/mcp-client.mjs';
import {sourceSections,setupSections,caseSections,catalogSections,agentSections,skillSections,metaSections,renderBody,agentSkills,fingerprint,marker,html,discoveryLink} from './render.mjs';
import {publishCasePages} from './publish-case-pages.mjs';
const apply=process.argv.includes('--apply');
const discoveryOnly=process.argv.includes('--discovery-only');
const registryPath=resolve('scripts/confluence/pages.json');
const registry=JSON.parse(readFileSync(registryPath));
registry.casePages ??= {};
const report=[];mkdirSync('test-results',{recursive:true});
const lockPath = registryPath + '.lock';
let locked = false;
let mcp;
const call=(tool,args)=>mcp.call('confluence-mcp',tool,args);
const read=id=>call('get_page',{ref:String(id),format:'storage',max_inline_bytes:1000000});
const heading=(h,b)=>`<h2>${html(h)}</h2>${b}`;
const text=s=>s.replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#39;',"'");
function saveRegistry(){
 if(!apply)return;
 const next=JSON.stringify(registry,null,2)+'\n';
 if(readFileSync(registryPath,'utf8')===next)return;
 const temporary=resolve(lockPath,'pages.json');
 writeFileSync(temporary,next);
 renameSync(temporary,registryPath);
}
async function locate(title,parent,relationship='ancestor'){
 const escaped=title.replaceAll('\\','\\\\').replaceAll('"','\\"');
 const found=await call('search',{query:`space = "${registry.space}" AND title = "${escaped}" AND ${relationship} = ${parent}`,query_type:'cql',limit:50});
 const ids=[...new Set([...String(typeof found==='string'?found:JSON.stringify(found)).matchAll(/\*\*ID:\*\* (\d+)/g)].map(m=>m[1]))];
 if(ids.length>1)throw new Error(`Ambiguous Confluence title: ${title}`);
 return ids[0]||null;
}
async function ensure(title,parent,known){
 if(known)return String(known);
 const existing=await locate(title,parent);if(existing)return existing;
 if(!apply){report.push({title,operation:'would-create',parent});return null;}
 const result=await call('save_page',{title,parent_page_id:String(parent),body:`<h1>${html(title)}</h1><p>ADT managed discovery page. Initializing structured content.</p>`});
 const encoded=JSON.stringify(result);
 const id=result?.page_id||result?.id||encoded.match(/(?:page_id|ID|id)[^\d]{1,8}(\d{6,})/)?.[1]||encoded.match(/\/pages\/(\d+)/)?.[1];
 if(!id)throw new Error('Create response needs reconciliation: '+encoded);
 report.push({pageId:String(id),title,operation:'created'});return String(id);
}
// Retire only the previously published, explicitly identified discovery sections.
const retiredHeadings = {
 cases: ['Актуальные кейсы — Figma sync', 'Backlog / Ideas — Figma sync', 'SYNC',
  'Ещё 11 актуальных строк из Figma', 'Синхронизация с актуальным Figma — 15 октября 2026'],
 catalog: ['Актуальная витрина — sync', 'Все данные каталога', 'SYNC', 'Синхронизация с Figma — 15 октября 2026'],
 agents: ['Актуальные Agents и Skills — sync', 'Input / Output / Knowledge sources', 'SYNC',
  'Новые агенты и скиллы из актуального Figma — 15 октября 2026'],
 meta: ['Все кейсы', 'Agent discovery instructions', 'Discovery index', 'Подробные инструкции к отдельным возможностям'],
};
const hasHeading = (body, title) => body.includes(`<h2>${html(title)}</h2>`);

async function publish(id,title,sections,{retired=[], obsoleteIntro=[]}={}){
 if(!id)return;
 const current=await read(id);if(!current?.body||!current.version)throw new Error(`Unreadable or unversioned page ${id}`);
 const hash=fingerprint(sections),stamp=`ADT sync fingerprint: ${hash}`;
 if(current.body.includes(stamp)&&!retired.some(h=>hasHeading(current.body,h))){report.push({pageId:id,title,operation:'unchanged',version:current.version});return;}
 if(current.body.includes('ADT managed discovery page. Initializing structured content.')){
  report.push({pageId:id,title,operation:apply?'initialize':'would-initialize',fromVersion:current.version,fingerprint:hash});
  if(apply){
   await call('save_page',{page_id:id,expected_version:current.version,body:renderBody(title,sections)});
   const verified=await read(id);if(!verified.body.includes(stamp))throw new Error(`Readback mismatch ${id}`);report.at(-1).verifiedVersion=verified.version;
  }
  return;
 }
 const anchor=text(current.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'');
 if(!anchor)throw new Error(`Missing heading anchor ${id}`);
 const operations=[];
 for(const h of retired){
  if(!hasHeading(current.body,h))continue;
  operations.push({op:'replace_section',heading:h,body:''});
  operations.push({op:'replace_block',element:'h2',find:h,body:''});
 }
 for(const intro of obsoleteIntro){
  if(current.body.includes(intro))operations.push({op:'replace_block',element:'p',find:intro,body:''});
 }
 for(const [h,b] of Object.entries(sections)){
  if(hasHeading(current.body,h))operations.push({op:'replace_section',heading:h,body:b});
  else operations.push({op:'insert_block',find:anchor,element:'h1',occurrence:1,position:'after',body:heading(h,b)});
 }
 const previousStamp=current.body.match(/<p>ADT sync fingerprint: [a-f0-9]{64}<\/p>/)?.[0];
 if(previousStamp)operations.push({op:'replace_block',find:text(previousStamp),element:'p',body:marker(hash)});
 else operations.push({op:'insert_block',find:anchor,element:'h1',occurrence:1,position:'after',body:heading('Sync metadata',marker(hash))});
 report.push({pageId:id,title,operation:apply?'update':'would-update',fromVersion:current.version,fingerprint:hash,operations:operations.length});
 if(!apply){
  await call('edit_page',{page_id:id,expected_version:current.version,operations,dry_run:true});
  return;
 }
 await call('edit_page',{page_id:id,expected_version:current.version,operations});
 const verified=await read(id);if(!verified.body.includes(stamp)||verified.version<=current.version||retired.some(h=>hasHeading(verified.body,h)))throw new Error(`Readback mismatch ${id}`);
 report.at(-1).verifiedVersion=verified.version;
}
async function publishRoot(){
 const page=await read(registry.root);
 const section=`<p>В актуальном основном frame: ${FIGMA_CASES_SNAPSHOT.length} кейсов; видимый статус «На проде» — у ${FIGMA_CASES_SNAPSHOT.filter(r=>r.sourceStatusValues.includes('На проде')).length}. Backlog / Ideas: ${FIGMA_BACKLOG_SNAPSHOT.length}. Identity: figmaNodeId. Перенесённые кейсы сохраняют исходные ID и metadata.</p><p>${discoveryLink(registry)}</p><p>Исторические показатели покрытия Jobs сохранены без пересчёта; актуальный состав кейсов приведён в этой секции.</p>`;
 const hash=fingerprint({section});
 if(page.body.includes(`ADT sync fingerprint: ${hash}`)){report.push({pageId:registry.root,operation:'unchanged',version:page.version});return;}
 const ops=[{op:'replace_section',heading:'Актуальная синхронизация',body:section+marker(hash)}];
 if(page.body.includes('кейсов и инициатив'))ops.push({op:'replace_block',find:'кейсов и инициатив',element:'li',body:`<li><strong>${FIGMA_CASES_SNAPSHOT.length}</strong> кейсов в основном Figma frame</li>`});
 if(page.body.includes('кейсов в основном Figma frame'))ops.push({op:'replace_block',find:'кейсов в основном Figma frame',element:'li',body:`<li><strong>${FIGMA_CASES_SNAPSHOT.length}</strong> кейсов в основном Figma frame</li>`});
 if(page.body.includes('идей в backlog'))ops.push({op:'replace_block',find:'идей в backlog',element:'li',body:`<li><strong>${FIGMA_BACKLOG_SNAPSHOT.length}</strong> идей в backlog</li>`});
 report.push({pageId:registry.root,operation:apply?'update-root':'would-update-root',fromVersion:page.version});
 if(!apply){await call('edit_page',{page_id:registry.root,expected_version:page.version,operations:ops,dry_run:true});return;}
 if(apply){await call('edit_page',{page_id:registry.root,expected_version:page.version,operations:ops});const v=await read(registry.root);if(!v.body.includes(hash))throw new Error('Root readback mismatch');report.at(-1).verifiedVersion=v.version;}
}

async function repairLegacyNavigation(){
 for(const id of [registry.sources]){
  if(!id)continue;const page=await read(id);const operations=[];
  if(id===registry.sources&&page.body.includes('Актуальные числа:'))operations.push({op:'replace_block',find:'Актуальные числа:',element:'p',body:'<p>Актуальный состав вычисляется из обоих Figma frames. Текущие числа и контракт приведены в Architecture / Sync contract ниже; исторические версии доступны в истории страницы.</p>'});
  if(!operations.length)continue;
  report.push({pageId:id,operation:apply?'repair-legacy-navigation':'would-repair-navigation',fromVersion:page.version});
  if(apply){await call('edit_page',{page_id:id,expected_version:page.version,operations});const v=await read(id);report.at(-1).verifiedVersion=v.version;}
 }
}

try{
 if(apply){
  mkdirSync(lockPath);
  locked=true;
  Object.assign(registry,JSON.parse(readFileSync(registryPath)));
  registry.casePages ??= {};
 }
 mcp=await connectMcp();
 if(!discoveryOnly){
  await publishCasePages({registry,apply,call,read,locate,saveRegistry,report});
  registry.meta=await ensure('AI Skills for Agents',registry.parent,registry.meta);saveRegistry();
  if(registry.meta)for(const skill of agentSkills){
   registry.skills[skill.key]=await ensure(skill.name,registry.meta,registry.skills[skill.key]);saveRegistry();
   await publish(registry.skills[skill.key],skill.name,skillSections(skill));
  }
 }
 if(!registry.meta)throw new Error('Canonical discovery page is not registered');
 await publish(registry.meta,'AI Skills for Agents',metaSections(registry),{retired:retiredHeadings.meta});
 const internalIntro = 'этот раздел не является отдельным входом для сотрудников.';
 await publish(registry.cases,'Каталог AI — кейсы Figma',caseSections(registry),
  {retired:retiredHeadings.cases,obsoleteIntro:[internalIntro]});
 await publish(registry.catalog,'Каталог AI',catalogSections(registry),{retired:retiredHeadings.catalog});
 await publish(registry.agents,'Каталог AI — агенты',agentSections(registry),
  {retired:retiredHeadings.agents,obsoleteIntro:[internalIntro,'здесь собраны агенты, которые уже помогают в работе Design Team.']});
 if(registry.meta)await publishRoot();
 if(!discoveryOnly&&registry.sources)await publish(registry.sources,'Sources & Sync',sourceSections());
 if(registry.setup)await publish(registry.setup,'Настроить себе AI',setupSections(registry));
 if(!discoveryOnly)await repairLegacyNavigation();
 console.log(JSON.stringify({apply,pages:report},null,2));
}catch(error){report.push({error:error.message});console.error(error.message);process.exitCode=1;}
finally{writeFileSync('test-results/confluence-sync.json',JSON.stringify({apply,report},null,2)+'\n');mcp?.close();if(locked)rmdirSync(lockPath);}
