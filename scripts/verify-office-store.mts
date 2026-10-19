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
const names=['rss-reader','web-clipper','pdf-reader','calendar-ics','obsidian','notion-office','todoist','readwise-reader'];release.plugins=release.plugins.filter((p:any)=>names.includes(p.name));assert.equal(release.plugins.length,8);
const evidence=resolve(process.env.XOPC_PLUGIN_CATALOG_EVIDENCE||'/tmp/xopc-office-store-e2e');await mkdir(evidence,{recursive:true});
const root=await mkdtemp(join(tmpdir(),'xopc-catalog-e2e-'));
Object.assign(process.env,{XOPC_STATE_DIR:root,PI_CODING_AGENT_DIR:join(root,'pi'),XOPC_CONFIG_PATH:join(root,'xopc.json'),XOPC_WORKSPACE:root,XOPC_LOG_LEVEL:'fatal',XOPC_SKILLS_STORE_URL:'https://store.xopc.ai',XOPC_EXTENSIONS_STORE_URL:'https://store.xopc.ai'});
const auth={mode:'token' as const,token:randomUUID()},config=ConfigSchema.parse({gateway:{auth,skillsStoreBaseUrl:'https://store.xopc.ai'}});await writeFile(process.env.XOPC_CONFIG_PATH!,JSON.stringify(config));
openXopcDatabase();seedTestAgentCatalog({agents:[{id:'main',enabled:true,workspace:root,profile:{name:'Main'}},{id:'other',enabled:true,workspace:root,profile:{name:'Other'}}]});
const service={currentConfig:config,getResolvedAuth:()=>auth,getAuthToken:()=>auth.token,getEffectiveListenPort:()=>18790,isGatewayReady:()=>true,getExtensionLoader:()=>null,marketplace:{reloadSkills(){}}} as unknown as GatewayService;
const app=createHonoApp({service}),gateway=serve({fetch:app.fetch,hostname:'127.0.0.1',port:0});if(!gateway.listening)await once(gateway,'listening');const address=gateway.address();assert(address&&typeof address!=='string');const base=`http://127.0.0.1:${address.port}`,store=new AgentPluginStore();
async function api(path:string,method='GET',body?:unknown){const r=await fetch(base+path,{method,headers:{Authorization:`Bearer ${auth.token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(180000)});const data:any=await r.json();assert.equal(r.status,200,`${path}: ${JSON.stringify(data)}`);return data.payload??data;}
async function job(id:string){return api(`/api/extensions/agent-plugins/${id}/setup`);}
async function act(id:string,action:string,values:Record<string,unknown>={}){const current=await job(id);let next=await api(`/api/extensions/agent-plugins/${id}/setup`,'POST',{action,expectedRevision:current.revision,idempotencyKey:randomUUID(),...values});for(let i=0;i<1800&&next.state==='running';i++){await new Promise(r=>setTimeout(r,100));next=await job(id);}assert.notEqual(next.state,'running');return next;}
async function makePdf(path){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const stream='BT /F1 12 Tf 72 720 Td (Hello XOPC) Tj ET';objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream');let pdf='%PDF-1.4\n',offsets=[];
 for(const [i,value]of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${value}\nendobj\n`;}const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.map(value=>String(value).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';await writeFile(path,pdf);
}

await mkdir(join(root,'vault'));await writeFile(join(root,'vault/note.md'),'Office evidence [[Next]]');await makePdf(join(root,'sample.pdf'));
const results:any[]=[],ids=new Map<string,string>();
try{
 assert.equal((await fetch(base+'/api/extensions/inspect',{method:'POST'})).status,401);
 for(const pkg of release.plugins.filter((value:any)=>!process.env.XOPC_PLUGIN_CATALOG_ONLY||value.name===process.env.XOPC_PLUGIN_CATALOG_ONLY)){
  const detailResponse=await fetch(`https://store.xopc.ai/api/v1/packages/${pkg.name}`);assert(detailResponse.ok,`Store missing ${pkg.name}`);const detail:any=await detailResponse.json();assert.equal(detail.latestVersion.version,pkg.version);assert.equal(detail.latestVersion.sha256,pkg.sha256);
  const source=`store:${pkg.name}@${pkg.version}`,plan=await api('/api/extensions/inspect','POST',{source});assert.equal(plan.diagnostics.length,0,JSON.stringify(plan.diagnostics));
  const row=await api('/api/extensions/install','POST',{source,reviewHash:plan.reviewHash,setup:true});const id=row.pluginId;assert(id);ids.set(pkg.name,id);
  let state=await act(id,'prepare');assert.equal(state.resources,'ready',JSON.stringify(state));
  const local=['rss-reader','web-clipper','pdf-reader','calendar-ics','obsidian'].includes(pkg.name)?state.connections[0]:null;
  if(local){assert.equal(local.state,'connected',JSON.stringify(state));state=await act(id,'complete');const native=await prepareNativeMcpConfig(config,root,'main');const name=pluginServerId(id,local.name);const selected={...native,servers:native.servers.filter(s=>s.name===name)};
   const fixture:any={
    'rss-reader':{description:'RSS',args:{xml:'<rss version="2.0"><channel><title>Office</title><item><title>XOPC office news</title><link>https://example.com/a</link></item></channel></rss>'},expected:'XOPC office news'},
    'web-clipper':{description:'Extract',args:{url:'https://example.com/'},expected:'Example Domain'},
    'calendar-ics':{description:'ICS',args:{ics:'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:test\r\nDTSTART:20261019T090000Z\r\nDTEND:20261019T100000Z\r\nSUMMARY:Office review\r\nEND:VEVENT\r\nEND:VCALENDAR',from:'2026-10-19T00:00:00Z',to:'2026-10-20T00:00:00Z'},expected:'Office review'},
    'obsidian':{description:'Read',args:{vault:join(root,'vault'),path:'note.md'},expected:'Office evidence'},
    'pdf-reader':{description:'Read a user-selected',args:{path:join(root,'sample.pdf')},expected:'Hello XOPC'}
   }[pkg.name];await invokePreparedTool(selected,root,name,fixture.expected,{toolDescription:fixture.description,arguments:fixture.args});
  }else if(state.connections.length){state=await act(id,'defer');assert(state.installed&&state.deferred);const current=store.get(id)!;assert.equal(agentPluginInventoryRow(current,store).authorizationStatus,'required');assert(!(await prepareNativeMcpConfig(config,root,'other')).servers.some(s=>s.name.startsWith(pluginServerId(id,'').replace(/_$/,''))));}
  else state=await act(id,'complete');
  assert(store.active('main',root).some(p=>p.id===id));assert(store.active('other',root).some(p=>p.id===id));
  const reload=new AgentPluginStore();assert(reload.get(id)?.receipt.enabled);
  results.push({name:pkg.name,version:pkg.version,sha256:pkg.sha256,skills:store.get(id)!.skills.length,resources:store.get(id)!.resources?.length,installed:true,actualToolCall:!!local,authorization:local||!state.connections.length?'not-required':'deferred',global:true});console.log(JSON.stringify(results.at(-1)));
 }
 const notion=ids.get('notion-office')!;
 await act(notion,'authorize',{server:'notion',method:'oauth'});
 let oauth:any;
 for(let i=0;i<400;i++){oauth=await api(`/api/extensions/agent-plugins/${notion}/setup/auth/notion`);if(oauth?.authorizationUrl)break;assert(!oauth?.error,JSON.stringify(oauth));await new Promise(r=>setTimeout(r,100));}
 assert(oauth?.authorizationUrl,'Notion did not provide a native OAuth sign-in URL');assert(new URL(oauth.authorizationUrl).hostname.endsWith('notion.com'));
 await act(notion,'defer');console.log(JSON.stringify({provider:'notion',realNativeOAuthChallenge:true,cancelledAndResumable:true}));
 const report={ok:true,newPlugins:8,packages:results,realOfficialChallenges:[],realNativeOAuthChallenges:['notion'],productionAccountAuthorization:'pending-user',checks:['authenticated Gateway API paths','actual public Store metadata and artifact integrity','all package inspections have no diagnostics','bundled executable resources prepared from Store','all installations completed or explicitly deferred','every local executable package called through native pi MCP','global availability in two Agents','durable receipts survive reload','real Notion OAuth challenge without account consent','deferred private tools stay unavailable']};await writeFile(join(evidence,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({ok:true,packages:results.length,evidence}));
}finally{cancelAllPluginCliAuthorizations();await new Promise<void>(resolve=>gateway.close(()=>resolve()));closeXopcDatabase();await rm(root,{recursive:true,force:true});}
process.exit(0);
