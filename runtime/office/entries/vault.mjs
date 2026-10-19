import { serve, object, string } from '../mcp.mjs';
import { vaultRead, vaultSearch, vaultCapture } from '../vault.mjs';
await serve('obsidian',[
 {name:'vault_search',description:'Search Markdown in a vault directory explicitly provided by the user; excludes hidden files and symlinks. No automatic home scan.',inputSchema:object({vault:string(),query:string(500),limit:{type:'integer',minimum:1,maximum:100}},['vault','query']),execute:vaultSearch},
 {name:'vault_read',description:'Read one Markdown note and wiki links inside the explicitly selected vault; reject traversal/symlink escape.',inputSchema:object({vault:string(),path:string()},['vault','path']),execute:vaultRead},
 {name:'vault_capture',description:'Create a NEW Markdown note inside the selected vault only when requested by the user; never overwrite or delete. Requires confirm=true.',inputSchema:object({vault:string(),path:string(),text:string(128000),confirm:{type:'boolean'}},['vault','path','text','confirm']),execute:vaultCapture},
]);
