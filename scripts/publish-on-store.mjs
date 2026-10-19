// Run from the Store server workspace. The release is uploaded beforehand; no key is printed or persisted.
import { readFile, unlink, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createAuth, loadAuthEnv, getAuthDatabase, closeAuthDatabases, STORE_CLI_CONFIG_ID } from '@xopc/auth';
import dotenv from 'dotenv';
dotenv.config({ path: '/var/www/xopc-platform/.env', quiet: true });
const dir=process.argv[2]||'/tmp/xopc-production-plugin-release';
const release=JSON.parse(await readFile(join(dir,'release-manifest.json'),'utf8'));
const env=loadAuthEnv(process.env),auth=createAuth(env),db=getAuthDatabase(env);
db.prepare('DELETE FROM apikey WHERE name = ? AND referenceId = ?').run('XOPC reviewed plugin release','xopc-plugins-publisher');
const key=await auth.api.createApiKey({body:{name:'XOPC reviewed plugin release',userId:'xopc-plugins-publisher',configId:STORE_CLI_CONFIG_ID,expiresIn:86400}});
async function api(path,options={}){
 const r=await fetch('http://127.0.0.1:3001'+path,{...options,headers:{'x-api-key':key.key,...options.headers}}),data=await r.json();
 if(!r.ok)throw new Error(`${path}: ${r.status}: ${JSON.stringify(data)}`);return data;
}
try{
 async function digest(path) { const hash=createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk); return hash.digest('hex'); }
 for(const resource of release.resources){
  const temporary=join(dir,'resources',resource.file),stored='/var/www/xopc-platform/data/packages/assets/plugin-resources/'+resource.file;
  let present=false;try{present=await digest(stored)===resource.sha256;}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!present){
   if(await digest(temporary)!==resource.sha256)throw new Error('Resource integrity failed');
   await api('/api/v1/developer/resources/'+resource.sha256,{method:'PUT',headers:{'Content-Type':'application/octet-stream'},body:Readable.toWeb(createReadStream(temporary)),duplex:'half',signal:AbortSignal.timeout(180000)});
  }
  try{await unlink(temporary);}catch(error){if(error.code!=='ENOENT')throw error;}
  console.log(JSON.stringify({resource:resource.sha256,status:present?'verified-existing':'stored',bytes:(await stat(stored)).size}));
 }
 for(const pkg of release.plugins){
  const bytes=await readFile(join(dir,pkg.artifact));if(createHash('sha256').update(bytes).digest('hex')!==pkg.sha256)throw new Error('Package integrity failed');
  const existing=await fetch(`http://127.0.0.1:3001/api/v1/packages/${pkg.name}/versions/${pkg.version}`);
  if(existing.ok){const old=await existing.json();if(old.sha256?.toLowerCase()!==pkg.sha256)throw new Error(`Immutable version differs: ${pkg.name}@${pkg.version}`);console.log(JSON.stringify({name:pkg.name,status:'unchanged'}));continue;}
  const form=new FormData();for(const [field,value] of Object.entries({type:'plugin',version:pkg.version,description:pkg.description,category:pkg.category,sourceRepository:release.repository}))if(value)form.set(field,String(value));
  form.set('file',new Blob([bytes],{type:'application/zip'}),pkg.artifact);
  const result=await api(`/api/v1/developer/packages/${pkg.name}/versions`,{method:'POST',body:form});
  await api(`/api/v1/admin/versions/${result.versionId}/approve`,{method:'POST'});
  await api(`/api/v1/admin/packages/${pkg.name}/publisher-verification`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({verified:true})});
  console.log(JSON.stringify({name:pkg.name,version:pkg.version,status:'published',sha256:pkg.sha256}));
 }
 // These generic wrappers duplicate separately distributed connectors; unpublishing is recoverable.
 for(const name of ['cloudflare-workspace','figma-workspace','linear-workspace','notion-workspace']){
  const current=await fetch(`http://127.0.0.1:3001/api/v1/packages/${name}`);if(!current.ok)continue;
  await api(`/api/v1/admin/packages/${name}/unpublish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:'Replaced generic connector wrappers with a focused catalog of independently useful plugins. Connector packages remain available.'})});console.log(JSON.stringify({name,status:'unpublished'}));
 }
}finally{db.prepare('DELETE FROM apikey WHERE id = ? AND "referenceId" = ?').run(key.id,'xopc-plugins-publisher');closeAuthDatabases();}
