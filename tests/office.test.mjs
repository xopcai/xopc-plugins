import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { parseFeed, feedRead, importOpml } from '../runtime/office/rss.mjs';
import { publicUrl, privateAddress } from '../runtime/office/network.mjs';
import { extractArticle, saveClip, listClips } from '../runtime/office/clipper.mjs';
import { calendarRead } from '../runtime/office/calendar.mjs';
import { vaultRead, vaultSearch, vaultCapture } from '../runtime/office/vault.mjs';
import { createSaas } from '../runtime/office/saas.mjs';
const rss='<rss version="2.0"><channel><title>中文来源</title><item><guid>one</guid><title>办公新闻</title><link>https://example.com/1</link><pubDate>Mon, 19 Oct 2026 00:00:00 GMT</pubDate></item><item><guid>one</guid><title>重复</title></item><item><guid>two</guid><title>Undated</title></item></channel></rss>';
async function temp(t){const root=await mkdtemp(join(tmpdir(),'xopc-office-'));t.after(()=>rm(root,{recursive:true,force:true}));return root;}
async function callServer(t,name,tool,args,extra={}){
 const child=spawn(process.execPath,[resolve('plugins',name,'mcp/server.mjs'),...(extra.provider?[extra.provider]:[])],{cwd:await temp(t),env:{PATH:process.env.PATH,...extra.env},stdio:['pipe','pipe','pipe']});t.after(()=>child.kill('SIGKILL'));
 let stderr='';child.stderr.on('data',b=>stderr+=b);let answer;
 const lines=createInterface({input:child.stdout});lines.on('line',line=>{try{const message=JSON.parse(line);if(message.id===2)answer=message;}catch{throw Error('Non-protocol stdout: '+line.slice(0,100));}});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26'}})+'\n');child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:tool,arguments:args}})+'\n');
 for(let n=0;n<300&&!answer;n++){if(child.exitCode!==null)throw Error(stderr.slice(0,500));await new Promise(r=>setTimeout(r,20));}
 assert(answer,'Bundled MCP response timed out: '+stderr.slice(0,200));return answer.result;
}
test('RSS/Atom and OPML preserve Chinese text, deduplicate and reject hostile XML',async()=>{
 assert.equal(parseFeed(rss).items.length,2);assert.equal((await feedRead({xml:rss,since:'2026-10-18T00:00:00Z'})).items.length,1);
 assert.equal(parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><title>A</title><entry><id>1</id><title>B</title><link href="https://example.com/a"/></entry></feed>').items[0].url,'https://example.com/a');
 assert.equal(importOpml({xml:'<opml><body><outline text="Folder"><outline text="A" xmlUrl="https://example.com/rss"/><outline xmlUrl="https://example.com/rss"/></outline></body></opml>'}).feeds.length,1);
 assert.throws(()=>parseFeed('<!DOCTYPE rss [<!ENTITY x "bad">]>'+rss),/Unsafe/);
 assert.throws(()=>importOpml({xml:'<rss/>'}),/OPML/);
});
test('public collection blocks local credentials, private/mapped IPs and unsafe schemes',()=>{
 for(const url of ['http://example.com','https://localhost/','https://127.0.0.1/','https://[::1]/','https://[::ffff:127.0.0.1]/','https://10.2.3.4','https://user:secret@example.com/','https://example.com/?access_token=secret','file:///etc/passwd'])assert.throws(()=>publicUrl(url));
 for(const value of ['127.0.0.1','10.0.0.1','169.254.169.254','192.168.0.1','::ffff:7f00:1','fc00::1'])assert(privateAddress(value));assert(!privateAddress('8.8.8.8'));
});
test('article extraction and private clips are local, source-cited and idempotent',async t=>{
 const root=await temp(t);process.env.PLUGIN_DATA=root;t.after(()=>delete process.env.PLUGIN_DATA);
 const html='<html><head><title>资料收集</title></head><body><article><h1>资料收集</h1><p>'+('这是一篇用于研究和办公的信息文章。'.repeat(30))+'</p><script>bad_secret()</script></article></body></html>';
 const output=extractArticle(html,'https://example.com/article');assert(output.text.includes('研究'));assert(!output.text.includes('bad_secret'));
 const first=await saveClip({html,url:'https://example.com/article'});assert.equal((await saveClip({html,url:'https://example.com/article'})).existing,true);assert((await readFile(first.path,'utf8')).includes('Source: https://example.com/article'));assert.equal((await listClips({query:'研究'})).total,1);
});
const ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:daily\r\nDTSTART:20261019T090000Z\r\nDTEND:20261019T100000Z\r\nRRULE:FREQ=DAILY;COUNT=3\r\nEXDATE:20261020T090000Z\r\nSUMMARY:Daily\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:other\r\nDTSTART:20261019T093000Z\r\nDTEND:20261019T103000Z\r\nSUMMARY:Overlap\r\nEND:VEVENT\r\nEND:VCALENDAR';
test('ICS expands recurrence, respects EXDATE and finds real time conflicts',async()=>{
 const result=await calendarRead({ics,from:'2026-10-19T00:00:00Z',to:'2026-10-22T00:00:00Z'});assert.equal(result.events.length,3);assert.equal(result.conflicts.length,1);assert(!result.events.some(e=>e.start.includes('2026-10-20')));
 await assert.rejects(calendarRead({ics,from:'2026-10-19',to:'2026-10-22'}),/offset/);
 await assert.rejects(calendarRead({ics,from:'2026-01-01T00:00:00Z',to:'2027-01-01T00:00:00Z'}),/90 days/);
});
test('vault access is user-scoped, rejects symlink escape, and never overwrites notes',async t=>{
 const root=await temp(t),vault=join(root,'vault');await mkdir(vault);await writeFile(join(root,'outside.md'),'secret');await writeFile(join(vault,'note.md'),'研究资料 [[Next]]');await symlink(join(root,'outside.md'),join(vault,'escape.md'));
 assert.equal((await vaultRead({vault,path:'note.md'})).links[0],'Next');assert.equal((await vaultSearch({vault,query:'研究'})).total,1);
 await assert.rejects(vaultRead({vault,path:'../outside.md'}));await assert.rejects(vaultRead({vault,path:'escape.md'}));
 await assert.rejects(vaultCapture({vault,path:'new.md',text:'x',confirm:false}));await vaultCapture({vault,path:'new.md',text:'新笔记',confirm:true});await assert.rejects(vaultCapture({vault,path:'new.md',text:'overwrite',confirm:true}),/EEXIST/);
});
test('Todoist and Reader validate tokens, pin API origins, paginate and require requested writes',async()=>{
 const calls=[];const fake=async(url,init)=>{calls.push({url:String(url),...init});return new Response(JSON.stringify({results:[{id:'1'}],next_cursor:'page2'}),{status:200});};
 const todo=createSaas('todoist','synthetic-token',fake);await todo.identity();await todo.execute({action:'tasks',limit:10,cursor:'page 2'});assert(calls[0].url.endsWith('/api/v1/user'));assert(calls[1].url.includes('cursor=page+2'));assert.equal(calls[0].headers.Authorization,'Bearer synthetic-token');
 await assert.rejects(todo.execute({action:'add_task',content:'unsafe'}),/confirm/);await todo.execute({action:'add_task',content:'Requested task',confirm:true});assert.equal(JSON.parse(calls.at(-1).body).content,'Requested task');
 const reader=createSaas('readwise','reader-token',fake);await reader.identity();assert(calls.at(-1).url.endsWith('/api/v2/auth/'));await reader.execute({action:'list_documents',cursor:'next'});assert(calls.at(-1).url.includes('pageCursor=next'));
 await assert.rejects(reader.execute({action:'save_document',url:'https://127.0.0.1',confirm:true}));await assert.rejects(createSaas('todoist','bad',async()=>new Response('',{status:401})).identity(),/HTTP 401/);
});

async function makePdf(path){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 const stream='BT /F1 12 Tf 72 720 Td (Hello XOPC) Tj ET';objects.push('<< /Length '+Buffer.byteLength(stream)+' >>\nstream\n'+stream+'\nendstream');let pdf='%PDF-1.4\n',offsets=[];
 for(const [i,value]of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${value}\nendobj\n`;}const xref=Buffer.byteLength(pdf);pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.map(value=>String(value).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';await writeFile(path,pdf);
}
test('bundled MCPs run from an empty directory without dependency installs',async t=>{
 const a=await callServer(t,'rss-reader','feed_read',{xml:rss});assert(!a.isError);assert.equal(JSON.parse(a.content[0].text).items.length,2);
 const b=await callServer(t,'calendar-ics','calendar_read_ics',{ics,from:'2026-10-19T00:00:00Z',to:'2026-10-22T00:00:00Z'});assert(!b.isError,b.content[0]?.text);assert.equal(JSON.parse(b.content[0].text).events.length,3);
 const pdf=join(await temp(t),'sample.pdf');await makePdf(pdf);const c=await callServer(t,'pdf-reader','pdf_read',{path:pdf});assert(!c.isError,c.content[0]?.text);assert(JSON.parse(c.content[0].text).pages[0].text.includes('Hello XOPC'));
 const bad=await callServer(t,'rss-reader','feed_read',{xml:rss,limit:0});assert(bad.isError);
});
