import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { unzipSync, strFromU8 } from 'fflate';
import test from 'node:test';
test('independent workflows analyze evidence and create real DOCX/XLSX/PPTX and escaped reports',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'xopc-office-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const child=spawn(process.execPath,['runtime/local.mjs','documents'],{stdio:['pipe','pipe','inherit']});t.after(()=>child.kill());
 let id=0;const results=new Map();createInterface({input:child.stdout}).on('line',l=>{const v=JSON.parse(l);results.set(v.id,v);});
 async function call(name,args){const request=++id;child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:request,method:'tools/call',params:{name,arguments:args}})+'\n');for(let i=0;i<100;i++){if(results.has(request)){const v=results.get(request).result;assert(!v.isError,JSON.stringify(v));return JSON.parse(v.content[0].text);}await new Promise(r=>setTimeout(r,10));}throw new Error('MCP timeout');}
 const stats=await call('analyze_rows',{rows:[{sku:'a',sales:4},{sku:'a',sales:8},{sku:'b'}],key:'sku',weights:{sales:2}});assert.equal(stats.columns.sales.sum,12);assert.deepEqual(stats.duplicateKeys,['a']);assert.equal(stats.ranking[0].score,16);assert.equal(stats.ranking.at(-1).missingEvidence.length,1);
 for(const format of ['docx','xlsx','pptx']){
  const path=join(dir,'actual.'+format);await call('office_create',{path,format,paragraphs:['你好 & XOPC'],rows:[['SKU','Units'],['a',2]],slides:[{title:'Actual title',body:'Evidence & source'}]});
  const zip=unzipSync(await readFile(path));assert(zip['[Content_Types].xml']);const content=Object.entries(zip).filter(([p])=>/document.xml|sheet1.xml|slide1.xml/.test(p)).map(([,b])=>strFromU8(b)).join('');assert(content.includes(format==='docx'?'你好':format==='xlsx'?'SKU':'Actual title'));
  const roundtrip=await call('office_read',{path});assert.equal(roundtrip.parts.length,1);
 }
 const html=join(dir,'report.html');await call('render_report',{path:html,title:'<script>alert(1)</script>',sections:[{title:'Evidence',text:'actual source'}]});const report=await readFile(html,'utf8');assert(!report.includes('<script>'));assert(report.includes('&lt;script&gt;'));
});
