import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const requireCore=createRequire(new URL('../../xopc/package.json',import.meta.url));
const {serve}=await import(pathToFileURL(requireCore.resolve('@hono/node-server')).href);
import { ConfigSchema } from '../../xopc/src/config/schema.js';
import { seedTestAgentCatalog } from '../../xopc/src/agent-catalog/test-support.js';
import { openXopcDatabase, closeXopcDatabase } from '../../xopc/src/storage/sqlite/connection.js';
import { AgentPluginStore } from '../../xopc/src/extensions/agent-plugins/store.js';
import { agentPluginInventoryRow } from '../../xopc/src/extensions/agent-plugins/inventory.js';
import { pluginServerId } from '../../xopc/src/extensions/agent-plugins/validation.js';
import { prepareNativeMcpConfig } from '../../xopc/src/agent/mcp/native-mcp.js';
import { createHonoApp } from '../../xopc/src/gateway/hono/app.js';
import { cancelAllPluginCliAuthorizations } from '../../xopc/src/extensions/agent-plugins/cli-authorization.js';
import type { GatewayService } from '../../xopc/src/gateway/service.js';
import { invokePreparedTool } from '../../xopc/scripts/lib/plugin-lab-runtime.mts';
const repository=resolve(process.env.XOPC_PLUGIN_CATALOG_REPO||'../xopc-plugins'),release=JSON.parse(await readFile(join(repository,'dist/release-manifest.json'),'utf8'));
const names=['pdf-reader','file-organizer'];release.plugins=release.plugins.filter((p:any)=>names.includes(p.name));assert.equal(release.plugins.length,2);
const evidence=resolve(process.env.XOPC_PLUGIN_CATALOG_EVIDENCE||'/tmp/xopc-office-v2-store-e2e');await mkdir(evidence,{recursive:true});
const root=await mkdtemp(join(tmpdir(),'xopc-catalog-e2e-'));
Object.assign(process.env,{XOPC_STATE_DIR:root,PI_CODING_AGENT_DIR:join(root,'pi'),XOPC_CONFIG_PATH:join(root,'xopc.json'),XOPC_WORKSPACE:root,XOPC_LOG_LEVEL:'fatal',XOPC_SKILLS_STORE_URL:'https://store.xopc.ai',XOPC_EXTENSIONS_STORE_URL:'https://store.xopc.ai'});
const auth={mode:'token' as const,token:randomUUID()},config=ConfigSchema.parse({gateway:{auth,skillsStoreBaseUrl:'https://store.xopc.ai'}});await writeFile(process.env.XOPC_CONFIG_PATH!,JSON.stringify(config));
openXopcDatabase();seedTestAgentCatalog({agents:[{id:'main',enabled:true,workspace:root,profile:{name:'Main'}},{id:'other',enabled:true,workspace:root,profile:{name:'Other'}}]});
const service={currentConfig:config,getResolvedAuth:()=>auth,getAuthToken:()=>auth.token,getEffectiveListenPort:()=>18790,isGatewayReady:()=>true,getExtensionLoader:()=>null,marketplace:{reloadSkills(){}}} as unknown as GatewayService;
const app=createHonoApp({service}),gateway=serve({fetch:app.fetch,hostname:'127.0.0.1',port:0});if(!gateway.listening)await once(gateway,'listening');const address=gateway.address();assert(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`,store=new AgentPluginStore();
async function api(path:string,method='GET',body?:unknown){const r=await fetch(base+path,{method,headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(180000)});const data:any=await r.json();assert.equal(r.status,200,`${path}: ${JSON.stringify(data)}`);return data.payload??data;}
async function job(id:string){return api(`/api/extensions/agent-plugins/${id}/setup`);}
async function act(id:string,action:string,values:Record<string,unknown>={}){const current=await job(id);let next=await api(`/api/extensions/agent-plugins/${id}/setup`,'POST',{action,expectedRevision:current.revision,idempotencyKey:randomUUID(),...values});for(let i=0;i<1800&&next.state==='running';i++){await new Promise(r=>setTimeout(r,100));next=await job(id);}assert.notEqual(next.state,'running');return next;}

const results:any[]=[];
await mkdir(join(root,'selected'));await writeFile(join(root,'selected/note.txt'),'Synthetic office note');await writeFile(join(root,'selected/sales.csv'),'amount\n1234.56\n');
try {
 assert.equal((await fetch(base+'/api/extensions/inspect',{method:'POST'})).status,401);
 for(const pkg of release.plugins){
  const detail:any=await (await fetch(`https://store.xopc.ai/api/v1/packages/${pkg.name}`)).json();assert.equal(detail.latestVersion.version,pkg.version);assert.equal(detail.latestVersion.sha256,pkg.sha256);
  const source=`store:${pkg.name}@${pkg.version}`,plan=await api('/api/extensions/inspect','POST',{source});assert.equal(plan.diagnostics.length,0,JSON.stringify(plan.diagnostics));
  const row=await api('/api/extensions/install','POST',{source,reviewHash:plan.reviewHash,setup:true});const id=row.pluginId;assert(id);
  let state=await act(id,'prepare');assert.equal(state.resources,'ready',JSON.stringify(state));assert(state.connections.every((c:any)=>c.state==='connected'),JSON.stringify(state));
  state=await act(id,'complete');assert.equal(state.state,'completed');
  const local=state.connections[0];assert(local);const native=await prepareNativeMcpConfig(config,root,'main');const name=pluginServerId(id,local.name),selected={...native,servers:native.servers.filter(s=>s.name===name)};
  async function call(description:string,args:any,expected:string){const result=JSON.parse(await invokePreparedTool(selected,root,name,expected,{toolDescription:description,arguments:args}));assert(!result.isError,JSON.stringify(result));return JSON.parse(result.content.find((c:any)=>c.type==='text').text);}
  if(pkg.name==='pdf-reader'){
   const value=await call('Read 1–10',{path:join(repository,'tests/fixtures/ocr/bilingual-scan.pdf'),startPage:1,endPage:1},'1234.56');assert.equal(value.processedLocally,true);assert.equal(value.pages[0].method,'ocr');assert(value.pages[0].text.replaceAll(/\s/g,'').includes('发票金额'));
   results.push({name:pkg.name,version:pkg.version,ocr:true,resources:store.get(id)?.resources?.length,amount:'1234.56',pages:1});
  }else{
   await call('List one level',{root:join(root,'selected')},'sales.csv');
   const preview=await call('Preview grouping',{root:join(root,'selected'),files:['note.txt','sales.csv']},'planId');assert.equal(await readFile(join(root,'selected/note.txt'),'utf8'),'Synthetic office note');
   await call('Apply the exact',{planId:preview.planId,digest:preview.digest,confirm:true},'applied');assert.equal(await readFile(join(root,'selected/documents/note.txt'),'utf8'),'Synthetic office note');
   await call('Restore files',{planId:preview.planId,confirm:true},'undone');assert.equal(await readFile(join(root,'selected/sales.csv'),'utf8'),'amount\n1234.56\n');
   results.push({name:pkg.name,version:pkg.version,inventory:true,preview:true,apply:true,undo:true,independentReadback:true});
  }
  for(const agent of ['main','other'])assert(store.active(agent,root).some(p=>p.id===id));assert(new AgentPluginStore().get(id)?.receipt.enabled);
  results.at(-1).globalAgents=2;results.at(-1).durable=true;console.log(JSON.stringify(results.at(-1)));
 }
 const report={ok:true,completedAt:new Date().toISOString(),mode:'Public Store install + authenticated Gateway + native pi MCP (deterministic dispatch)',results};await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,evidence}));
} finally {cancelAllPluginCliAuthorizations();await new Promise<void>(resolve=>gateway.close(()=>resolve()));closeXopcDatabase();await rm(root,{recursive:true,force:true});}
process.exit(0);
