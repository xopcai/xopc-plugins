import { serve, object, string } from '../mcp.mjs';
import { pdfRead } from '../pdf.mjs';
await serve('pdf-reader',[{name:'pdf_read',description:'Read a user-selected local PDF by page, preserving page numbers. Text only, no OCR; scanned pages are explicitly flagged.',inputSchema:object({path:string(),startPage:{type:'integer',minimum:1},endPage:{type:'integer',minimum:1}},['path']),execute:pdfRead}]);
