import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
import { createInterface } from 'node:readline';

const kind = process.argv[2], mode = process.argv[3] || 'serve';
const home = process.env.XOPC_ACCOUNT_HOME || process.env.PLUGIN_ACCOUNT_HOME;
if (!home) throw new Error('Account directory is required');
await mkdir(home, { recursive: true, mode: 0o700 });
const bin = join(process.env.PLUGIN_RESOURCES || '', 'provider-cli');
const env = Object.fromEntries(['PATH', 'SystemRoot', 'WINDIR', 'LANG', 'TMPDIR', 'TEMP', 'TMP'].flatMap(k => process.env[k] ? [[k, process.env[k]]] : []));
Object.assign(env, { HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: join(home, 'config'), LARKSUITE_CLI_CONFIG_DIR: join(home, '.lark-cli') });
// Managed accounts use the official encrypted file backend in their private home.
// A synthetic HOME has no macOS login keychain; never ask the OS to reset it.
if (kind === 'dingtalk') env.DWS_DISABLE_KEYCHAIN = '1';
let systemAccount;
if (kind === 'dingtalk') {
  if (mode === 'login-existing') systemAccount = { profile: process.env.DWS_PROFILE || '' };
  else if (!mode.startsWith('login')) {
    try { systemAccount = JSON.parse(await readFile(join(home, 'dingtalk-source.json'), 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (systemAccount) {
    const host = process.env.PLUGIN_HOST_HOME;
    if (!host || !isAbsolute(host) || !systemAccount.profile || typeof systemAccount.profile !== 'string') throw new Error('Choose an existing local DingTalk account in plugin details.');
    Object.assign(env, { HOME: host, USERPROFILE: host, XDG_CONFIG_HOME: join(host, '.config'), DWS_CONFIG_DIR: join(host, '.dws') });
    delete env.DWS_DISABLE_KEYCHAIN;
  }
}
if (kind === 'feishu' && process.platform === 'darwin') {
  const vault = join(home, 'Library', 'Application Support', 'lark-cli');
  await mkdir(vault, { recursive: true, mode: 0o700 });
  const keyFile = join(vault, 'master.key.file');
  try {
    if ((await readFile(keyFile)).length !== 32) throw new Error('Account encryption key is invalid. Restore the account backup before reconnecting.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    if ((await readdir(vault)).some(name => name.endsWith('.enc'))) throw new Error('Existing account requires its original encryption key. Restore the account backup before reconnecting.');
    try { await writeFile(keyFile, randomBytes(32), { mode: 0o600, flag: 'wx' }); }
    catch (error) { if (error.code !== 'EEXIST' || (await readFile(keyFile)).length !== 32) throw error; }
  }
}
const children = new Set();
for (const event of ['SIGTERM', 'SIGINT']) process.on(event, () => { for (const child of children) child.kill(event); process.exit(1); });
function run(args, { input, challenge = false, message, timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, systemAccount ? ['--profile', systemAccount.profile, ...args] : args, { env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true }); children.add(child);
    let stdout = '', stderr = '', sent = new Set(), settled = false;
    const pending = { out: '', err: '' };
    function inspect(line) {
      const strings = [...line.matchAll(/"(https:[^"]+)"/g)].flatMap(match => { try { return [JSON.parse('"' + match[1] + '"')]; } catch { return []; } });
      const candidates = strings.length ? strings : line.match(/https:\/\/[^\s"<>\\]+/g) || [];
      for (const raw of candidates) {
        let url; try { url = new URL(raw.replace(/[),.;]+$/, '')); } catch { continue; }
        const allowed = kind === 'feishu' ? /(^|\.)(feishu\.cn|larksuite\.com)$/.test(url.hostname) : /(^|\.)(dingtalk\.com|ding\.cn)$/.test(url.hostname);
        if (!allowed || /docs|help|github/.test(url.pathname) || sent.has(url.href)) continue;
        sent.add(url.href); console.log(JSON.stringify({ type: 'challenge', kind: kind === 'dingtalk' ? 'url' : 'qr', url: url.href, ...(message ? { message } : {}) }));
      }
    }
    const timer = setTimeout(() => child.kill('SIGTERM'), timeout);
    function chunk(stream, bytes) {
      if (stream === 'out') stdout += bytes; else stderr += bytes;
      if (stdout.length + stderr.length > 1024 * 1024) { child.kill(); return; }
      if (challenge) {
        pending[stream] += bytes;
        let boundary;
        while ((boundary = pending[stream].indexOf('\n')) >= 0) {
          const line = pending[stream].slice(0, boundary).replace(/\u001b\[[0-9;]*m/g, '');
          pending[stream] = pending[stream].slice(boundary + 1); inspect(line);
        }
      }
    }
    child.stdout.on('data', data => chunk('out', data.toString())); child.stderr.on('data', data => chunk('err', data.toString()));
    child.on('error', error => { if (!settled) { settled = true; clearTimeout(timer); children.delete(child); reject(error); } });
    child.on('close', code => { if (settled) return; settled = true; clearTimeout(timer); children.delete(child); if (code !== 0) { const error = new Error('Official CLI operation failed; check account permissions or reconnect in plugin details.'); error.missingScopes = [...new Set((stdout + stderr).match(/calendar:calendar\.event:read/g) || [])]; reject(error); } else resolve(stdout); });
    child.stdin.end(input);
  });
}
function parse(text) { try { return JSON.parse(text); } catch { throw new Error('Provider returned invalid structured output'); } }
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, /token|secret|password|authorization|cookie|device_code/i.test(k) ? '[redacted]' : redact(v)]));
  let text = typeof value === 'string' ? value : null;
  if (text) for (const secret of [process.env.ACCESS_TOKEN, process.env.CLIENT_SECRET].filter(Boolean)) text = text.replaceAll(secret, '[redacted]');
  return text ?? value;
}
async function request(url, init = {}) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`Provider request failed (${response.status}). Check authorization and permissions.`);
  return response.status === 204 ? {} : response.json();
}
async function encryptedTokens(value) {
  const path = join(home, 'google-account.enc'), keyPath = join(home, 'google-key');
  let key; try { key = await readFile(keyPath); } catch { if (!value) throw new Error('Connect Google in plugin details'); key = randomBytes(32); await writeFile(keyPath, key, { mode: 0o600, flag: 'wx' }); }
  if (value) { const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv); const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]); await writeFile(path, Buffer.concat([iv, cipher.getAuthTag(), data]), { mode: 0o600 }); return value; }
  const blob = await readFile(path), decipher = createDecipheriv('aes-256-gcm', key, blob.subarray(0,12)); decipher.setAuthTag(blob.subarray(12,28)); return JSON.parse(Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()]).toString());
}
async function googleAccess() {
  let saved = await encryptedTokens();
  if (!saved.access_token || saved.expires_at < Date.now() + 60000) {
    if (!saved.refresh_token) throw new Error('Google session expired. Reconnect in plugin details.');
    const updated = await request('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: saved.client_id, client_secret: saved.client_secret, refresh_token: saved.refresh_token, grant_type: 'refresh_token' }) });
    saved = await encryptedTokens({ ...saved, ...updated, expires_at: Date.now() + updated.expires_in * 1000 });
  }
  return saved.access_token;
}
async function googleLogin() {
  const client_id = process.env.CLIENT_KEY, client_secret = process.env.CLIENT_SECRET;
  if (!client_id || !client_secret) throw new Error('Google Desktop OAuth Client ID and Secret are required.');
  const state = randomBytes(24).toString('hex'), verifier = randomBytes(48).toString('base64url');
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req,res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname !== '/oauth/callback') { res.writeHead(404).end(); return; }
      const returned = url.searchParams.get('state') || '';
      if (returned.length !== state.length || !timingSafeEqual(Buffer.from(returned), Buffer.from(state))) { res.writeHead(400).end('Invalid authorization state.'); return; }
      if (!url.searchParams.get('code')) { res.writeHead(400).end('Authorization declined. Return to xopc.'); server.close(); clearTimeout(timer); reject(new Error('Google authorization declined')); return; }
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }).end('Authorization received. Return to xopc.');
      const port = server.address().port; server.close(); clearTimeout(timer); resolve({ code: url.searchParams.get('code'), redirect_uri: `http://127.0.0.1:${port}/oauth/callback` });
    });
    const timer = setTimeout(() => { server.close(); reject(new Error('Google authorization expired')); }, 290000);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const redirect_uri = `http://127.0.0.1:${server.address().port}/oauth/callback`;
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.search = new URLSearchParams({ client_id, redirect_uri, response_type: 'code', scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send', access_type: 'offline', prompt: 'consent', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' }).toString();
      console.log(JSON.stringify({ type: 'challenge', kind: 'url', url: url.href }));
    });
  });
  const tokens = await request('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id, client_secret, code: code.code, redirect_uri: code.redirect_uri, code_verifier: verifier, grant_type: 'authorization_code' }) });
  await encryptedTokens({ ...tokens, client_id, client_secret, expires_at: Date.now() + tokens.expires_in * 1000 });
}
async function login() {
  if (kind === 'dingtalk' && mode === 'login-existing') {
    const profiles = parse(await run(['profile','list','--format','json'])).profiles;
    const matches = (profiles || []).filter(p => p.profile === systemAccount.profile || p.corpName === systemAccount.profile && p.isOrgCurrent === true);
    if (matches.length !== 1) throw new Error('Select one unambiguous local DingTalk account.');
    systemAccount.profile = matches[0].profile;
    if (!await identity()) throw new Error('The selected local DingTalk account is not signed in.');
    await writeFile(join(home, 'dingtalk-source.json'), JSON.stringify({ profile: systemAccount.profile }), { mode: 0o600 });
    return;
  }
  if (kind === 'gmail') return googleLogin();
  if (kind === 'dingtalk') return run(['auth', 'login', '--recommend', '--no-browser', '--format', 'json'], { challenge: true, timeout: 290000 });
  if (kind === 'feishu') {
    if (mode === 'login-manual') await run(['config','init','--app-id',process.env.CLIENT_KEY || '', '--app-secret-stdin', '--brand','feishu'], { input: (process.env.CLIENT_SECRET || '') + '\n' });
    else {
      let configured = false;
      try { configured = parse(await readFile(join(home, '.lark-cli', 'config.json'), 'utf8')).apps?.some(app => app.appId && app.appSecret) === true; } catch {}
      if (!configured) await run(['config','init','--new','--brand','feishu'], { challenge: true, message: '第 1 步：用飞书扫码配置应用。完成后还需扫描用户授权二维码。', timeout: 290000 });
    }
    const started = parse(await run(['auth','login','--recommend', ...(mode === 'login-calendar' ? ['--scope','calendar:calendar.event:read'] : []), '--no-wait','--json']));
    if (!started.verification_url || !started.device_code) throw new Error('Missing Feishu authorization challenge');
    const url = new URL(started.verification_url); if (url.protocol !== 'https:' || !/(^|\.)(feishu\.cn|larksuite\.com)$/.test(url.hostname)) throw new Error('Invalid Feishu authorization URL');
    console.log(JSON.stringify({ type:'challenge',kind:'qr',url:started.verification_url,message:'第 2 步：请扫描此二维码并确认用户授权。验证成功后会自动连接。' }));
    await run(['auth','login','--device-code',started.device_code], { timeout: 290000 }); return;
  }
  throw new Error('Unsupported login provider');
}
async function identity() {
  if (kind === 'yuque') {
    if (!process.env.ACCESS_TOKEN) return false;
    const value = await request('https://www.yuque.com/api/v2/user', { headers: { 'X-Auth-Token': process.env.ACCESS_TOKEN, 'User-Agent': 'xopc-yuque/1.0.0' } });
    return Boolean(value.data?.id);
  }
  if (kind === 'gmail') return Boolean((await request('https://gmail.googleapis.com/gmail/v1/users/me/profile', { headers: { Authorization: `Bearer ${await googleAccess()}` } })).emailAddress);
  const output = parse(await run(kind === 'feishu' ? ['auth','status','--json','--verify'] : ['auth','status','--format','json']));
  return kind === 'feishu' ? output.identity === 'user' && output.verified === true : output.authenticated === true && output.token_valid !== false;
}
const spec = kind === 'yuque' ? { name: 'yuque_request', description: 'Call Yuque API v2. Use GET user, users/:login/repos, repos/:namespace/docs, repos/:namespace/docs/:id. POST/PUT/DELETE modify documents or repositories only when requested. Paths are relative to /api/v2/.' } : kind === 'gmail' ? { name: 'gmail_request', description: 'Call authenticated Gmail users/me API. GET messages?q=from:... lists IDs; GET messages/:id fetches current content/attachment IDs. Labels use IDs. POST messages/send sends MIME base64url raw only when explicitly requested. Never cache ephemeral attachment IDs.' } : { name: 'cli_run', description: `Run the managed official ${kind === 'feishu' ? 'lark-cli' : 'dws'} with an argv array, excluding the executable. Use help/schema for discovery. Uses this plugin account consistently. Writes require user intent; no automatic confirmation bypass. Authentication and installation are managed in plugin details.` };
async function execute(input) {
  if (kind === 'yuque' || kind === 'gmail') {
    const path = String(input.path || '');
    if (!path || path.startsWith('/') || /[\\#]|(?:^|\/)\.\.(?:\/|$)|https?:/i.test(path) || !/^[A-Za-z0-9_@.%?=&+:/-]+$/.test(path)) throw new Error('Invalid provider API path');
    const base = kind === 'yuque' ? 'https://www.yuque.com/api/v2/' : 'https://gmail.googleapis.com/gmail/v1/users/me/';
    const method = input.method || 'GET'; if (!['GET','POST','PUT','PATCH','DELETE'].includes(method)) throw new Error('Invalid HTTP method');
    const headers = kind === 'yuque' ? { 'X-Auth-Token': process.env.ACCESS_TOKEN, 'User-Agent': 'xopc-yuque/1.0.0' } : { Authorization: `Bearer ${await googleAccess()}` };
    const target = new URL(path, base); if (!target.pathname.startsWith(new URL(base).pathname)) throw new Error('Provider API path escapes its namespace');
    return request(target, { method, headers: { ...headers, 'Content-Type':'application/json' }, ...(method !== 'GET' && input.body ? { body:JSON.stringify(input.body) } : {}) });
  }
  const args = input.argv;
  if (!Array.isArray(args) || !args.length || args.length > 80 || args.some(v => typeof v !== 'string' || v.includes('\0'))) throw new Error('argv must be a non-empty string array');
  if (systemAccount && args.some(v => v === '--profile' || v.startsWith('--profile='))) throw new Error('This plugin is bound to the account selected in plugin details.');
  if (/^(auth|config|profile|upgrade|update|skill|completion|mcp)$/.test(args[0]) && !(args.includes('--help') || ['status','list','show'].includes(args[1]))) throw new Error('Manage installation and accounts in plugin details.');
  if (args.some(v => ['--mock','--client-secret','--token','--app-secret'].includes(v))) throw new Error('Mock data and credential arguments are not permitted.');
  const output = await run(args, { timeout: 120000 });
  try { return redact(JSON.parse(output)); } catch { return redact(output); }
}
if (mode.startsWith('login')) { await login(); if (!await identity()) throw new Error('Account verification failed'); if (kind === 'dingtalk' && mode !== 'login-existing') { const { unlink } = await import('node:fs/promises'); await unlink(join(home, 'dingtalk-source.json')).catch(error => { if (error.code !== 'ENOENT') throw error; }); } }
else if (mode === 'check') {
  let authenticated = false; const issues = [];
  try { authenticated = await identity(); } catch {}
  if (authenticated && kind === 'feishu') {
    try { await run(['calendar','+agenda','--as','user'], { timeout: 10000 }); }
    catch (error) {
      const missing = error.missingScopes?.length > 0;
      let helpUrl = 'https://open.feishu.cn/app';
      try { const config = parse(await readFile(join(home,'.lark-cli','config.json'),'utf8')); const app = config.apps?.find(value => value.appId); if (/^cli_[a-zA-Z0-9]+$/.test(app?.appId)) helpUrl += '/' + app.appId + '/auth'; } catch {}
      issues.push({ id:'calendar', title:missing ? '日历需要补充读取权限' : '日历权限暂未验证通过', scopes:missing ? error.missingScopes : [],
        instructions:missing ? ['若应用尚未开通此权限，请在飞书开放平台开通并发布；已开通可直接补充授权。','应用权限生效后，点击补充授权并扫码确认。','授权完成后自动检查；也可点击重新检查权限。'] : ['检查网络和飞书服务状态后，重新检查权限。'],
        ...(missing ? { method:'calendar', helpUrl } : {}) });
    }
  }
  console.log(JSON.stringify({ authenticated, issues }));
}
else {
  if (!await identity()) throw new Error('Authorization required. Connect this account in plugin details.');
  const schema = kind === 'yuque' || kind === 'gmail' ? { type:'object', properties:{ path:{type:'string'},method:{type:'string',enum:['GET','POST','PUT','PATCH','DELETE']},body:{type:'object',additionalProperties:true} }, required:['path'],additionalProperties:false } : {type:'object',properties:{argv:{type:'array',items:{type:'string'},minItems:1,maxItems:80}},required:['argv'],additionalProperties:false};
  const lines = createInterface({ input:process.stdin });
  for await (const line of lines) {
    let message; try { message = JSON.parse(line); } catch { continue; }
    if (message.id === undefined) continue;
    let result;
    try {
      if (message.method === 'initialize') result = {protocolVersion:message.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:`xopc-${kind}`,version:'1.0.0'}};
      else if (message.method === 'tools/list') result = {tools:[{...spec,inputSchema:schema}]};
      else if (message.method === 'tools/call' && message.params?.name === spec.name) result = {content:[{type:'text',text:JSON.stringify(redact(await execute(message.params.arguments || {})))}]};
      else throw new Error('Unsupported MCP request');
      console.log(JSON.stringify({jsonrpc:'2.0',id:message.id,result}));
    } catch (error) { console.log(JSON.stringify({jsonrpc:'2.0',id:message.id,result:{isError:true,content:[{type:'text',text:redact(error.message)}]}})); }
  }
}
