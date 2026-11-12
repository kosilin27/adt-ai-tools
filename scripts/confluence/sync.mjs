import {readFileSync,writeFileSync,mkdirSync,renameSync,rmdirSync} from 'node:fs';
import {FIGMA_CASES_SNAPSHOT,FIGMA_BACKLOG_SNAPSHOT} from '../../src/data/figmaCasesSnapshot.ts';
import {resolve} from 'node:path';
import {connectMcp} from '../lib/mcp-client.mjs';
import {sourceSections,setupSections,caseSections,catalogSections,agentSections,skillSections,metaSections,renderBody,agentSkills,fingerprint,marker,html} from './render.mjs';
import {agentCaseLink,caseDiscoverySections} from './case-pages.mjs';
import {publishCasePages} from './publish-case-pages.mjs';
const apply=process.argv.includes('--apply');
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
async function publish(id,title,sections,{legacy=false}={}){
 if(!id)return;
 const current=await read(id);if(!current?.body||!current.version)throw new Error(`Unreadable or unversioned page ${id}`);
 const hash=fingerprint(sections),stamp=`ADT sync fingerprint: ${hash}`;
 if(current.body.includes(stamp)){report.push({pageId:id,title,operation:'unchanged',version:current.version});return;}
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
 for(const [h,b]of Object.entries(sections)){
  if(current.body.includes(`<h2>${html(h)}</h2>`))operations.push({op:'replace_section',heading:h,body:b});
  else if(legacy&&operations.length===0&&current.body.includes('<table')){
   const dataRow=current.body.match(/<tr[^>]*>\s*<td[\s\S]*?<\/tr>/)?.[0];
   const cells=[...(dataRow||'').matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m=>m[1]);
   const first=/^\d+$/.test(text(cells[0]||''))?cells[2]:cells[0];
   if(!first)throw new Error(`Cannot find legacy source table ${id}`);
   operations.push({op:'replace_block',find:text(first),element:'table',occurrence:1,body:heading(h,b)});
  }else operations.push({op:'insert_block',find:anchor,element:'h1',occurrence:1,position:'after',body:heading(h,b)});
 }
 // Existing pages retain manual sections. Only obsolete, source-owned sync blocks are replaced.
 if(legacy){
  if(id===registry.cases){
   if(current.body.includes('Снимок синхронизирован 23 сентября 2026.'))operations.push({op:'replace_block',find:'Снимок синхронизирован 23 сентября 2026.',element:'p',body:'<p>Текущие данные представлены в таблицах Figma sync. Шаблонные строки не считаются кейсами. Предыдущие снимки доступны в истории страницы.</p>'});
   if(current.body.includes('Ещё 11 актуальных строк из Figma'))operations.push({op:'replace_section',heading:'Ещё 11 актуальных строк из Figma',body:'<p>Исторический блок заменён текущим полным parse: пустые template rows исключаются с диагностикой; заполненные кейсы входят в основную таблицу. Старые значения сохранены в истории страницы.</p>'});
  }
  for(const h of ['Синхронизация с актуальным Figma — 15 октября 2026','Синхронизация с Figma — 15 октября 2026','Новые агенты и скиллы из актуального Figma — 15 октября 2026'])if(current.body.includes(`<h2>${h}</h2>`))operations.push({op:'replace_section',heading:h,body:'<p>Историческая отметка. Актуальный состав, статусы и ссылки приведены в секциях sync выше. Переносы в Backlog / Ideas сохраняют Source ID и данные.</p>'});
 }
 if(current.body.includes('<h2>Sync metadata</h2>'))operations.push({op:'replace_section',heading:'Sync metadata',body:marker(hash)});
 else operations.push({op:'insert_block',find:anchor,element:'h1',occurrence:1,position:'after',body:heading('Sync metadata',marker(hash))});
 report.push({pageId:id,title,operation:apply?'update':'would-update',fromVersion:current.version,fingerprint:hash,operations:operations.length});
 if(!apply){
  await call('edit_page',{page_id:id,expected_version:current.version,operations,dry_run:true});
  return;
 }
 await call('edit_page',{page_id:id,expected_version:current.version,operations});
 const verified=await read(id);if(!verified.body.includes(stamp)||verified.version<=current.version)throw new Error(`Readback mismatch ${id}`);
 report.at(-1).verifiedVersion=verified.version;
}
async function publishRoot(){
 const page=await read(registry.root);
 const section=`<p>В актуальном основном frame: ${FIGMA_CASES_SNAPSHOT.length} кейсов; видимый статус «На проде» — у ${FIGMA_CASES_SNAPSHOT.filter(r=>r.sourceStatusValues.includes('На проде')).length}. Backlog / Ideas: ${FIGMA_BACKLOG_SNAPSHOT.length}. Identity: figmaNodeId. Перенесённые кейсы сохраняют исходные ID и metadata.</p><p><a href="https://cf.avito.ru/spaces/DES/pages/${registry.meta}">AI Skills for Agents — найти capability по задаче</a> · <a href="https://cf.avito.ru/spaces/DES/pages/${registry.cases}">Актуальные кейсы и идеи</a></p><p>Исторические показатели покрытия Jobs сохранены без пересчёта; актуальный состав кейсов приведён в этой секции.</p>`;
 const hash=fingerprint({section});
 if(page.body.includes(`ADT sync fingerprint: ${hash}`)){report.push({pageId:registry.root,operation:'unchanged',version:page.version});return;}
 const ops=[{op:'replace_section',heading:'Актуальная синхронизация',body:section+marker(hash)}];
 if(page.body.includes('кейсов и инициатив'))ops.push({op:'replace_block',find:'кейсов и инициатив',element:'li',body:`<li><strong>${FIGMA_CASES_SNAPSHOT.length}</strong> кейсов в основном Figma frame</li>`});
 if(page.body.includes('кейсов в основном Figma frame'))ops.push({op:'replace_block',find:'кейсов в основном Figma frame',element:'li',body:`<li><strong>${FIGMA_CASES_SNAPSHOT.length}</strong> кейсов в основном Figma frame</li>`});
 if(page.body.includes('идей в backlog'))ops.push({op:'replace_block',find:'идей в backlog',element:'li',body:`<li><strong>${FIGMA_BACKLOG_SNAPSHOT.length}</strong> идей в backlog</li>`});
 report.push({pageId:registry.root,operation:apply?'update-root':'would-update-root',fromVersion:page.version});
 if(apply){await call('edit_page',{page_id:registry.root,expected_version:page.version,operations:ops});const v=await read(registry.root);if(!v.body.includes(hash))throw new Error('Root readback mismatch');report.at(-1).verifiedVersion=v.version;}
}

