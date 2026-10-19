import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {marketplaceManifest,root} from './lib.mjs';
const manifest=marketplaceManifest();
mkdirSync(join(root,'.agents/plugins'),{recursive:true});
writeFileSync(join(root,'.agents/plugins/marketplace.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Synchronized ${manifest.plugins.length} reviewed public plugins; plugin source files unchanged`);
