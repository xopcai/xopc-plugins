import http from 'node:http';
import https from 'node:https';
const blocked=()=>{throw Error('Network is disabled in the offline OCR test');};
globalThis.fetch=blocked;
http.request=blocked;http.get=blocked;https.request=blocked;https.get=blocked;
