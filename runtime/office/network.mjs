import { lookup } from 'node:dns';
import { isIP, BlockList } from 'node:net';
import { Agent, fetch } from 'undici';
const block = new BlockList();
for (const [address, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['224.0.0.0',4],['240.0.0.0',4]]) block.addSubnet(address, prefix);
for (const [address, prefix] of [['::',128],['::1',128],['fc00::',7],['fe80::',10],['ff00::',8]]) block.addSubnet(address,prefix,'ipv6');
export const privateAddress = address => !isIP(address) || block.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4');
export function publicUrl(input) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) throw Error('Only public HTTPS URLs without credentials are supported');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && privateAddress(host)) throw Error('Private network addresses are not supported');
  for (const key of url.searchParams.keys()) if (/^(access_token|token|api[_-]?key|secret|password)$/i.test(key)) throw Error('Use a public URL without credentials');
  return url;
}
const dispatcher = new Agent({ connect: { lookup(host, options, callback) {
  lookup(host, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, []);
    if (!addresses.length || addresses.some(value => privateAddress(value.address))) return callback(Error('Private network address blocked'), []);
    if (options.all) callback(null, addresses); else callback(null, addresses[0].address, addresses[0].family);
  });
} } });
export async function publicText(input, maxBytes = 2 * 1024 * 1024) {
  let url = publicUrl(input);
  const signal = AbortSignal.timeout(20000);
  for (let redirect = 0; redirect <= 3; redirect++) {
    const response = await fetch(url, { dispatcher, redirect: 'manual', signal, headers: { 'User-Agent':'XOPC-Office/1.0', Accept:'text/html,application/rss+xml,application/atom+xml,application/xml,text/plain' } });
    if ([301,302,303,307,308].includes(response.status)) {
      await response.body?.cancel(); if (!response.headers.get('location')) throw Error('Invalid redirect');
      url = publicUrl(new URL(response.headers.get('location'), url).href); continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw Error(`Source returned HTTP ${response.status}; use the browser or provide an exported file`); }
    const type = response.headers.get('content-type') || '';
    if (!/(text\/|xml|json)/i.test(type)) { await response.body?.cancel(); throw Error('Source is not a supported text document'); }
    if (Number(response.headers.get('content-length')) > maxBytes) { await response.body?.cancel(); throw Error('Source exceeds size limit'); }
    const chunks = []; let count = 0;
    try { for await (const chunk of response.body) { count += chunk.length; if (count > maxBytes) throw Error('Source exceeds size limit'); chunks.push(chunk); } }
    catch (error) { await response.body?.cancel().catch(() => {}); throw error; }
    return { url: url.href, text: new TextDecoder('utf-8',{fatal:false}).decode(Buffer.concat(chunks)), contentType:type };
  }
  throw Error('Too many redirects');
}
