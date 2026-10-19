import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
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
import { pluginServerId } from '../../xopc/src/extensions/agent-plugins/validation.js';
import { prepareNativeMcpConfig } from '../../xopc/src/agent/mcp/native-mcp.js';
import { createHonoApp } from '../../xopc/src/gateway/hono/app.js';
import { cancelAllPluginCliAuthorizations } from '../../xopc/src/extensions/agent-plugins/cli-authorization.js';
import type { GatewayService } from '../../xopc/src/gateway/service.js';
const repository=resolve(process.env.XOPC_PLUGIN_CATALOG_REPO||'../xopc-plugins'),release=JSON.parse(await readFile(join(repository,'dist/release-manifest.json'),'utf8'));
release.plugins=release.plugins.filter((p:any)=>p.name==='feishu');assert.equal(release.plugins.length,1);
const evidence=resolve(process.env.XOPC_PLUGIN_CATALOG_EVIDENCE||'/tmp/xopc-feishu-store-e2e');await mkdir(evidence,{recursive:true});
const root=await mkdtemp(join(tmpdir(),'xopc-catalog-e2e-'));
Object.assign(process.env,{XOPC_STATE_DIR:root,PI_CODING_AGENT_DIR:join(root,'pi'),XOPC_CONFIG_PATH:join(root,'xopc.json'),XOPC_WORKSPACE:root,XOPC_LOG_LEVEL:'fatal',XOPC_SKILLS_STORE_URL:'https://store.xopc.ai',XOPC_EXTENSIONS_STORE_URL:'https://store.xopc.ai'});
const auth={mode:'token' as const,token:randomUUID()},config=ConfigSchema.parse({gateway:{auth,skillsStoreBaseUrl:'https://store.xopc.ai'}});await writeFile(process.env.XOPC_CONFIG_PATH!,JSON.stringify(config));
openXopcDatabase();seedTestAgentCatalog({agents:[{id:'main',enabled:true,workspace:root,profile:{name:'Main'}},{id:'other',enabled:true,workspace:root,profile:{name:'Other'}}]});
const service={currentConfig:config,getResolvedAuth:()=>auth,getAuthToken:()=>auth.token,getEffectiveListenPort:()=>18790,isGatewayReady:()=>true,getExtensionLoader:()=>null,marketplace:{reloadSkills(){}}} as unknown as GatewayService;
const app=createHonoApp({service}),gateway=serve({fetch:app.fetch,hostname:'127.0.0.1',port:0});if(!gateway.listening)await once(gateway,'listening');const address=gateway.address();assert(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`,store=new AgentPluginStore();
async function api(path:string,method='GET',body?:unknown){const r=await fetch(base+path,{method,headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(180000)});const data:any=await r.json();assert.equal(r.status,200,`${path}: ${JSON.stringify(data)}`);return data.payload??data;}
async function job(id:string){return api(`/api/extensions/agent-plugins/${id}/setup`);}
async function act(id:string,action:string,values:Record<string,unknown>={}){const current=await job(id);let next=await api(`/api/extensions/agent-plugins/${id}/setup`,'POST',{action,expectedRevision:current.revision,idempotencyKey:randomUUID(),...values});for(let i=0;i<1800&&next.state==='running';i++){await new Promise(r=>setTimeout(r,100));next=await job(id);}assert.notEqual(next.state,'running');return next;}

const { loadSkillsFromDir } = await import(new URL('../../xopc/node_modules/@earendil-works/pi-coding-agent/dist/index.js',import.meta.url).href);
try {
 const pkg=release.plugins[0];
 const detail:any=await (await fetch('https://store.xopc.ai/api/v1/packages/feishu')).json();
 assert.equal(detail.latestVersion.version,pkg.version);assert.equal(detail.latestVersion.sha256,pkg.sha256);
 const source=`store:feishu@${pkg.version}`,plan=await api('/api/extensions/inspect','POST',{source});
 assert.deepEqual(plan.diagnostics,[]);assert.equal(plan.skills.length,27);
 const row=await api('/api/extensions/install','POST',{source,reviewHash:plan.reviewHash,setup:true}),id=row.pluginId;assert(id);
 let state=await act(id,'prepare');assert.equal(state.resources,'ready');
 state=await act(id,'defer');assert(state.installed&&state.deferred);
 const plugin=store.get(id)!;assert.equal(plugin.skills.length,27);assert.deepEqual(plugin.diagnostics,[]);
 const loaded=loadSkillsFromDir({dir:join(plugin.rootDir,'skills'),source:'path'});
 assert.equal(loaded.skills.length,27);assert.deepEqual(loaded.diagnostics,[]);
 for(const skill of plugin.skills)assert((await readFile(skill.filePath,'utf8')).includes('cli_run'));
 const native=await prepareNativeMcpConfig(config,root,'main');assert(!native.servers.some(s=>s.name===pluginServerId(id,'feishu')),'Deferred private tools must remain gated');
 // Exercise the pinned official CLI's public help without opening an authenticated MCP server.
 const calls=[],helpHome=join(root,'help-account');await mkdir(helpHome);
 const env={PATH:process.env.PATH!,HOME:helpHome,USERPROFILE:helpHome,LARKSUITE_CLI_CONFIG_DIR:join(helpHome,'.lark-cli')};
 for(const domain of ['calendar','docs','sheets']){
  const {stdout}=await promisify(execFile)(join(store.dataDir(id),'resources',plugin.receipt.revision,'provider-cli'),[domain,'--help'],{env,timeout:30000});
  assert(stdout.includes(domain));calls.push(domain);
 }
 const report={ok:true,version:pkg.version,sha256:pkg.sha256,storeInstall:true,installerSkills:27,runtimeSkills:loaded.skills.length,diagnostics:[],resources:state.resources,skipAuthorization:true,privateToolsGated:true,officialCliHelpCalls:calls,productionAccountCalls:'skipped at user request; authenticated MCP tools remain gated'};
 await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{cancelAllPluginCliAuthorizations();await new Promise<void>(resolve=>gateway.close(()=>resolve()));closeXopcDatabase();await rm(root,{recursive:true,force:true});}
process.exit(0);
