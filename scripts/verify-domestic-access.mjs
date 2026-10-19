// Public TLS/IMAP capability probe only; never authenticates or reads mail.
import tls from 'node:tls';
import {writeFile} from 'node:fs/promises';
const results=[];
for(const host of ['imap.qq.com','imap.163.com','imap.126.com','imap.exmail.qq.com']){
 const result=await new Promise(resolve=>{
  let buffer='',verified=false,done=false,sent=false;
  const socket=tls.connect({host,port:993,servername:host,rejectUnauthorized:true});
  const timer=setTimeout(()=>finish('timeout'),12000);
  function finish(outcome){if(done)return;done=true;clearTimeout(timer);socket.destroy();resolve({host,port:993,tlsVerified:verified,greeting:buffer.split('\r\n')[0]?.slice(0,180),capability:buffer.match(/^\* CAPABILITY (.+)$/mi)?.[1]?.trim()??null,outcome});}
  socket.on('secureConnect',()=>{verified=socket.authorized;});
  socket.on('data',chunk=>{buffer+=chunk.toString();if(!sent&&buffer.includes('\r\n')){sent=true;socket.write('a001 CAPABILITY\r\n');}if(/^a001 (OK|NO|BAD)/mi.test(buffer))finish('responded');});
  socket.on('error',error=>finish(error.code??'error'));
 });results.push(result);
}
const report={checkedAt:new Date().toISOString(),credentialsUsed:false,mailRead:false,results};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
