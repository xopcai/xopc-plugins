import { appendFile } from 'node:fs/promises';
const original=globalThis.fetch;
globalThis.fetch=async (url,init={})=>{
 const target=new URL(url);
 if(!['www.yuque.com','gmail.googleapis.com','oauth2.googleapis.com'].includes(target.hostname))return original(url,init);
 if(process.env.TEST_CAPTURE_FILE)await appendFile(process.env.TEST_CAPTURE_FILE,JSON.stringify({url:String(url),method:init.method||'GET',body:init.body?String(init.body):null})+'\n');
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(target.hostname==='www.yuque.com'){
  if(init.headers?.['X-Auth-Token']!=='synthetic-yuque-token')return json({message:'Unauthorized'},401);
  return json(target.pathname.endsWith('/user')?{data:{id:17,login:'test-user'}}:{data:{id:99,title:'Test document',token:'should-not-leak'}});
 }
 if(target.hostname==='oauth2.googleapis.com'){
  const body=new URLSearchParams(init.body);
  if(body.get('client_id')!=='synthetic-client'||body.get('client_secret')!=='synthetic-secret')return json({error:'invalid_client'},400);
  return json({access_token:'synthetic-google-access',refresh_token:'synthetic-google-refresh',expires_in:3600});
 }
 if(init.headers?.Authorization!=='Bearer synthetic-google-access')return json({},401);
 return json({emailAddress:'synthetic@example.invalid'});
};
