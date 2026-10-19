import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import test from 'node:test';
async function launch(t,kind,mode,overrides={}){
 const home=await mkdtemp(join(tmpdir(),'xopc-provider-test-'));t.after(()=>rm(home,{recursive:true,force:true}));
 const child=spawn(process.execPath,['--import',resolve('tests/fixtures/provider-preload.mjs'),'runtime/provider.mjs',kind,mode],{env:{PATH:process.env.PATH,HOME:home,XOPC_ACCOUNT_HOME:home,...overrides},stdio:['pipe','pipe','pipe']});
 let errors='';child.stderr.on('data',c=>errors+=c);const messages=[];createInterface({input:child.stdout}).on('line',line=>{try{messages.push(JSON.parse(line));}catch{}});
 t.after(()=>child.kill('SIGKILL'));
 async function wait(predicate){for(let i=0;i<200;i++){const result=messages.find(predicate);if(result)return result;if(child.exitCode!==null)throw new Error(errors);await new Promise(r=>setTimeout(r,10));}throw new Error('Provider response timed out');}
 function call(id,method,params={}){child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');return wait(v=>v.id===id);}
 return {home,child,messages,wait,call,getErrors:()=>errors};
}
test('Yuque validates actual API identity before activation; rejects invalid token',async t=>{
 const provider=await launch(t,'yuque','serve',{ACCESS_TOKEN:'invalid'});await once(provider.child,'exit');assert.notEqual(provider.child.exitCode,0);assert(!provider.getErrors().includes('invalid"'));assert.equal(provider.messages.length,0);
});
test('Yuque request bridge stays in the provider namespace and redacts returned secrets',async t=>{
 const p=await launch(t,'yuque','serve',{ACCESS_TOKEN:'synthetic-yuque-token'});
 assert((await p.call(1,'initialize',{protocolVersion:'2025-06-18'})).result.serverInfo);
 const list=(await p.call(2,'tools/list')).result.tools;assert.equal(list[0].name,'yuque_request');
 const result=(await p.call(3,'tools/call',{name:'yuque_request',arguments:{path:'repos/test/docs/99'}})).result;assert(result.content[0].text.includes('Test document'));assert(!result.content[0].text.includes('should-not-leak'));
 for(const path of ['https://evil.invalid/','%2e%2e/%2e%2e/settings','../foo'])assert((await p.call(4+path.length,'tools/call',{name:'yuque_request',arguments:{path}})).result.isError);
});
test('Google OAuth uses state + PKCE, rejects mismatched callback and stores tokens privately',async t=>{
 const p=await launch(t,'gmail','login',{CLIENT_KEY:'synthetic-client',CLIENT_SECRET:'synthetic-secret'});
 const challenge=await p.wait(v=>v.type==='challenge'),url=new URL(challenge.url);assert.equal(url.hostname,'accounts.google.com');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert(!challenge.url.includes('synthetic-secret'));
 const callback=new URL(url.searchParams.get('redirect_uri'));callback.searchParams.set('code','synthetic-code');callback.searchParams.set('state','invalid');assert.equal((await fetch(callback)).status,400);
 callback.searchParams.set('state',url.searchParams.get('state'));assert.equal((await fetch(callback)).status,200);await once(p.child,'exit');assert.equal(p.child.exitCode,0,p.getErrors());
 const files=await readdir(p.home);assert(files.includes('google-account.enc'));assert(!(await readFile(join(p.home,'google-account.enc'))).includes('synthetic-google-access'));
 const checker=await launch(t,'gmail','check',{XOPC_ACCOUNT_HOME:p.home});await once(checker.child,'exit');assert(checker.messages.some(v=>v.authenticated===true));
});

test('Managed CLI login and MCP calls use the same private encrypted account without OS keychain prompts', async t => {
 const {writeFile,mkdir,chmod,stat}=await import('node:fs/promises');
 for(const kind of ['feishu','dingtalk']) {
  const home=await mkdtemp(join(tmpdir(),'xopc-cli-account-'));t.after(()=>rm(home,{recursive:true,force:true}));
  const resources=join(home,'resources');await mkdir(resources);
  const executable=join(resources,'provider-cli');
  await writeFile(executable,`#!${process.execPath}\nconst fs=require('fs'),p=require('path'),a=process.argv.slice(2),home=process.env.HOME;\nif(${JSON.stringify(kind)}==='dingtalk'&&process.env.DWS_DISABLE_KEYCHAIN!=='1')process.exit(21);\nif(${JSON.stringify(kind)}==='feishu'&&process.platform==='darwin'&&fs.readFileSync(p.join(home,'Library/Application Support/lark-cli/master.key.file')).length!==32)process.exit(22);\nif(a[0]==='config'){fs.mkdirSync(p.join(home,'.lark-cli'),{recursive:true});fs.writeFileSync(p.join(home,'.lark-cli/config.json'),JSON.stringify({apps:[{appId:'test',appSecret:{ref:'test'}}]}));console.log(JSON.stringify({url:'https://accounts.feishu.cn/test-app'}));}\nelse if(a.includes('--no-wait'))console.log(JSON.stringify({verification_url:'https://accounts.feishu.cn/test-user',device_code:'private-device'}));\nelse if(a[1]==='login'){fs.writeFileSync(p.join(home,'signed-in'),'yes');console.log('{}');}\nelse if(a[1]==='status')console.log(JSON.stringify({identity:'user',verified:fs.existsSync(p.join(home,'signed-in')),authenticated:fs.existsSync(p.join(home,'signed-in')),token_valid:true}));\nelse console.log(JSON.stringify({ok:fs.existsSync(p.join(home,'signed-in'))}));\n`);await chmod(executable,0o700);
  const p=await launch(t,kind,kind==='feishu'?'login-qr':'login',{XOPC_ACCOUNT_HOME:home,PLUGIN_RESOURCES:resources});await once(p.child,'exit');assert.equal(p.child.exitCode,0,p.getErrors());
  if(kind==='feishu'){
   const phases=p.messages.filter(v=>v.type==='challenge');assert.equal(phases.length,2);assert.match(phases[0].message,/第 1 步/);assert.match(phases[1].message,/第 2 步/);
   assert(!JSON.stringify(p.messages).includes('private-device'));
   if(process.platform==='darwin')assert.equal((await stat(join(home,'Library/Application Support/lark-cli/master.key.file'))).mode & 0o777,0o600);
   const retry=await launch(t,kind,'login-qr',{XOPC_ACCOUNT_HOME:home,PLUGIN_RESOURCES:resources});await once(retry.child,'exit');assert.equal(retry.child.exitCode,0,retry.getErrors());assert.equal(retry.messages.filter(v=>v.type==='challenge').length,1);
  }
  const server=await launch(t,kind,'serve',{XOPC_ACCOUNT_HOME:home,PLUGIN_RESOURCES:resources});await server.call(1,'initialize',{protocolVersion:'2025-06-18'});
  assert.equal(JSON.parse((await server.call(2,'tools/call',{name:'cli_run',arguments:{argv:['contact','get-self']}})).result.content[0].text).ok,true);
 }
});

test('Feishu preserves existing encrypted credentials if their key is missing', {skip:process.platform!=='darwin'}, async t=>{
 const {writeFile,mkdir}=await import('node:fs/promises');const home=await mkdtemp(join(tmpdir(),'xopc-existing-vault-'));t.after(()=>rm(home,{recursive:true,force:true}));
 const vault=join(home,'Library/Application Support/lark-cli');await mkdir(vault,{recursive:true});await writeFile(join(vault,'existing.enc'),'encrypted');
 const p=await launch(t,'feishu','check',{XOPC_ACCOUNT_HOME:home});await once(p.child,'exit');assert.notEqual(p.child.exitCode,0);assert.deepEqual(await readdir(vault),['existing.enc']);
});

test('DingTalk explicitly reuses a selected system account without copying secrets and pins business calls to it',async t=>{
 const {writeFile,mkdir,chmod}=await import('node:fs/promises');const home=await mkdtemp(join(tmpdir(),'xopc-reuse-account-'));t.after(()=>rm(home,{recursive:true,force:true}));
 const resources=join(home,'resources'),host=join(home,'host');await mkdir(resources);await mkdir(host);
 const executable=join(resources,'provider-cli');await writeFile(executable,`#!${process.execPath}\nconst a=process.argv.slice(2);if(process.env.HOME!==${JSON.stringify(host)}||process.env.DWS_DISABLE_KEYCHAIN)process.exit(31);if(a[0]!=='--profile')process.exit(32);if(a.includes('list'))console.log(JSON.stringify({profiles:[{profile:'org:user',corpName:'qmdemo',isOrgCurrent:true}]}));else if(a.includes('status'))console.log(JSON.stringify({authenticated:true,token_valid:true}));else console.log(JSON.stringify({ok:true,selectedProfile:a[1]}));\n`);await chmod(executable,0o700);
 const env={XOPC_ACCOUNT_HOME:home,PLUGIN_RESOURCES:resources,PLUGIN_HOST_HOME:host,DWS_PROFILE:'qmdemo'};
 const login=await launch(t,'dingtalk','login-existing',env);await once(login.child,'exit');assert.equal(login.child.exitCode,0,login.getErrors());assert.deepEqual(JSON.parse(await readFile(join(home,'dingtalk-source.json'),'utf8')),{profile:'org:user'});
 const server=await launch(t,'dingtalk','serve',env);await server.call(1,'initialize',{protocolVersion:'2025-06-18'});
 const out=(await server.call(2,'tools/call',{name:'cli_run',arguments:{argv:['contact','user','get-self','--format','json']}})).result;assert.equal(JSON.parse(out.content[0].text).selectedProfile,'org:user');
 assert((await server.call(3,'tools/call',{name:'cli_run',arguments:{argv:['contact','user','get-self','--profile','other']}})).result.isError);
 assert(!(await readdir(home)).some(name=>/token|\.enc/.test(name)));
});
