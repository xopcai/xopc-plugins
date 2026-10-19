import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
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
