import { publicUrl } from './network.mjs';
export function createSaas(provider,token,fetcher=fetch){
 if(!['todoist','readwise'].includes(provider))throw Error('Unknown provider');
 const request=async(path,{method='GET',body}={})=>{
  if(!token||/[\r\n]/.test(token))throw Error('Connect an access token in plugin details');
  const base=provider==='todoist'?'https://api.todoist.com/api/v1/':'https://readwise.io/api/';
  const url=new URL(path,base);if(!url.href.startsWith(base)||/%2e|%2f|%5c/i.test(path))throw Error('Invalid provider path');
  const response=await fetcher(url,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:(provider==='todoist'?'Bearer ':'Token ')+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error(`${provider} returned HTTP ${response.status}; check account permissions or reconnect in plugin details`);
  if(response.status===204)return {ok:true};const raw=await response.text();if(raw.length>2*1024*1024)throw Error('Provider response exceeds 2 MiB; reduce the page size');return JSON.parse(raw);
 };
 return {
  identity:()=>request(provider==='todoist'?'user':'v2/auth/'),
  execute:async({action,limit=30,cursor,projectId,content,taskId,url,tags,confirm})=>{
   const query=new URLSearchParams({limit:String(limit)});if(cursor)query.set(provider==='todoist'?'cursor':'pageCursor',cursor);
   if(provider==='todoist'){
    if(action==='tasks'){if(projectId)query.set('project_id',projectId);return request('tasks?'+query);}
    if(action==='projects')return request('projects?'+query);
    if(action==='add_task'){if(confirm!==true||!content?.trim())throw Error('User-approved task content and confirm=true are required');return request('tasks',{method:'POST',body:{content,...(projectId?{project_id:projectId}:{})}});}
    if(action==='complete_task'){if(confirm!==true||!taskId)throw Error('User-approved task ID and confirm=true are required');return request('tasks/'+encodeURIComponent(taskId)+'/close',{method:'POST'});}
   }else{
    if(action==='list_documents')return request('v3/list/?'+query);
    if(action==='list_tags')return request('v3/tags/?'+query);
    if(action==='save_document'){if(confirm!==true||!url)throw Error('A user-approved public URL and confirm=true are required');publicUrl(url);return request('v3/save/',{method:'POST',body:{url,...(tags?{tags}:{})}});}
   }
   throw Error('Unsupported action');
  }
 };
}
