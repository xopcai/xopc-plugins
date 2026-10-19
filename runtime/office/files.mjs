import { constants } from 'node:fs';
import { mkdir, readdir, lstat, realpath, readFile, writeFile, rename, unlink, link, open } from 'node:fs/promises';
import { join, resolve, relative, dirname, extname, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const categories = { '.pdf':'documents', '.docx':'documents', '.doc':'documents', '.txt':'documents', '.md':'documents', '.csv':'spreadsheets', '.xlsx':'spreadsheets', '.xls':'spreadsheets', '.pptx':'presentations', '.png':'images', '.jpg':'images', '.jpeg':'images', '.webp':'images', '.gif':'images', '.mp3':'audio', '.wav':'audio', '.mp4':'video', '.mov':'video', '.zip':'archives', '.gz':'archives' };
function dataDir() {
  if (!process.env.PLUGIN_DATA) throw Error('Plugin data directory unavailable');
  return join(process.env.PLUGIN_DATA, 'file-plans');
}
function validId(value) { if (!/^[a-f0-9-]{36}$/.test(value)) throw Error('Invalid plan ID'); return value; }
async function rootDir(path) {
  if (!isAbsolute(path) || (await lstat(path)).isSymbolicLink()) throw Error('Choose an absolute real folder, not a symlink');
  const root = await realpath(path);
  if (!(await lstat(root)).isDirectory()) throw Error('Choose a folder');
  return root;
}
async function contained(root, name, allowMissing = false) {
  if (!name || isAbsolute(name) || name.includes('\\') || name.split('/').some(part => !part || part === '.' || part === '..' || part.includes(':'))) throw Error('Use a relative file path inside the selected folder');
  const target = resolve(root, name), rel = relative(root, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw Error('Path escapes selected folder');
  let current = root;
  for (const part of rel.split(/[\\/]/)) {
    current = join(current, part);
    try { if ((await lstat(current)).isSymbolicLink()) throw Error('Symlinks are not supported'); }
    catch (error) { if (error.code === 'ENOENT' && allowMissing) break; throw error; }
  }
  return target;
}
async function fingerprint(path) {
  const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > 100 * 1024 * 1024) throw Error('Only regular files up to 100 MiB are supported');
    const hash = createHash('sha256');
    for await (const chunk of handle.createReadStream({ autoClose:false })) hash.update(chunk);
    return { sha256:hash.digest('hex'), size:stat.size, dev:stat.dev, ino:stat.ino, mtimeMs:stat.mtimeMs };
  } finally { await handle.close(); }
}
const same = (a,b) => a.sha256 === b.sha256 && a.size === b.size && a.dev === b.dev && a.ino === b.ino && a.mtimeMs === b.mtimeMs;
async function exists(path) { try { await lstat(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
async function persist(plan, create = false) {
  await mkdir(dataDir(), { recursive:true, mode:0o700 });
  const path = join(dataDir(),validId(plan.id)+'.json');
  if (create) return writeFile(path,JSON.stringify(plan),{ mode:0o600,flag:'wx' });
  const temporary = path+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(plan),{ mode:0o600,flag:'wx' });
  await rename(temporary,path);
}
async function load(id) { return JSON.parse(await readFile(join(dataDir(),validId(id)+'.json'),'utf8')); }
export async function fileInventory({root, limit=100}) {
  root = await rootDir(root);
  const entries = (await readdir(root,{withFileTypes:true})).filter(entry => !entry.name.startsWith('.')).sort((a,b)=>a.name.localeCompare(b.name));
  const files=[];
  for (const entry of entries.slice(0,limit)) {
    const stat = await lstat(join(root,entry.name));
    files.push({name:entry.name,type:stat.isSymbolicLink()?'symlink':stat.isDirectory()?'folder':'file',bytes:stat.size,modifiedAt:stat.mtime.toISOString()});
  }
  return {root,files,truncated:entries.length>limit,note:'One level only. Hidden files and subfolder contents are not scanned.'};
}
export async function filePlan({root, files, mode='type'}) {
  root = await rootDir(root);
  if (!files?.length || files.length>100 || new Set(files).size!==files.length) throw Error('Select 1–100 unique file paths');
  if (!['type','month'].includes(mode)) throw Error('Choose type or month');
  const operations=[];
  for (const from of files) {
    if (from.split('/').some(value=>value.startsWith('.'))) throw Error('Hidden files are not moved');
    const source=await contained(root,from), info=await fingerprint(source);
    const folder=mode==='month'?new Date(info.mtimeMs).toISOString().slice(0,7):categories[extname(from).toLowerCase()]??'other';
    const to=folder+'/'+from.split('/').at(-1);
    if(from===to)continue;
    const target=await contained(root,to,true);
    if(await exists(target)||operations.some(value=>value.to===to))throw Error('Destination already exists or collides: '+to);
    operations.push({from,to,info,state:'pending'});
  }
  const plan={id:randomUUID(),root,mode,createdAt:new Date().toISOString(),state:'preview',operations};
  plan.digest=digest(JSON.stringify({root,mode,operations}));
  await persist(plan,true);
  return {planId:plan.id,digest:plan.digest,root,operations:operations.map(({from,to,info})=>({from,to,bytes:info.size})),state:'preview',note:'No files moved. Apply only after the user approves this exact plan; undo uses the retained journal.'};
}
async function withLock(id, action) {
  const path=join(dataDir(),validId(id)+'.lock');
  let handle;try{handle=await open(path,'wx',0o600);}catch(error){if(error.code==='EEXIST')throw Error('Plan is already running. If a process crashed, preserve the journal and review it before clearing its lock.');throw error;}
  try{return await action();}finally{await handle.close();await unlink(path);}
}
async function ensureParent(root,name) {
  const parent=dirname(name);if(parent==='.')return;
  await contained(root,parent,true);
  await mkdir(join(root,parent),{recursive:true});
  await contained(root,parent);
}
// Hard-link then unlink gives no-clobber semantics on the selected filesystem.
async function move(root,from,to,info) {
  const source=await contained(root,from), target=await contained(root,to,true);
  if(!same(await fingerprint(source),info))throw Error('File changed since preview: '+from);
  await ensureParent(root,to);await contained(root,to,true);
  await link(source,target);
  try {
    if(!same(await fingerprint(source),info)||!same(await fingerprint(target),info))throw Error('File changed while moving');
    await unlink(source);
  } catch(error) {
    if(await exists(source)&&await exists(target)&&same(await fingerprint(target),info))await unlink(target);
    throw error;
  }
}
export async function fileApply({planId,digest:expected,confirm}) {
  if(confirm!==true)throw Error('Approve the preview and set confirm=true');
  return withLock(planId,async()=>{
    const plan=await load(planId);if(plan.digest!==expected)throw Error('Preview digest mismatch');
    if(plan.state==='applied')return {planId,state:'applied',alreadyApplied:true};
    if(plan.state!=='preview')throw Error('Plan is not a fresh preview; undo/review its journal first');
    await rootDir(plan.root);
    for(const op of plan.operations){if(!same(await fingerprint(await contained(plan.root,op.from)),op.info))throw Error('File changed since preview: '+op.from);if(await exists(await contained(plan.root,op.to,true)))throw Error('Destination already exists: '+op.to);}
    plan.state='applying';await persist(plan);
    try {
      for(const op of plan.operations){op.state='moving';await persist(plan);await move(plan.root,op.from,op.to,op.info);op.state='moved';await persist(plan);}
      plan.state='applied';await persist(plan);
      return {planId,state:'applied',moved:plan.operations.length,undoAvailable:true};
    }catch(error){plan.state='interrupted';await persist(plan);throw Error('Move interrupted; originals or journaled destinations are retained. Use file_undo. '+error.message);}
  });
}
export async function fileUndo({planId,confirm}) {
  if(confirm!==true)throw Error('Confirm undo with confirm=true');
  return withLock(planId,async()=>{
    const plan=await load(planId);await rootDir(plan.root);
    if(plan.state==='undone')return {planId,state:'undone',alreadyUndone:true};
    if(!['applied','interrupted','undoing'].includes(plan.state))throw Error('Nothing to undo');
    plan.state='undoing';await persist(plan);
    for(const op of [...plan.operations].reverse()){
      if(op.state==='pending'||op.state==='undone')continue;
      const source=await contained(plan.root,op.from,true),target=await contained(plan.root,op.to,true);
      const hasSource=await exists(source),hasTarget=await exists(target);
      if(hasSource){
        if(!same(await fingerprint(source),op.info))throw Error('Original path now contains a changed file; nothing overwritten');
        if(hasTarget){if(!same(await fingerprint(target),op.info))throw Error('Destination changed; nothing removed');await unlink(target);}
      }else{if(!hasTarget)throw Error('Journaled file missing; manual recovery required');await move(plan.root,op.to,op.from,op.info);}
      op.state='undone';await persist(plan);
    }
    plan.state='undone';await persist(plan);return {planId,state:'undone',restored:plan.operations.length,note:'Empty category folders are retained.'};
  });
}
