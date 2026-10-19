import { createInterface } from 'node:readline';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
const name = process.argv[2] || 'workspace';
const xml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const schema = properties => ({type:'object',properties,additionalProperties:false});
const tools = [
 {name:'analyze_rows',description:'Analyze user-supplied rows locally: numeric summaries, duplicate keys, missing fields and a weighted candidate ranking. Scores use only provided numeric values; report missing evidence separately.',inputSchema:schema({rows:{type:'array',items:{type:'object',additionalProperties:true},maxItems:10000},key:{type:'string'},weights:{type:'object',additionalProperties:{type:'number'}}})},
 {name:'render_report',description:'Render a standalone HTML evidence report from supplied sections and rows. Escapes content; does not publish or upload. Returns the actual output file path.',inputSchema:schema({path:{type:'string'},title:{type:'string'},sections:{type:'array',items:{type:'object',properties:{title:{type:'string'},text:{type:'string'}},required:['title','text'],additionalProperties:false}},rows:{type:'array',items:{type:'object',additionalProperties:true}}})},
 {name:'office_read',description:'Read text and XML parts from local DOCX, XLSX or PPTX. Returns slide/document/cell contents; does not evaluate Excel formulas or render slides. Supports files up to 20 MiB compressed and 50 MiB expanded.',inputSchema:schema({path:{type:'string'}})},
 {name:'office_create',description:'Create an actual DOCX, XLSX or PPTX file from structured content. DOCX takes paragraphs; XLSX takes rows (array of arrays); PPTX takes slides (title/body). Does not claim application-rendered visual validation.',inputSchema:schema({path:{type:'string'},format:{type:'string',enum:['docx','xlsx','pptx']},title:{type:'string'},paragraphs:{type:'array',items:{type:'string'}},rows:{type:'array',items:{type:'array',items:{type:['string','number','boolean','null']}}},slides:{type:'array',items:{type:'object',properties:{title:{type:'string'},body:{type:'string'}},additionalProperties:false}}})},
];
function analyze({rows = [],key,weights = {}}) {
 if (!Array.isArray(rows) || rows.length>10000 || rows.some(row => !row || typeof row!=='object' || Array.isArray(row))) throw new Error('Rows must be objects (maximum 10000)');
 const columns = [...new Set(rows.flatMap(Object.keys))];
 const summary = Object.fromEntries(columns.map(k => { const values = rows.map(r=>r[k]), numeric = values.filter(v=>typeof v==='number' && Number.isFinite(v)); return [k,{missing:values.filter(v=>v===undefined||v===null||v==='').length,...(numeric.length?{numericCount:numeric.length,min:Math.min(...numeric),max:Math.max(...numeric),sum:numeric.reduce((a,b)=>a+b,0),mean:numeric.reduce((a,b)=>a+b,0)/numeric.length}:{})}]; }));
 const seen = new Set(), duplicates = [];
 if (key) for (const row of rows) { if (row[key]===undefined||row[key]===null||row[key]==='') continue; if (seen.has(row[key])) duplicates.push(row[key]);seen.add(row[key]); }
 const ranking = Object.keys(weights).length ? rows.map((row,index)=>({index,key:key?row[key]:undefined,score:Object.entries(weights).reduce((sum,[k,w])=>sum+(typeof row[k]==='number'&&Number.isFinite(row[k])?row[k]*w:0),0),missingEvidence:Object.keys(weights).filter(k=>typeof row[k]!=='number'||!Number.isFinite(row[k]))})).sort((a,b)=>a.missingEvidence.length-b.missingEvidence.length||b.score-a.score) : [];
 return {rowCount:rows.length,columns:summary,duplicateKeys:[...new Set(duplicates)],ranking};
}
async function render({path,title = name,sections = [],rows = []}) {
 if (!path?.endsWith('.html')) throw new Error('Choose an .html output path');
 const cols = [...new Set(rows.flatMap(Object.keys))];
 const html = `<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${xml(title)}</title><style>body{font:16px/1.65 system-ui;max-width:1080px;margin:40px auto;padding:24px;color:#1e293b}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:8px;text-align:left}section{margin:28px 0}p{white-space:pre-wrap}</style><h1>${xml(title)}</h1>${sections.map(s=>`<section><h2>${xml(s.title)}</h2><p>${xml(s.text)}</p></section>`).join('')}${rows.length?`<table><thead><tr>${cols.map(k=>`<th>${xml(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${cols.map(k=>`<td>${xml(row[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`:''}</html>`;
 await mkdir(dirname(path),{recursive:true});await writeFile(path,html);return {path,bytes:Buffer.byteLength(html)};
}
const rels = items => `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.map(([id,type,target])=>`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${xml(target)}"/>`).join('')}</Relationships>`;
async function office({path,format,paragraphs=[],rows=[],slides=[]}) {
 if (!path?.endsWith('.'+format)) throw new Error('Output extension must match format');
 const files={},types=[]; const add=(p,s,type)=>{files[p]=strToU8(s);if(type)types.push([p,type]);};
 if (format==='docx') {
  add('word/document.xml',`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs.map(p=>`<w:p><w:r><w:t xml:space="preserve">${xml(p)}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`,'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml');
  add('_rels/.rels',rels([['rId1','officeDocument','word/document.xml']]));
 } else if (format==='xlsx') {
  function column(index){let s='';for(let n=index+1;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
  add('xl/workbook.xml','<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml');
  add('xl/worksheets/sheet1.xml',`<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row,r)=>`<row r="${r+1}">${row.map((v,c)=>`<c r="${column(c)}${r+1}" ${typeof v==='number'?'':typeof v==='boolean'?'t="b"':'t="inlineStr"'}>${typeof v==='number'?`<v>${Number.isFinite(v)?v:0}</v>`:typeof v==='boolean'?`<v>${v?1:0}</v>`:`<is><t xml:space="preserve">${xml(v)}</t></is>`}</c>`).join('')}</row>`).join('')}</sheetData></worksheet>`,'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');
  add('_rels/.rels',rels([['rId1','officeDocument','xl/workbook.xml']]));add('xl/_rels/workbook.xml.rels',rels([['rId1','worksheet','worksheets/sheet1.xml']]));
 } else if (format==='pptx') {
  if (!slides.length) throw new Error('At least one slide is required');
  add('_rels/.rels',rels([['rId1','officeDocument','ppt/presentation.xml']]));
  add('ppt/presentation.xml',`<?xml version="1.0"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>${slides.map((_,i)=>`<p:sldId id="${256+i}" r:id="rId${i+1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`,'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml');
  add('ppt/_rels/presentation.xml.rels',rels(slides.map((_,i)=>[`rId${i+1}`,'slide',`slides/slide${i+1}.xml`])));
  for (const [i,s] of slides.entries()) {
   const shape=(id,y,text,size)=>`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="600000" y="${y}"/><a:ext cx="10900000" cy="2200000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="zh-CN" sz="${size}"/><a:t>${xml(text)}</a:t></a:r></a:p></p:txBody></p:sp>`;
   add(`ppt/slides/slide${i+1}.xml`,`<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shape(2,500000,s.title,3200)}${shape(3,1800000,s.body,2000)}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`,'application/vnd.openxmlformats-officedocument.presentationml.slide+xml');
  }
 } else throw new Error('Unsupported Office format');
 add('[Content_Types].xml',`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${types.map(([p,t])=>`<Override PartName="/${p}" ContentType="${t}"/>`).join('')}</Types>`);
 const bytes=zipSync(files);await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);return {path,bytes:bytes.length,format};
}
async function officeRead({path}) {
 const bytes=await readFile(path);if(bytes.length>20*1024*1024)throw new Error('Office input exceeds 20 MiB');let total=0;
 const parts=unzipSync(bytes,{filter:f=>{total+=f.originalSize;if(total>50*1024*1024)throw new Error('Expanded Office input exceeds 50 MiB');return /^(word\/document|ppt\/slides\/slide\d+|xl\/(sharedStrings|worksheets\/sheet\d+))\.xml$/.test(f.name);}});
 return {path,parts:Object.entries(parts).map(([name,data])=>({name,xml:strFromU8(data)}))};
}
const impl={analyze_rows:analyze,render_report:render,office_create:office,office_read:officeRead};
const lines=createInterface({input:process.stdin});
for await(const line of lines){let m;try{m=JSON.parse(line);}catch{continue;}if(m.id===undefined)continue;try{let result;if(m.method==='initialize')result={protocolVersion:m.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:`xopc-${name}`,version:'1.0.0'}};else if(m.method==='tools/list')result={tools};else if(m.method==='tools/call'&&impl[m.params?.name])result={content:[{type:'text',text:JSON.stringify(await impl[m.params.name](m.params.arguments||{}))}]};else throw new Error('Unsupported MCP request');console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,result}));}catch(e){console.log(JSON.stringify({jsonrpc:'2.0',id:m.id,result:{isError:true,content:[{type:'text',text:e.message}]}}));}}
