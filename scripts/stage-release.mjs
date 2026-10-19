import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {root,sha256} from './lib.mjs';
const [target,...names]=process.argv.slice(2);
if(!target||!names.length||new Set(names).size!==names.length)throw Error('Usage: node scripts/stage-release.mjs /absolute/release-dir plugin-name [...]');
const directory=resolve(target),release=JSON.parse(await readFile(join(root,'dist/release-manifest.json'),'utf8'));
const selected=release.plugins.filter(value=>names.includes(value.name));
if(selected.length!==names.length)throw Error('Unknown release package');
await mkdir(join(directory,'resources'),{recursive:true});
const hashes=new Set();
for(const pkg of selected){
 const bytes=await readFile(join(root,'dist',pkg.artifact));if(sha256(bytes)!==pkg.sha256)throw Error('Artifact digest mismatch');
 await copyFile(join(root,'dist',pkg.artifact),join(directory,pkg.artifact));
 const manifest=JSON.parse(await readFile(join(root,pkg.path,'plugin.json'),'utf8'));
 for(const resource of manifest.extensions?.['ai.xopc']?.setup?.resources??[])for(const variant of resource.variants??[resource])hashes.add(variant.sha256);
}
const resources=release.resources.filter(value=>hashes.has(value.sha256));
for(const resource of resources){
 const source=join(process.env.XOPC_RESOURCE_DIR||'/tmp/xopc-office-v2-resources',resource.file);
 if(sha256(await readFile(source))!==resource.sha256)throw Error('Resource digest mismatch');
 await copyFile(source,join(directory,'resources',resource.file));
}
await writeFile(join(directory,'release-manifest.json'),JSON.stringify({...release,plugins:selected,resources},null,2)+'\n');
console.log(JSON.stringify({directory,packages:selected.map(value=>value.name+'@'+value.version),resources:resources.length}));
