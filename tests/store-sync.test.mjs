import test from 'node:test';
import assert from 'node:assert/strict';
import {planStoreSync,applyStorePlan} from '../scripts/store-sync.mjs';
const source={plugins:[{name:'useful',version:'1.0.0',description:'Canonical',storeStatus:'published',storeDecisionReason:'Independent tool'},{name:'wrapper',storeStatus:'unpublished',storeDecisionReason:'Duplicate runtime'}],retiredPackages:[{name:'lab',type:'extension',storeStatus:'unpublished',storeDecisionReason:'Test only'}]};
const row={name:'useful',id:'p1',type:'plugin',latestVersion:'1.0.0',description:'Canonical'};
test('canonical drift plan covers both archived plugins and retired extensions, and is idempotent',async()=>{
 const plan=planStoreSync(source,[{...row,description:'Stale'},{name:'wrapper',id:'p2',type:'plugin',latestVersion:'1.0.0'},{name:'lab',id:'p3',type:'extension',latestVersion:'1.0.0'}]);
 assert.equal(plan.updates.length,1);assert.deepEqual(plan.unpublish.map(p=>p.name),['wrapper','lab']);
 const requests=[];await applyStorePlan(plan,async(path,options)=>{requests.push({path,options});const name=path.split('/').at(-1);if(!options)return {id:name==='useful'?'p1':name==='wrapper'?'p2':'p3',latestVersion:{version:'1.0.0'}};return {ok:true};});
 assert.equal(requests.filter(r=>r.options?.method==='POST').length,2);
 const settled=planStoreSync(source,[row]);assert.deepEqual([settled.updates,settled.unpublish,settled.errors],[[],[],[]]);
});
test('unknown public packages, missing releases and version drift prevent every mutation',async()=>{
 for(const remote of [[{...row,latestVersion:'2.0.0'}],[row,{name:'other',type:'plugin'}],[]]){
  const plan=planStoreSync(source,remote);assert(plan.errors.length);let calls=0;await assert.rejects(applyStorePlan(plan,async()=>{calls++;}),/preflight/);assert.equal(calls,0);
 }
});
test('concurrent Store changes fail preflight before any write',async()=>{
 const plan=planStoreSync(source,[{...row,description:'Stale'}]);let writes=0;
 await assert.rejects(applyStorePlan(plan,async(_path,options)=>{if(options)writes++;return {id:'different-release',latestVersion:{version:'1.0.0'}};}),/changed since planning/);assert.equal(writes,0);
});
