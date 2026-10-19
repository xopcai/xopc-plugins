import { serve, object, string } from '../mcp.mjs';
import { createSaas } from '../saas.mjs';
const provider=process.argv[2];
const client=createSaas(provider,process.env.ACCESS_TOKEN);
if(process.argv[3]==='check'){let authenticated=false;try{await client.identity();authenticated=true;}catch{}console.log(JSON.stringify({authenticated}));}
else{
 const actions=provider==='todoist'?['tasks','projects','add_task','complete_task']:['list_documents','list_tags','save_document'];
 await serve(provider,[{name:provider==='todoist'?'todoist_action':'reader_action',description:provider==='todoist'?'Read real Todoist tasks/projects with pagination, or explicitly requested task creation/completion. Writes require confirm=true.':'Read Readwise Reader documents/tags with cursors, or save a user-requested public URL. Saving requires confirm=true.',inputSchema:object({action:{type:'string',enum:actions},limit:{type:'integer',minimum:1,maximum:100},cursor:string(),projectId:string(),content:string(10000),taskId:string(),url:string(),tags:{type:'array',items:string(100),maxItems:20},confirm:{type:'boolean'}},['action']),execute:client.execute}],client.identity);
}
