import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildSync } from 'esbuild';
import { catalog, root, publishedPlugins } from './lib.mjs';
const data = catalog();
const local = buildSync({entryPoints:[join(root,'runtime/local.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',write:false}).outputFiles[0].contents;
for (const entry of data.plugins) {
  const directory = join(root,entry.path);
  if (existsSync(join(directory,'mcp/local.mjs'))) writeFileSync(join(directory,'mcp/local.mjs'),local);
  if (existsSync(join(directory,'mcp/provider.mjs'))) writeFileSync(join(directory,'mcp/provider.mjs'),readFileSync(join(root,'runtime/provider.mjs')));
}
const marketplace = { name:'xopc-official',interface:{displayName:'XOPC Official'},plugins:publishedPlugins(data.plugins).map(entry=>({name:entry.name,source:{source:'local',path:`./${entry.path}`},policy:{installation:'AVAILABLE',authentication:entry.authentication && entry.authentication!=='none'?'ON_INSTALL':'ON_DEMAND'},category:entry.category})) };
mkdirSync(join(root,'.agents/plugins'),{recursive:true});
writeFileSync(join(root,'.agents/plugins/marketplace.json'),JSON.stringify(marketplace,null,2)+'\n');
console.log(`Synchronized ${data.plugins.length} catalog entries without overwriting authored plugin content`);
