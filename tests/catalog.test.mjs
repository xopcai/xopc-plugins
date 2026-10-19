import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { publishedPlugins } from '../scripts/lib.mjs'

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('catalog contains a focused set of compound plugins', () => {
  const entries = readJson('catalog.json').plugins
  assert.ok(entries.length >= 32)
  for (const name of ['rss-reader','web-clipper','pdf-reader','calendar-ics','obsidian','notion-office','todoist','readwise-reader']) assert.ok(entries.some(entry => entry.name === name))
  const inventory = readJson('reports/accio-migration-2026-10-19/inventory.json')
  assert.equal(inventory.plugins.length, 20)
  assert.equal(new Set(inventory.plugins.map(p => p.source)).size, 20)
  assert.ok(inventory.plugins.every(p => entries.some(e => e.name === p.name)))
  assert.ok(!entries.some(e => ['cloudflare-workspace','figma-workspace','linear-workspace','notion-workspace'].includes(e.name)))
})

test('marketplace contains only reviewed public catalog entries', () => {
  const catalog = readJson('catalog.json').plugins
  const marketplace = readJson('.agents/plugins/marketplace.json').plugins
  assert.deepEqual(marketplace.map(entry => entry.name), publishedPlugins(catalog).map(entry => entry.name))
})

test('build output is deterministic', () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root })
  const first = readJson('dist/release-manifest.json')
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root })
  const second = readJson('dist/release-manifest.json')
  assert.deepEqual(second, first)
  assert.equal(first.plugins.length, readJson('catalog.json').plugins.length)
})

test('managed DingTalk skills use plugin MCP instead of requiring a system dws executable', () => {
 for(const name of readdirSync(join(root,'plugins/dingtalk/skills'))){
  const text=readFileSync(join(root,'plugins/dingtalk/skills',name,'SKILL.md'),'utf8');
  assert(!text.split('---')[1].includes('bins:'),name+' requires a global CLI');
  assert(text.includes('cli_run'),name+' lacks managed execution instructions');
 }
});

test('Feishu portable skills pass the XOPC installer without a global CLI dependency', { skip: !existsSync(join(root, '../xopc/node_modules/.bin/tsx')) && 'Requires the sibling XOPC integration checkout' }, () => {
 const core = join(root, '../xopc')
 const result = execFileSync(join(core, 'node_modules/.bin/tsx'), ['-e', `
  import assert from 'node:assert/strict';
  import { readFileSync } from 'node:fs';
  import { inspectAgentPlugin } from './src/extensions/agent-plugins/validation.ts';
  import { parseFrontmatter } from './src/markdown/frontmatter.ts';
  import { parseSkillMetadata } from './src/agent/skills/parse-skill-metadata.ts';
  const plugin = inspectAgentPlugin(${JSON.stringify(join(root, 'plugins/feishu'))});
  assert.deepEqual(plugin.diagnostics, []);
  assert.equal(plugin.skills.length, 27);
  for (const skill of plugin.skills) {
   const raw = readFileSync(skill.filePath, 'utf8');
   const { frontmatter } = parseFrontmatter(raw);
   assert.equal(parseSkillMetadata(frontmatter).requires, undefined, skill.name);
   assert(raw.includes('cli_run'), skill.name);
  }
  const maker = readFileSync(plugin.skills.find(s => s.name === 'lark-skill-maker').filePath, 'utf8');
  assert(!maker.includes('bins:'), 'Skill template must not restore a global CLI dependency');
  console.log('27 portable skills accepted with managed MCP execution');
 `], { cwd: core, encoding: 'utf8' })
 assert.match(result, /27 portable skills accepted/)
})
