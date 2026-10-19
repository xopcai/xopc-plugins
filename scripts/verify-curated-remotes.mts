// Snapshot audit before unpublishing broken releases; requires those Store versions to be listed.
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
const names=['notion-office','supabase','zoom'];release.plugins=release.plugins.filter((p:any)=>names.includes(p.name));assert.equal(release.plugins.length,3);
const evidence=resolve(process.env.XOPC_PLUGIN_CATALOG_EVIDENCE||'/tmp/xopc-curated-remotes-audit');await mkdir(evidence,{recursive:true});
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
try {
 for(const pkg of release.plugins){
  let id:string|undefined;
  try {
   const source=`store:${pkg.name}@${pkg.version}`,plan=await api('/api/extensions/inspect','POST',{source});assert.equal(plan.diagnostics.length,0,JSON.stringify(plan.diagnostics));const row=await api('/api/extensions/install','POST',{source,reviewHash:plan.reviewHash,setup:true});id=row.pluginId;
   let state=await act(id!,'prepare');const server=state.connections[0].name;
   await act(id!,'authorize',{server,method:'oauth'});let oauth:any;
   for(let i=0;i<150;i++){oauth=await api(`/api/extensions/agent-plugins/${id}/setup/auth/${server}`);if(oauth?.authorizationUrl||oauth?.error)break;await new Promise(r=>setTimeout(r,100));}
   assert(oauth?.authorizationUrl,JSON.stringify(oauth));const host=new URL(oauth.authorizationUrl).hostname;assert(/(^|\.)(notion\.(com|so)|supabase\.(com|io)|zoom\.us)$/.test(host),host);
   results.push({name:pkg.name,version:pkg.version,nativeAuthorizationChallenge:true,authorizationHost:host,accountConsent:false});
  }catch(error){results.push({name:pkg.name,nativeAuthorizationChallenge:false,error:String(error).slice(0,600)});}
  finally{if(id)await act(id,'defer');}
  console.log(JSON.stringify(results.at(-1)));
 }
 await writeFile(join(evidence,'result.json'),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2)+'\n');
}finally{cancelAllPluginCliAuthorizations();await new Promise<void>(resolve=>gateway.close(()=>resolve()));closeXopcDatabase();await rm(root,{recursive:true,force:true});}
process.exit(0);
