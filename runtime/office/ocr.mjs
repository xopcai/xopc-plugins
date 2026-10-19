import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {PDFiumLibrary} from '@hyzyla/pdfium';
import {createWorker} from 'tesseract.js';
import {PNG} from 'pngjs';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function localLanguages(resources,data) {
  const models=await Promise.all(['eng','chi_sim'].map(async name=>({name,bytes:await readFile(join(resources,name==='eng'?'eng-traineddata':'chi-sim-traineddata'))})));
  const directory=join(data,'ocr-languages',sha(Buffer.concat(models.map(value=>value.bytes))));await mkdir(directory,{recursive:true,mode:0o700});
  for(const model of models){const path=join(directory,model.name+'.traineddata');let valid=false;try{valid=sha(await readFile(path))===sha(model.bytes);}catch{}if(!valid)await writeFile(path,model.bytes,{mode:0o600});}
  return directory;
}
export async function pdfOcr({path,startPage=1,endPage=5,language='chi_sim+eng',force=false},{resources=process.env.OCR_RESOURCES,data=process.env.PLUGIN_DATA,workerPath=join(dirname(fileURLToPath(import.meta.url)),'ocr-worker.cjs')}={}) {
  if(!resources||!data)throw Error('Prepare OCR resources in plugin details first');
  if(!path.toLowerCase().endsWith('.pdf')||(await stat(path)).size>20*1024*1024)throw Error('Choose a local PDF up to 20 MiB');
  if(!Number.isInteger(startPage)||!Number.isInteger(endPage)||startPage<1||endPage<startPage||endPage-startPage>=10)throw Error('OCR supports 1–10 selected pages per call');
  if(!['eng','chi_sim','chi_sim+eng'].includes(language))throw Error('Choose English, simplified Chinese, or both');
  const library=await PDFiumLibrary.init({wasmBinary:new Uint8Array(await readFile(join(resources,'pdfium.wasm')))});
  let document,worker;
  try {
    document=await library.loadDocument(new Uint8Array(await readFile(path)));
    const pageCount=document.getPageCount();if(startPage>pageCount)throw Error('Start page exceeds document length');
    const pages=[];let total=0;
    for(let number=startPage;number<=Math.min(endPage,pageCount);number++) {
      const page=document.getPage(number-1);
      try {
        let text=page.getText().trim(),method='embedded',confidence;
        if(force||text.length<12) {
          if(!worker){
            const langPath=await localLanguages(resources,data);
            process.env.XOPC_OCR_CORE_JS=join(resources,'tesseract-core-lstm.js');
            worker=await createWorker(language,1,{workerPath,langPath,gzip:false,cacheMethod:'none',logger(){},errorHandler(){}});
          }
          const {originalWidth,originalHeight}=page.getOriginalSize();
          if(originalWidth<=0||originalHeight<=0||originalWidth>14400||originalHeight>14400)throw Error('Unsupported page size');
          const scale=Math.min(3,Math.sqrt(12_000_000/(originalWidth*originalHeight)));
          const image=await page.render({scale,colorSpace:'RGBA',render:async({data,width,height})=>{
            const png=new PNG({width,height});png.data=Buffer.from(data);return PNG.sync.write(png);
          }});
          const result=await worker.recognize(Buffer.from(image.data),{}, {text:true});text=result.data.text.trim();confidence=result.data.confidence;method='ocr';
        }
        const remaining=200000-total,truncated=text.length>remaining;text=text.slice(0,remaining);total+=text.length;
        pages.push({page:number,text,method,...(confidence!==undefined?{confidence,reviewRequired:confidence<80}:{}),...(truncated?{truncated:true}:{})});
        if(total>=200000)break;
      }finally{page.close();}
    }
    return {path,pageCount,pages,processedLocally:true,note:'OCR is approximate; verify names, numbers and table alignment against the source. No cloud upload. Confidence is engine confidence, not a correctness guarantee.'};
  }finally{if(worker)await worker.terminate();document?.destroy();library.destroy();}
}
