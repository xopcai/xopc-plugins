import { buildSync, build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { catalog, root } from './lib.mjs';
for (const pkg of catalog().plugins.filter(value=>value.officeRuntime)) {
 const output=buildSync({entryPoints:[join(root,'runtime/office/entries',pkg.officeRuntime+'.mjs')],bundle:true,platform:'node',format:'esm',target:'node22',write:false,legalComments:'inline',banner:{js:'import { createRequire as __xopcCreateRequire } from "node:module"; const require = __xopcCreateRequire(import.meta.url);'+(pkg.officeRuntime==='pdf'?' const __dirname = import.meta.dirname; const __filename = import.meta.filename;':'')}});
 if(output.outputFiles.length!==1)throw Error('Expected a self-contained runtime');
 const directory=join(root,pkg.path,'mcp');mkdirSync(directory,{recursive:true});writeFileSync(join(directory,'server.mjs'),output.outputFiles[0].contents);
 if(pkg.officeRuntime==='pdf'){
  const worker=await build({entryPoints:[join(root,'node_modules/tesseract.js/src/worker-script/node/index.js')],bundle:true,platform:'node',format:'cjs',target:'node22',write:false,legalComments:'inline',plugins:[{name:'store-ocr-core',setup(build){build.onLoad({filter:/worker-script[\\/]node[\\/]getCore\.js$/},()=>({contents:'module.exports = async () => require(process.env.XOPC_OCR_CORE_JS);',loader:'js'}));}}]});
  writeFileSync(join(directory,'ocr-worker.cjs'),worker.outputFiles[0].contents);
 }
}
