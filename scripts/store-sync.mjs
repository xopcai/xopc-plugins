import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalog,publishedPlugins,root} from './lib.mjs';

export function planStoreSync(source, remote) {
  const reviewed=publishedPlugins(source.plugins), known=new Map(), errors=[];
  for(const entry of source.retiredPackages??[])if(entry.storeStatus!=='unpublished'||!['plugin','extension'].includes(entry.type))throw Error('Retired entries must remain unpublished: '+entry.name);
  for(const entry of [...source.plugins,...(source.retiredPackages??[])]){
    if(known.has(entry.name))throw Error('Duplicate canonical entry: '+entry.name);
    if(!['published','unpublished'].includes(entry.storeStatus)||!entry.storeDecisionReason?.trim())throw Error('Explicit Store review required: '+entry.name);
    known.set(entry.name,entry);
  }
  const publicNames=new Map();
  for(const entry of remote){if(publicNames.has(entry.name))throw Error('Duplicate remote entry: '+entry.name);publicNames.set(entry.name,entry);}
  const updates=[],unpublish=[];
  for(const entry of remote){
    const desired=known.get(entry.name);
    if(!desired){errors.push('Unknown public package; review in catalog.json first: '+entry.name);continue;}
    const type=desired.type??'plugin';
    if(entry.type!==type){errors.push('Package type mismatch: '+entry.name);continue;}
    if(desired.storeStatus==='unpublished'){unpublish.push({name:entry.name,id:entry.id,version:entry.latestVersion,reason:desired.storeDecisionReason});continue;}
    if(entry.latestVersion!==desired.version){errors.push('Publish canonical artifact/version first: '+entry.name+'@'+desired.version);continue;}
    if(entry.description!==desired.description)updates.push({name:entry.name,id:entry.id,version:entry.latestVersion,description:desired.description});
  }
  for(const entry of reviewed)if(!publicNames.has(entry.name))errors.push('Publish canonical artifact/version first: '+entry.name+'@'+entry.version);
  return {expectedPublished:reviewed.length,actualPublished:remote.length,updates,unpublish,errors};
}

export async function applyStorePlan(plan,api) {
  if(plan.errors.length)throw Error('Store sync preflight failed: '+plan.errors.join('; '));
  for(const entry of [...plan.updates,...plan.unpublish]){
    const current=await api('/api/v1/packages/'+entry.name);
    if(current.id!==entry.id||current.latestVersion?.version!==entry.version)throw Error('Store changed since planning; rerun: '+entry.name);
  }
  for(const entry of plan.updates)await api('/api/v1/developer/packages/'+entry.name,{method:'PATCH',body:{description:entry.description}});
  for(const entry of plan.unpublish)await api('/api/v1/admin/packages/'+entry.name+'/unpublish',{method:'POST',body:{reason:'xopc-plugins/catalog.json: '+entry.reason}});
}

async function main(){
  const modes=process.argv.slice(2).filter(value=>value!=='--');if(modes.some(value=>!['--check','--dry-run','--apply'].includes(value))||modes.length>1)throw Error('Usage: store:sync [--dry-run|--apply|--check]');
  const mode=modes[0]??'--dry-run',source=catalog();
  source.plugins=source.plugins.map(entry=>({...entry,description:JSON.parse(readFileSync(join(root,entry.path,'plugin.json'),'utf8')).description}));
  const base=(process.env.XOPC_STORE_URL??'https://store.xopc.ai').replace(/\/$/,'');
  async function api(path,options={}){
    const mutation=!!options.method;
    if(mutation&&!process.env.XOPC_ADMIN_API_KEY)throw Error('XOPC_ADMIN_API_KEY is required to apply canonical Store changes');
    const response=await fetch(base+path,{method:options.method??'GET',headers:{Accept:'application/json',...(mutation?{'x-api-key':process.env.XOPC_ADMIN_API_KEY,'Content-Type':'application/json'}:{})},...(options.body?{body:JSON.stringify(options.body)}:{}),signal:AbortSignal.timeout(30000)});
    const value=await response.json();if(!response.ok)throw Error(path+': HTTP '+response.status);return value;
  }
  async function inspect(){
    const entries=[];
    for(const type of ['plugin','extension']){
      let page=1,totalPages=1;
      do{const result=await api(`/api/v1/packages?type=${type}&pageSize=50&page=${page++}`);if(!Array.isArray(result.items)||!Number.isInteger(result.meta?.totalPages)||result.meta.totalPages<0||result.meta.totalPages>1000)throw Error('Invalid Store pagination');entries.push(...result.items);totalPages=result.meta.totalPages;}while(page<=totalPages);
    }
    return planStoreSync(source,entries);
  }
  let plan=await inspect();console.log(JSON.stringify({mode,...plan},null,2));
  if(mode==='--apply'){await applyStorePlan(plan,api);plan=await inspect();console.log(JSON.stringify({verifiedAfterApply:true,...plan},null,2));}
  if(plan.errors.length||(mode!=='--dry-run'&&(plan.updates.length||plan.unpublish.length)))process.exitCode=1;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