async function repairLegacyNavigation(){
 for(const id of [registry.sources,registry.catalog]){
  if(!id)continue;const page=await read(id);const operations=[];
  if(id===registry.sources&&page.body.includes('Актуальные числа:'))operations.push({op:'replace_block',find:'Актуальные числа:',element:'p',body:'<p>Актуальный состав вычисляется из обоих Figma frames. Текущие числа и контракт приведены в Architecture / Sync contract ниже; исторические версии доступны в истории страницы.</p>'});
  if(id===registry.catalog&&page.body.includes('AI Cases — 98 строк из Figma'))operations.push({op:'replace_text',find:'AI Cases — 98 строк из Figma',replace:'AI Cases — актуальные кейсы и идеи Figma'});
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
 const readiness=await publishCasePages({registry,apply,call,read,locate,saveRegistry,report});
 registry.meta=await ensure('AI Skills for Agents',registry.parent,registry.meta);saveRegistry();
 if(registry.meta)for(const skill of agentSkills){
  registry.skills[skill.key]=await ensure(skill.name,registry.meta,registry.skills[skill.key]);saveRegistry();
  await publish(registry.skills[skill.key],skill.name,skillSections(skill));
 }
 await publish(registry.cases,'Каталог AI — кейсы Figma',caseSections(),{legacy:true});
 await publish(registry.catalog,'Каталог AI',catalogSections(id=>agentCaseLink(registry,id)),{legacy:true});
 await publish(registry.agents,'Каталог AI — агенты',agentSections(),{legacy:true});
 await publish(registry.meta,'AI Skills for Agents',{...metaSections(registry),...caseDiscoverySections(registry,readiness)});
 if(registry.meta)await publishRoot();
 if(registry.sources)await publish(registry.sources,'Sources & Sync',sourceSections());
 if(registry.setup)await publish(registry.setup,'Настроить себе AI',setupSections(registry));
 await repairLegacyNavigation();
 console.log(JSON.stringify({apply,pages:report},null,2));
}catch(error){report.push({error:error.message});console.error(error.message);process.exitCode=1;}
finally{writeFileSync('test-results/confluence-sync.json',JSON.stringify({apply,report},null,2)+'\n');mcp?.close();if(locked)rmdirSync(lockPath);}
