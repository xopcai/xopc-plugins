import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileInventory,filePlan,fileApply,fileUndo} from '../runtime/office/files.mjs';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'xopc-office-v2-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
test('file preview, approved move, idempotent apply and undo preserve original content',async t=>{
 const root=await fixture(t);process.env.PLUGIN_DATA=join(root,'state');t.after(()=>delete process.env.PLUGIN_DATA);
 await writeFile(join(root,'invoice.pdf'),'invoice data');await writeFile(join(root,'notes.txt'),'notes');
 assert.equal((await fileInventory({root})).files.length,2);
 const plan=await filePlan({root,files:['invoice.pdf','notes.txt']});assert.equal(await readFile(join(root,'invoice.pdf'),'utf8'),'invoice data');
 await assert.rejects(fileApply({planId:plan.planId,digest:plan.digest,confirm:false}),/approve/i);
 await assert.rejects(fileApply({planId:plan.planId,digest:'wrong',confirm:true}),/digest/);
 assert.equal((await fileApply({planId:plan.planId,digest:plan.digest,confirm:true})).moved,2);
 assert.equal(await readFile(join(root,'documents/invoice.pdf'),'utf8'),'invoice data');
 assert.equal((await fileApply({planId:plan.planId,digest:plan.digest,confirm:true})).alreadyApplied,true);
 await fileUndo({planId:plan.planId,confirm:true});assert.equal(await readFile(join(root,'invoice.pdf'),'utf8'),'invoice data');
 assert.equal((await fileUndo({planId:plan.planId,confirm:true})).alreadyUndone,true);
});
test('file plans reject symlinks, escapes, changed inputs, destination conflicts and changed undo paths',async t=>{
 const root=await fixture(t);process.env.PLUGIN_DATA=join(root,'state');t.after(()=>delete process.env.PLUGIN_DATA);
 await mkdir(join(root,'chosen'));const chosen=join(root,'chosen');await writeFile(join(root,'outside.txt'),'outside');await symlink(join(root,'outside.txt'),join(chosen,'escape.txt'));await writeFile(join(chosen,'a.txt'),'before');
 await assert.rejects(filePlan({root:chosen,files:['escape.txt']}),/Symlink/);await assert.rejects(filePlan({root:chosen,files:['../outside.txt']}));
 const stale=await filePlan({root:chosen,files:['a.txt']});await writeFile(join(chosen,'a.txt'),'after');await assert.rejects(fileApply({planId:stale.planId,digest:stale.digest,confirm:true}),/changed/);
 const plan=await filePlan({root:chosen,files:['a.txt']});await mkdir(join(chosen,'documents'));await writeFile(join(chosen,'documents/a.txt'),'collision');await assert.rejects(fileApply({planId:plan.planId,digest:plan.digest,confirm:true}),/exists/);assert.equal(await readFile(join(chosen,'documents/a.txt'),'utf8'),'collision');
 await rm(join(chosen,'documents/a.txt'));await fileApply({planId:plan.planId,digest:plan.digest,confirm:true});await writeFile(join(chosen,'a.txt'),'new user file');await assert.rejects(fileUndo({planId:plan.planId,confirm:true}),/changed/);assert.equal(await readFile(join(chosen,'a.txt'),'utf8'),'new user file');assert.equal(await readFile(join(chosen,'documents/a.txt'),'utf8'),'after');
});
test('Store-packaged OCR recognizes a real bilingual scan without network access',async t=>{
 const root=await fixture(t),resources=join(root,'resources');await mkdir(resources);
 const lock=JSON.parse(await readFile(new URL('../runtime/office/ocr-resources.json',import.meta.url),'utf8'));
 const source=process.env.XOPC_RESOURCE_DIR||'/tmp/xopc-office-v2-resources';
 for(const value of lock.resources)await writeFile(join(resources,value.id),await readFile(join(source,value.sha256+'.bin')));
 const child=spawn(process.execPath,['--import',pathToFileURL(resolve('tests/fixtures/ocr/no-network.mjs')).href,resolve('plugins/pdf-reader/mcp/server.mjs')],{cwd:root,env:{PATH:process.env.PATH,OCR_RESOURCES:resources,PLUGIN_DATA:join(root,'state')},stdio:['pipe','pipe','pipe']});t.after(()=>child.kill());
 const output=await new Promise((resolve,reject)=>{
  let buffer='',errors='';const timer=setTimeout(()=>{child.kill();reject(Error('OCR timed out: '+errors.slice(0,300)));},30000);
  child.stderr.on('data',bytes=>{errors+=bytes.toString();});
  child.once('error',error=>{clearTimeout(timer);reject(error);});
  child.once('exit',code=>{clearTimeout(timer);if(code)reject(Error('OCR process failed: '+errors.slice(0,500)));});
  child.stdout.on('data',bytes=>{buffer+=bytes.toString();let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);let message;try{message=JSON.parse(line);}catch{clearTimeout(timer);reject(Error('Non-MCP stdout'));return;}if(message.id===2){clearTimeout(timer);resolve(message.result);}}});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26'}})+'\n');
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'pdf_ocr',arguments:{path:fileURLToPath(new URL('./fixtures/ocr/bilingual-scan.pdf',import.meta.url))}}})+'\n');
 });
 assert(!output.isError,output.content[0].text);const result=JSON.parse(output.content[0].text),page=result.pages[0];
 assert.equal(result.processedLocally,true);assert.equal(page.page,1);assert.equal(page.method,'ocr');assert(page.text.includes('1234.56'));assert(page.text.includes('2026-10-19'));assert(page.text.replaceAll(/\s/g,'').includes('发票金额'));assert.equal(typeof page.confidence,'number');
});
