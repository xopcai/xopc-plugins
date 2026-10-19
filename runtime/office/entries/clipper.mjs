import { serve, object, string } from '../mcp.mjs';
import { readArticle, saveClip, listClips } from '../clipper.mjs';
const input=object({url:string(),html:string(500000)},['url']);
await serve('web-clipper',[
 {name:'article_read',description:'Extract readable text from a public webpage or supplied HTML with a source URL. No login/session cookies or JavaScript execution.',inputSchema:input,execute:readArticle},
 {name:'clip_save',description:'Save a user-requested article as Markdown in this plugin private library. Idempotent by URL; never overwrites an existing clip.',inputSchema:input,execute:saveClip},
 {name:'clip_search',description:'Find previously saved clips in this plugin library; no home-directory scanning.',inputSchema:object({query:{type:'string',maxLength:200},limit:{type:'integer',minimum:1,maximum:100}}),execute:listClips},
]);
