// Materialize locked maintainer dependencies; users receive pinned resources from Store.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join,resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {root,sha256} from './lib.mjs';
const require=createRequire(import.meta.url),out=resolve(process.env.XOPC_RESOURCE_DIR||'/tmp/xopc-office-v2-resources');await mkdir(out,{recursive:true});
const lockPath=join(root,'runtime/office/ocr-resources.json');let lock;try{lock=JSON.parse(await readFile(lockPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const core=dirname(require.resolve('tesseract.js-core/package.json'));
const entries=[
  ['pdfium.wasm',require.resolve('@hyzyla/pdfium/pdfium.wasm')],
  ['tesseract-core-lstm.js',join(core,'tesseract-core-lstm.js')],
  ['tesseract-core-lstm.wasm',join(core,'tesseract-core-lstm.wasm')],
  ['eng-traineddata',join(dirname(require.resolve('@tesseract.js-data/eng/package.json')),'4.0.0_best_int/eng.traineddata.gz')],
  ['chi-sim-traineddata',join(dirname(require.resolve('@tesseract.js-data/chi_sim/package.json')),'4.0.0_best_int/chi_sim.traineddata.gz')],
];
const resources=[];
for(const [id,source]of entries){
  let bytes;
  const pinned=lock?.resources.find(value=>value.id===id);
  try{if(pinned)bytes=await readFile(join(out,pinned.sha256+'.bin'));}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!bytes){bytes=await readFile(source);if(source.endsWith('.gz'))bytes=gunzipSync(bytes);}
  const sha=sha256(bytes);if(pinned&&sha!==pinned.sha256)throw Error('Pinned resource changed; review dependency/model version before updating its lock: '+id);
  if(bytes.length>50*1024*1024)throw Error('Resource exceeds Store limit');
  await writeFile(join(out,sha+'.bin'),bytes);
  resources.push({id,sha256:sha,url:`https://store.xopc.ai/files/assets/plugin-resources/${sha}.bin`,maxBytes:bytes.length});
}
if(!lock)await writeFile(lockPath,JSON.stringify({modelPackages:{'@tesseract.js-data/eng':'1.0.0','@tesseract.js-data/chi_sim':'1.0.0'},modelEdition:'4.0.0_best_int',pdfiumVersion:'3.0.0',tesseractVersion:'7.0.0',resources},null,2)+'\n');
console.log(JSON.stringify({directory:out,resources:resources.map(value=>({id:value.id,bytes:value.maxBytes,sha256:value.sha256}))}));
