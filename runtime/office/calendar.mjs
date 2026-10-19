import ICAL from 'ical.js';
import { readFile, stat } from 'node:fs/promises';
import { publicText } from './network.mjs';
export async function calendarRead({ics,path,url,from,to}) {
  if([ics,path,url].filter(Boolean).length!==1)throw Error('Provide exactly one ICS text, file or public subscription URL');
  if(!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to)))throw Error('Specify ISO from/to dates with an explicit offset');
  if(!/(Z|[+-]\d\d:\d\d)$/.test(from)||!/(Z|[+-]\d\d:\d\d)$/.test(to))throw Error('Use explicit UTC or timezone offsets');
  const low=Date.parse(from),high=Date.parse(to);if(high<=low||high-low>90*86400000)throw Error('Use a positive date range of at most 90 days');
  if(path){if((await stat(path)).size>1024*1024)throw Error('ICS file too large');ics=await readFile(path,'utf8');}
  if(url)ics=(await publicText(url,1024*1024)).text;
  if(ics.length>1024*1024)throw Error('ICS exceeds 1 MiB');
  const root=new ICAL.Component(ICAL.parse(ics));if(root.name!=='vcalendar')throw Error('Expected VCALENDAR');
  ICAL.TimezoneService.reset();for(const zone of root.getAllSubcomponents('vtimezone'))ICAL.TimezoneService.register(zone);
  const components=root.getAllSubcomponents('vevent');if(components.length>1000)throw Error('Too many calendar events');
  const warnings=new Set(),events=[],exceptions=new Map();
  for(const component of components)if(component.hasProperty('recurrence-id')){const uid=component.getFirstPropertyValue('uid');if(!exceptions.has(uid))exceptions.set(uid,[]);exceptions.get(uid).push(component);}
  let iterations=0;
  for(const component of components){
    if(component.hasProperty('recurrence-id')||component.getFirstPropertyValue('status')==='CANCELLED')continue;
    for(const property of component.getAllProperties('dtstart')){const tz=property.getParameter('tzid');if(tz&&!ICAL.TimezoneService.has(tz))throw Error('Calendar is missing VTIMEZONE for '+tz+'; export a complete ICS calendar');}
    const event=new ICAL.Event(component);for(const exception of exceptions.get(event.uid)||[])event.relateException(new ICAL.Event(exception));
    if(event.startDate.zone.tzid==='floating'&&!event.startDate.isDate)warnings.add('Floating event times are represented as UTC for comparison; confirm the calendar timezone.');
    function emit(start,end,actual=event){if(start.toJSDate().getTime()<high&&end.toJSDate().getTime()>low)events.push({uid:actual.uid,title:actual.summary||'',start:start.toString(),end:end.toString(),startMs:start.toJSDate().getTime(),endMs:end.toJSDate().getTime(),allDay:start.isDate,location:actual.location||'',description:(actual.description||'').slice(0,2000)});}
    if(event.isRecurring()){
      const iterator=event.iterator();let next;
      while((next=iterator.next())){if(++iterations>20000)throw Error('Recurrence expansion limit exceeded; shorten or export the selected range');if(next.toJSDate().getTime()>=high)break;const value=event.getOccurrenceDetails(next);if(value.item.component.getFirstPropertyValue('status')!=='CANCELLED')emit(value.startDate,value.endDate,value.item);}
    }else emit(event.startDate,event.endDate);
    if(events.length>2000)throw Error('Too many occurrences; shorten the range');
  }
  events.sort((a,b)=>a.startMs-b.startMs);const conflicts=[];
  for(let i=0;i<events.length;i++)for(let j=i+1;j<events.length&&events[j].startMs<events[i].endMs;j++)if(!events[i].allDay&&!events[j].allDay&&events[j].endMs>events[i].startMs){conflicts.push({first:i,second:j});if(conflicts.length>=200)break;}
  return {events,conflicts:conflicts.slice(0,200),warnings:[...warnings],from,to,readOnly:true};
}
