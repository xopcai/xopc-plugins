import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { buildSync } from 'esbuild';
import { catalog, filesUnder, root, sha256 } from './lib.mjs';
execFileSync(process.execPath,[join(root,'scripts/build-office.mjs')],{stdio:'inherit'});
const output=join(root,'dist');rmSync(output,{recursive:true,force:true});mkdirSync(output,{recursive:true});
const local=buildSync({entryPoints:[join(root,'runtime/local.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',write:false,minify:false}).outputFiles[0].contents;
const sourceDate=new Date(1980,0,1,0,0,0);
const release={schemaVersion:2,repository:catalog().repository,plugins:[],resources:[]};
for(const entry of catalog().plugins){
 const directory=join(root,entry.path),manifest=JSON.parse(readFileSync(join(directory,'plugin.json'),'utf8'));
 const overlay=manifest.extensions?.['com.openai']||{};
 const codex={...manifest,...overlay};delete codex.$schema;
 if(codex.extensions){codex.extensions={...codex.extensions};delete codex.extensions['com.openai'];}
 const files=Object.fromEntries(filesUnder(directory).filter(f=>!['plugin.json','mcp.json'].includes(f.name)).map(f=>[f.name,[new Uint8Array(readFileSync(f.path)),{mtime:sourceDate}]]));
 if(existsSync(join(directory,'mcp.json')))files['.mcp.json']=[new Uint8Array(readFileSync(join(directory,'mcp.json'))),{mtime:sourceDate}];
 files['.codex-plugin/plugin.json']=[new TextEncoder().encode(JSON.stringify(codex,null,2)+'\n'),{mtime:sourceDate}];
 if(existsSync(join(directory,'mcp/local.mjs')))files['mcp/local.mjs']=[local,{mtime:sourceDate}];
 const bytes=Buffer.from(zipSync(files,{level:9})),artifact=`${entry.name}-${entry.version}.zip`;
 writeFileSync(join(output,artifact),bytes);release.plugins.push({...entry,description:manifest.description,artifact,sha256:sha256(bytes)});
 for(const resource of manifest.extensions?.['ai.xopc']?.setup?.resources||[])for(const variant of resource.variants||[resource])if(!release.resources.some(r=>r.sha256===variant.sha256))release.resources.push({sha256:variant.sha256,file:variant.sha256+'.bin',url:variant.url});
}
writeFileSync(join(output,'release-manifest.json'),JSON.stringify(release,null,2)+'\n');
console.log(`Built ${release.plugins.length} deterministic Codex-compatible archives and indexed ${release.resources.length} Store resources`);
