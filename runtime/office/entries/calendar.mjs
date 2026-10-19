import { serve, object, string } from '../mcp.mjs';
import { calendarRead } from '../calendar.mjs';
await serve('calendar-ics',[{name:'calendar_read_ics',description:'Read local/supplied/public ICS calendars; expand recurring events and exceptions in a bounded explicit date range, identify overlaps. Does not modify any account.',inputSchema:object({ics:string(1000000),path:string(),url:string(),from:string(),to:string()},['from','to']),execute:calendarRead}]);
