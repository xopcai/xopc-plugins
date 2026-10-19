// Run after installing PDF OCR and File Organizer from Store; uses synthetic local files.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import { RealtimeClient } from '../../xopc/packages/realtime-client/src/index.js';
import { REALTIME_PROTOCOL_VERSION } from '../../xopc/packages/realtime-protocol/src/index.js';

const config = JSON.parse(await readFile(join(homedir(), '.xopc/xopc.json'), 'utf8'));
const base = `http://127.0.0.1:${config.gateway.port ?? 18790}`;
const evidence = resolve(process.env.XOPC_OFFICE_V2_LIVE_EVIDENCE ?? '/tmp/xopc-office-v2-live-e2e');
await mkdir(evidence, { recursive: true });
async function api(path: string, body?: unknown) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${config.gateway.auth.token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(30_000),
  });
  assert(response.ok, `${path}: HTTP ${response.status}`);
  const result = await response.json();
  return result.payload ?? result;
}
async function until(check: () => boolean, label: string, timeout = 240_000) {
  const deadline = Date.now() + timeout;
  while (!check()) {
    assert(Date.now() < deadline, `Timeout: ${label}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

const fixture=await mkdtemp('/tmp/xopc-office-v2-live-fixture-');
const {copyFile}=await import('node:fs/promises');
await copyFile(resolve('tests/fixtures/ocr/bilingual-scan.pdf'),join(fixture,'scan.pdf'));
await writeFile(join(fixture,'note.txt'),'XOPC office synthetic note');await writeFile(join(fixture,'sales.csv'),'amount\n1234.56\n');
const defaults=await api('/api/global-defaults'), agents=await api('/api/agents'), models=await api('/api/models');
const model=defaults.defaults.models.chat.primary,entry=models.models.find((value:any)=>value.id===model);assert(entry);
const reports:any[]=[];
async function scenario(kind:string,prompts:string[]){
 const conversationId=randomUUID(), clientId='office-v2-'+randomUUID();let connected=false, completed:any,runId:string|undefined;
 const realtime=new RealtimeClient({clientId,clientKind:'tui',getWebSocketUrl:()=>base.replace(/^http/,'ws')+'/api/realtime/v1/ws',issueTicket:()=>api('/api/realtime/tickets',{clientId,clientKind:'tui',protocolVersion:REALTIME_PROTOCOL_VERSION}),createWebSocket:url=>new WebSocket(url),onStateChange:state=>{connected=state==='connected'},onEvent:event=>{if(event.data?.conversationId!==conversationId)return;if(event.event==='run.started'){runId=event.data.runId;realtime.subscribe(`run:${runId}`,0);}if(event.event==='run.completed')completed=event.data;}});
 try{
  realtime.subscribe('sessions');realtime.connect();await until(()=>connected,'realtime',20000);
  for(const [index,prompt]of prompts.entries()){
   completed=undefined;
   const previous=index===0?null:(await api(`/api/sessions/${conversationId}`)).session;
   const append=index===0?{}:{expectedTranscriptId:previous.transcriptId,configVersion:(await api(`/api/sessions/${conversationId}/agent-config`)).configVersion,delivery:'next'};
   await api(`/api/sessions/${conversationId}/inputs`,{kind:index===0?'start':'append',...append,clientMessageId:randomUUID(),...(index===0?{creation:{agentId:agents.defaultAgentId??agents.default??'main',projectId:null,execution:null,temporary:false,model,thinkingLevel:entry.thinking.initialValue}}:{}),input:{content:prompt},origin:{type:'system',source:'cli'}});
   await until(()=>!!completed,'real model '+kind,240000);assert.equal(completed.status,'success');
  }
  const session=await api(`/api/sessions/${conversationId}?include=transcriptRows`),messages=session.messages??session.session?.messages??[];
  await writeFile(join(evidence,kind+'-messages.json'),JSON.stringify(messages,null,2));
  const results=messages.filter((m:any)=>m.role==='toolResult'),calls=messages.filter((m:any)=>m.role==='assistant').flatMap((m:any)=>Array.isArray(m.content)?m.content.filter((v:any)=>v.type==='toolCall'):[]);
  const nested=results.flatMap((m:any)=>m.nestedCalls?.calls??[]);const all=[...calls,...nested];
  const prefix=kind==='ocr'?'mcp__plugin_pdf_reader_':'mcp__plugin_file_organizer_';
  const actual=all.filter((v:any)=>v.name?.startsWith(prefix)&&(v.status===undefined||v.status==='ok'));assert(actual.length>0,'No actual plugin call for '+kind);
  const texts=results.filter((m:any)=>!m.isError).map((m:any)=>JSON.stringify(m.content)).join('\n');
  if(kind==='ocr'){assert(texts.includes('1234.56'));assert(texts.includes('processedLocally'));}
  else{assert(texts.includes('preview'));assert(texts.includes('applied'));assert(texts.includes('undone'));assert.equal(await readFile(join(fixture,'note.txt'),'utf8'),'XOPC office synthetic note');assert.equal(await readFile(join(fixture,'sales.csv'),'utf8'),'amount\n1234.56\n');}
  const report={kind,fixture,conversationId,runId,model,actualTools:actual.map((v:any)=>v.name),passed:true};reports.push(report);console.log(JSON.stringify(report));
 }finally{realtime.disconnect();}
}
await scenario('ocr',[`这是办公插件 E2E。请使用已安装 pdf-reader 插件的 pdf_ocr 真实识别 ${fixture}/scan.pdf 第 1 页，提取发票金额和会议日期，给出页码、置信度和需要复核的内容。仅通过插件工具调用，可 searchTools 发现，禁止用 shell/普通 exec/HTTP 绕过插件，不得编造。`]);
await scenario('files',[`这是文件整理插件 E2E，唯一允许处理的目录是 ${fixture}。只选 note.txt 和 sales.csv，用 file-organizer 的 file_plan 按类型预览分类，返回 planId、digest 和移动清单，先不要移动。必须实际调用插件 MCP，可 searchTools，不得用 shell/普通 exec/HTTP 替代。`,`我确认刚才 note.txt、sales.csv 的预览，请通过该插件 file_apply 使用原 planId、digest 执行。执行后立即用 file_undo 撤销同一计划，我也明确授权此次撤销。两步均需真实调用，报告最终状态，不得使用 shell/普通 exec/HTTP。`]);
await writeFile(join(evidence,'result.json'),JSON.stringify({passed:true,completedAt:new Date().toISOString(),reports},null,2)+'\n');
