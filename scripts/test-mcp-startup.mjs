import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {connectMcp} from './lib/mcp-client.mjs';
const directory=mkdtempSync(join(tmpdir(),'adt-mcp-startup-'));
const fixture=join(directory,'fixture.mjs');
writeFileSync(fixture,`
import {createInterface} from 'node:readline';
let ready=false;
createInterface({input:process.stdin}).on('line',line=>{
 const m=JSON.parse(line);if(!m.id)return;
 let result={};
 if(m.method==='tools/list')result={tools:ready?[{name:'confluence-mcp__get_page'}]:[{name:'mcp_hub_status'}]};
 if(m.method==='tools/call'){
  if(m.params.name==='mcp_hub_status'){ready=true;result={content:[{type:'text',text:'MCP Hub connected'}]};}
  else if(m.params.name==='confluence-mcp__get_page')result={structuredContent:{page_id:'1',version:2,body:'Ready'}};
  else result={isError:true,content:[{type:'text',text:'Unexpected generic discovery call'}]};
 }
 process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:m.id,result})+'\\n');
});`);
const old=process.env.ADT_MCP_COMMAND;
try{
 process.env.ADT_MCP_COMMAND=JSON.stringify([process.execPath,fixture]);
 const client=await connectMcp();
 try{assert.deepEqual(await client.call('confluence-mcp','get_page',{ref:'1'}),{page_id:'1',version:2,body:'Ready'});}
 finally{client.close();}
 console.log('MCP cold-start registration and native-tool dispatch: PASS');
}finally{if(old===undefined)delete process.env.ADT_MCP_COMMAND;else process.env.ADT_MCP_COMMAND=old;rmSync(directory,{recursive:true,force:true});}
