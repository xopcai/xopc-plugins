import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { catalog, filesUnder, root } from './lib.mjs';
const errors=[],check=(value,text)=>{if(!value)errors.push(text);};
const entries=catalog().plugins,names=new Set();
for(const d of readdirSync(join(root,'plugins'),{withFileTypes:true}).filter(d=>d.isDirectory()))check(entries.some(e=>e.path===`plugins/${d.name}`),`${d.name}: uncatalogued package`);
for(const entry of entries){
 check(!names.has(entry.name),`Duplicate ${entry.name}`);names.add(entry.name);
 const path=join(root,entry.path),m=JSON.parse(readFileSync(join(path,'plugin.json'),'utf8'));
 check(m.name===entry.name&&m.version===entry.version,`${entry.name}: identity mismatch`);
 check(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(m.name)&&m.description?.trim(),`${entry.name}: invalid identity or description`);
 check(existsSync(join(path,'README.md')),`${entry.name}: missing README`);
 const fields=m.extensions?.['com.openai']?.userConfig||{},setup=m.extensions?.['ai.xopc']?.setup||{};
 const mcp=existsSync(join(path,'mcp.json'))?JSON.parse(readFileSync(join(path,'mcp.json'),'utf8')).mcpServers:{};
 const skillNames=new Set();let count=0;
 for(const f of filesUnder(join(path,'skills')).filter(f=>f.name.endsWith('/SKILL.md'))){
  const text=readFileSync(f.path,'utf8'),header=text.match(/^---\r?\n([\s\S]*?)\r?\n---/),name=header?.[1].match(/^name:\s*["']?([^\s"']+)/m)?.[1];
  check(header&&name&&/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(name)&&!skillNames.has(name),`${entry.name}/${f.name}: invalid Skill`);
  check(/^description:\s*\S/m.test(header?.[1]||''),`${entry.name}/${f.name}: missing description`);skillNames.add(name);count++;
 }
 check(count>0,`${entry.name}: no Skills`);
 for(const [name,server] of Object.entries(mcp)){
  for(const key of Object.keys(server.env||{}))check(!['PLUGIN_ROOT','PLUGIN_DATA'].includes(key.toUpperCase()),`${entry.name}/${name}: reserved host environment variable ${key}`);
  check(['stdio','streamable-http'].includes(server.type),`${entry.name}/${name}: unsupported MCP transport`);
  if(server.url){const url=new URL(server.url);check(url.protocol==='https:'&&!url.username&&!url.password,`${entry.name}: unsafe URL`);}
  for(const [key,value] of Object.entries(server.env||{}))if(/token|secret|password/i.test(key))check(/^\$\{user_config\.[A-Za-z0-9_]+\}$/.test(value),`${entry.name}: embedded credential`);
 }
 const accounts=new Set();
 for(const account of setup.authorizations||[]){
  check(!accounts.has(account.id)&&account.servers.every(s=>mcp[s]),`${entry.name}: invalid account target`);accounts.add(account.id);
  for(const method of account.methods){
   check(['form','cli','oauth'].includes(method.type),`${entry.name}: invalid method`);
   check((method.fields||[]).every(key=>fields[key]),`${entry.name}: undeclared credential field`);
   if(method.type==='cli')for(const cmd of [method.login,method.check])check(cmd?.command&&!/[;&|]/.test(cmd.command),`${entry.name}: invalid login executable`);
  }
 }
 const ids=new Set();for(const resource of setup.resources||[]){
  check(!ids.has(resource.id),`${entry.name}: duplicate resource`);ids.add(resource.id);
  const targets=new Set();for(const v of resource.variants||[resource]){
   const target=`${v.platform}:${v.arch}`;check(!targets.has(target),`${entry.name}: duplicate resource variant`);targets.add(target);
   check(/^[a-f0-9]{64}$/.test(v.sha256)&&v.url===`https://store.xopc.ai/files/assets/plugin-resources/${v.sha256}.bin`,`${entry.name}: resource must be pinned on Store`);
  }
 }
}
const market=JSON.parse(readFileSync(join(root,'.agents/plugins/marketplace.json'),'utf8'));
check(JSON.stringify(market.plugins.map(e=>e.name))===JSON.stringify(entries.map(e=>e.name)),'Marketplace differs from catalog');
if(errors.length){for(const e of errors)console.error(e);process.exit(1);}console.log(`Validated ${entries.length} packages: Skills, MCP, auth, resource variants and credential references`);
