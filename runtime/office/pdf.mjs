import { readFile, stat } from 'node:fs/promises';
import { getDocumentProxy } from 'unpdf';
export async function pdfRead({path,startPage=1,endPage=10}) {
  if(!path.toLowerCase().endsWith('.pdf'))throw Error('Expected a local PDF file');
  if((await stat(path)).size>20*1024*1024)throw Error('PDF exceeds 20 MiB');
  if(endPage<startPage||endPage-startPage>=50)throw Error('Read at most 50 pages per call');
  const pdf=await getDocumentProxy(new Uint8Array(await readFile(path)),{verbosity:0,isEvalSupported:false});
  try {
    if(startPage>pdf.numPages)throw Error('Start page exceeds document length');
    const pages=[];let total=0;
    for(let page=startPage;page<=Math.min(endPage,pdf.numPages);page++){
      const value=await pdf.getPage(page),content=await value.getTextContent();
      const text=content.items.map(item=>item.str+(item.hasEOL?'\n':' ')).join('').trim();
      if(total+text.length>200000){pages.push({page,text:text.slice(0,200000-total),truncated:true});break;}
      total+=text.length;pages.push({page,text});
    }
    return {path,pageCount:pdf.numPages,pages,needsOcr:pages.every(page=>!page.text.trim()),note:'Text extraction only. Scanned pages need OCR; layout and tables are not visually verified.'};
  } finally {await pdf.loadingTask.destroy();}
}
