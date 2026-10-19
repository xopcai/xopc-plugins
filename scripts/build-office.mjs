import { buildSync } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { catalog, root } from './lib.mjs';
for (const pkg of catalog().plugins.filter(value=>value.officeRuntime)) {
 const output=buildSync({entryPoints:[join(root,'runtime/office/entries',pkg.officeRuntime+'.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',write:false,legalComments:'inline',banner:{js:'import { createRequire as __xopcCreateRequire } from "node:module"; const require = __xopcCreateRequire(import.meta.url);'}});
 if(output.outputFiles.length!==1)throw Error('Expected a self-contained runtime');
 const directory=join(root,pkg.path,'mcp');mkdirSync(directory,{recursive:true});writeFileSync(join(directory,'server.mjs'),output.outputFiles[0].contents);
}
