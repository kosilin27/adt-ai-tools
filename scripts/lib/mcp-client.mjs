import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';

export function unwrap(value) {
  if (value?.jsonrpc) {
    if (value.error) throw new Error(value.error.message || JSON.stringify(value.error));
    return unwrap(value.result);
  }
  if (value?.isError) throw new Error((value.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n'));
  if (value?.structuredContent != null) return unwrap(value.structuredContent);
  if (value?.content) {
    const values=value.content.filter(x=>x.type==='text').map(x=>{
      if (x.text.trimStart().startsWith('event:')) return x.text.split('\n').filter(line=>line.startsWith('data:')).map(line=>unwrap(JSON.parse(line.slice(5))));
      try {return unwrap(JSON.parse(x.text));} catch(error) {if(error instanceof SyntaxError)return x.text;throw error;}
    }).flat();
    return values.length===1?values[0]:values;
  }
  return value;
}
// The runner supplies the supported CLI and credentials. No token is read from user files.
export async function connectMcp() {
  const command=JSON.parse(process.env.ADT_MCP_COMMAND || '["avito-ai","mcp-hub"]');
  if (!Array.isArray(command)||!command.length||command.some(x=>typeof x!=='string')) throw new Error('ADT_MCP_COMMAND must be a JSON argv array');
  const child=spawn(command[0],command.slice(1),{stdio:['pipe','pipe','pipe']});
  const pending=new Map();let serial=0;let tail='';
  child.stderr.on('data',d=>{tail=(tail+d.toString()).slice(-1000);});
  const fail=()=>{for(const {reject,timer}of pending.values()){clearTimeout(timer);reject(new Error('MCP process ended before response. Check runner authentication.'));}pending.clear();};
  child.on('error',fail);child.on('exit',fail);
  createInterface({input:child.stdout}).on('line',line=>{
    let msg;try{msg=JSON.parse(line);}catch{return;}
    const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);
    if(msg.error)p.reject(new Error(msg.error.message));else p.resolve(msg.result);
  });
  const notify=(method,params={})=>child.stdin.write(JSON.stringify({jsonrpc:'2.0',method,params})+'\n');
  const request=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`MCP ${method} timed out; reconcile remote state before retrying a write`));},60000);
    pending.set(id,{resolve,reject,timer});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
  });
  try {await request('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'adt-ai-tools-publisher',version:'1'}});notify('notifications/initialized');}
  catch(error){child.kill();throw error;}
  const inventory=await request('tools/list');
  const registered=new Set((inventory.tools||[]).map(t=>t.name));
  return {call:async(server,tool,args)=>{
    const native=`${server}__${tool}`;
    if(!registered.has(native))throw new Error(`MCP tool ${native} is not registered. Pin its server or use the documented direct connection before publishing.`);
    return unwrap(await request('tools/call',{name:native,arguments:args}));
  },close:()=>child.kill()};
}
