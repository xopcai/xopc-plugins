import { realpath, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, isAbsolute } from 'node:path';
const inside=(root,path)=>path===root||!relative(root,path).startsWith('..')&&!isAbsolute(relative(root,path));
async function fileIn(vault,path,create=false){
 const root=await realpath(vault);if(!(await stat(root)).isDirectory())throw Error('Vault must be a directory supplied by the user');
 const candidate=resolve(root,path);if(!inside(root,candidate)||!candidate.toLowerCase().endsWith('.md'))throw Error('Use a Markdown path inside this vault');
 const actual=create?join(await realpath(dirname(candidate)),candidate.slice(dirname(candidate).length+1)):await realpath(candidate);
 if(!inside(root,actual))throw Error('Symlinks may not escape the selected vault');return {root,path:actual};
}
export async function vaultRead({vault,path}){const file=await fileIn(vault,path);if((await stat(file.path)).size>512000)throw Error('Note exceeds 500 KiB');const text=await readFile(file.path,'utf8');return {path:relative(file.root,file.path),text,links:[...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map(match=>match[1]).slice(0,100)};}
export async function vaultSearch({vault,query,limit=20}){
 const root=await realpath(vault),matches=[];let count=0,truncated=false;
 async function walk(dir,depth=0){if(depth>20){truncated=true;return;}for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name.startsWith('.')||['node_modules'].includes(entry.name)||entry.isSymbolicLink())continue;const path=join(dir,entry.name);if(entry.isDirectory())await walk(path,depth+1);else if(entry.isFile()&&entry.name.endsWith('.md')){if(++count>3000){truncated=true;return;}if((await stat(path)).size>512000)continue;const text=await readFile(path,'utf8'),index=text.toLowerCase().indexOf(query.toLowerCase());if(index>=0)matches.push({path:relative(root,path),excerpt:text.slice(Math.max(0,index-100),index+500)});}if(count>3000)return;}}
 await walk(root);return {matches:matches.slice(0,limit),total:matches.length,scannedFiles:Math.min(count,3000),truncated:truncated||matches.length>limit};
}
export async function vaultCapture({vault,path,text,confirm}){
 if(confirm!==true)throw Error('Creating a note requires explicit user intent and confirm=true');if(text.length>128000)throw Error('Note exceeds 128 KiB');
 const file=await fileIn(vault,path,true);await writeFile(file.path,text,{flag:'wx',mode:0o600});return {path:relative(file.root,file.path),created:true,bytes:Buffer.byteLength(text)};
}
