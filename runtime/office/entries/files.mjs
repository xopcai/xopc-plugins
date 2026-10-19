import {serve,object,string} from '../mcp.mjs';
import {fileInventory,filePlan,fileApply,fileUndo} from '../files.mjs';
await serve('file-organizer',[
  {name:'file_inventory',description:'List one level of a user-selected absolute folder, without scanning hidden files or following symlinks.',inputSchema:object({root:string(),limit:{type:'integer',minimum:1,maximum:500}},['root']),execute:fileInventory},
  {name:'file_plan',description:'Preview grouping explicitly selected files by type or UTC modification month. Does not move files. Returns planId and digest.',inputSchema:object({root:string(),files:{type:'array',items:string(),maxItems:100},mode:{type:'string',enum:['type','month']}},['root','files']),execute:filePlan},
  {name:'file_apply',description:'Apply the exact user-approved preview without overwriting files. Refuses changed inputs; keeps an undo journal. Requires confirm=true.',inputSchema:object({planId:string(36),digest:string(64),confirm:{type:'boolean'}},['planId','digest','confirm']),execute:fileApply},
  {name:'file_undo',description:'Restore files from a previous plan journal without overwriting changed paths. Requires user confirmation. Retains empty folders.',inputSchema:object({planId:string(36),confirm:{type:'boolean'}},['planId','confirm']),execute:fileUndo},
]);
