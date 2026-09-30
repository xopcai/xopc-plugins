import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('catalog meets P0, P1, and P2 supply targets', () => {
  const entries = readJson('catalog.json').plugins
  assert.ok(entries.length >= 80)
  assert.ok(entries.filter(entry => !entry.phase || entry.phase === 'P0').length >= 20)
  assert.ok(entries.filter(entry => !entry.phase || ['P0', 'P1'].includes(entry.phase)).length >= 50)
  assert.ok(new Set(entries.map(entry => entry.category)).size >= 12)
  assert.ok(entries.filter(entry => entry.authentication === 'oauth-on-first-use').length >= 4)
})

test('generated marketplace mirrors the catalog', () => {
  const catalog = readJson('catalog.json').plugins
  const marketplace = readJson('.agents/plugins/marketplace.json').plugins
  assert.deepEqual(marketplace.map(entry => entry.name), catalog.map(entry => entry.name))
})

test('build output is deterministic', () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root })
  const first = readJson('dist/release-manifest.json')
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root })
  const second = readJson('dist/release-manifest.json')
  assert.deepEqual(second, first)
  assert.equal(first.plugins.length, readJson('catalog.json').plugins.length)
})
