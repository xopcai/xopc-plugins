import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { catalog, root } from './lib.mjs';
const texts=new Map();
function walk(path,depth=0){if(depth>5)return;for(const entry of readdirSync(path,{withFileTypes:true})){const target=join(path,entry.name);if(entry.isDirectory()&&entry.name!=='bin')walk(target,depth+1);else if(entry.isFile()&&/^(license|copying|notice)(\.|$)/i.test(entry.name)){const text=readFileSync(target,'utf8');if(text.length<150000)texts.set(text,target.replace(root+'/node_modules/',''));}}}
walk(join(root,'node_modules/.pnpm'));
const notice='XOPC office plugin runtimes bundle open-source components. The following license texts are retained for redistribution. Some notices apply to build-time components only.\n\n'+[...texts].map(([text,path])=>'===== '+path+' =====\n'+text).join('\n\n');
const only=new Set(process.argv.slice(2));
for(const pkg of catalog().plugins.filter(value=>value.officeRuntime&&(!only.size||only.has(value.name))))writeFileSync(join(root,pkg.path,'THIRD_PARTY_NOTICES.txt'),notice);
const notion=catalog().plugins.find(value=>value.name==='notion-office');if(notion&&(!only.size||only.has(notion.name)))writeFileSync(join(root,notion.path,'THIRD_PARTY_NOTICES.txt'),'XOPC-authored workflows: Apache-2.0. This package connects to Notion\'s official hosted MCP and bundles no third-party executable runtime.\n');
