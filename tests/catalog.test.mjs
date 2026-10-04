import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('catalog contains a focused set of compound plugins', () => {
  const entries = readJson('catalog.json').plugins
  assert.deepEqual(entries.map(entry => entry.name), [
    'cloudflare-workspace',
    'data-toolkit',
    'expo',
    'figma-workspace',
    'linear-workspace',
    'notion-workspace',
    'supabase',
    'zoom',
  ])
  assert.ok(entries.filter(entry => entry.authentication === 'oauth-on-first-use').length >= 6)
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
