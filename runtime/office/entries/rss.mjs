import { serve, object, string } from '../mcp.mjs';
import { feedRead, importOpml } from '../rss.mjs';
await serve('rss-reader',[
 {name:'feed_read',description:'Read a public HTTPS RSS/Atom feed or user-provided XML. Deduplicates items and preserves source/date. Does not bypass logins.',inputSchema:object({url:string(),xml:string(500000),limit:{type:'integer',minimum:1,maximum:100},since:string()},[]),execute:feedRead},
 {name:'feed_import_opml',description:'Parse an OPML subscription export locally; exclude unsafe URLs and deduplicate subscriptions.',inputSchema:object({xml:string(500000)},['xml']),execute:importOpml},
]);
