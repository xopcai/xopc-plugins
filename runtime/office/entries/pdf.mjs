import { serve, object, string } from '../mcp.mjs';
import { pdfRead } from '../pdf.mjs';
import { pdfOcr } from '../ocr.mjs';
await serve('pdf-reader',[
  {name:'pdf_read',description:'Quickly extract embedded text from selected PDF pages. Scans are flagged for pdf_ocr; mixed scanned/text PDFs may require OCR per page.',inputSchema:object({path:string(),startPage:{type:'integer',minimum:1},endPage:{type:'integer',minimum:1}},['path']),execute:pdfRead},
  {name:'pdf_ocr',description:'Read 1–10 PDF pages locally, using bundled Chinese/English OCR for scanned pages. Retains page numbers, confidence and uncertainty; never uploads document contents.',inputSchema:object({path:string(),startPage:{type:'integer',minimum:1},endPage:{type:'integer',minimum:1},language:{type:'string',enum:['eng','chi_sim','chi_sim+eng']},force:{type:'boolean'}},['path']),execute:pdfOcr},
]);
