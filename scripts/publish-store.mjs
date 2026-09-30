import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib.mjs'

const store = (process.env.XOPC_STORE_URL ?? 'https://store.xopc.ai').replace(/\/$/, '')
const dryRun = process.argv.includes('--dry-run') || process.env.XOPC_DRY_RUN === 'true'
const requestedPhases = new Set((process.env.XOPC_PUBLISH_PHASES ?? '')
  .split(',').map(value => value.trim()).filter(Boolean))
const apiKey = process.env.XOPC_API_KEY
if (!dryRun && !apiKey) throw new Error('XOPC_API_KEY is required unless --dry-run is used')

execFileSync(process.execPath, [join(root, 'scripts/build.mjs')], { stdio: 'inherit' })
const release = JSON.parse(readFileSync(join(root, 'dist/release-manifest.json'), 'utf8'))
const commit = process.env.XOPC_SOURCE_COMMIT?.trim()
  || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('XOPC_SOURCE_COMMIT must be a full Git commit SHA')

const selected = release.plugins.filter(plugin => !requestedPhases.size || requestedPhases.has(plugin.phase ?? 'legacy'))
if (!selected.length) throw new Error(`No plugins match phases: ${[...requestedPhases].join(', ')}`)

async function publishedVersion(plugin) {
  const response = await fetch(`${store}/api/v1/packages/${encodeURIComponent(plugin.name)}`, {
    headers: { Accept: 'application/json' },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`catalog lookup failed (${response.status})`)
  const detail = await response.json()
  return detail.latestVersion ?? null
}

async function publish(plugin) {
  const manifest = JSON.parse(readFileSync(join(root, plugin.path, 'plugin.json'), 'utf8'))
  if (dryRun) return { plugin, status: 'dry-run' }
  const existing = await publishedVersion(plugin)
  if (existing?.version === plugin.version) {
    if (existing.sha256?.toLowerCase() === plugin.sha256.toLowerCase()) return { plugin, status: 'unchanged' }
    throw new Error(`${plugin.name}@${plugin.version} already exists with a different digest; bump the plugin version`)
  }

  const form = new FormData()
  form.set('type', 'plugin')
  form.set('version', plugin.version)
  form.set('description', manifest.description)
  form.set('category', plugin.category)
  form.set('sourceRepository', release.repository)
  form.set('sourceCommit', commit)
  form.set('file', new Blob([readFileSync(join(root, 'dist', plugin.artifact))], { type: 'application/zip' }), plugin.artifact)
  const response = await fetch(`${store}/api/v1/developer/packages/${encodeURIComponent(plugin.name)}/versions`, {
    method: 'POST', headers: { 'x-api-key': apiKey }, body: form,
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message ?? response.statusText)
  if (process.env.XOPC_ADMIN_API_KEY) {
    const approval = await fetch(`${store}/api/v1/admin/versions/${encodeURIComponent(result.versionId)}/approve`, {
      method: 'POST', headers: { 'x-api-key': process.env.XOPC_ADMIN_API_KEY },
    })
    if (!approval.ok) throw new Error(`approval failed (${approval.status})`)
    const verification = await fetch(`${store}/api/v1/admin/packages/${encodeURIComponent(plugin.name)}/publisher-verification`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.XOPC_ADMIN_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ verified: true }),
    })
    if (!verification.ok) throw new Error(`publisher verification failed (${verification.status})`)
  }
  return { plugin, status: process.env.XOPC_ADMIN_API_KEY ? 'published' : 'submitted' }
}

const concurrency = Math.min(8, Math.max(1, Number(process.env.XOPC_PUBLISH_CONCURRENCY ?? 4)))
const queue = [...selected]
const results = []
async function worker() {
  while (queue.length) {
    const plugin = queue.shift()
    try {
      const result = await publish(plugin)
      results.push(result)
      console.log(`${result.status}: ${plugin.name}@${plugin.version}`)
    } catch (error) {
      results.push({ plugin, status: 'failed', error: error instanceof Error ? error.message : String(error) })
      console.error(`failed: ${plugin.name}@${plugin.version}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
await Promise.all(Array.from({ length: concurrency }, () => worker()))

const summary = Object.fromEntries([...new Set(results.map(result => result.status))]
  .sort().map(status => [status, results.filter(result => result.status === status).length]))
console.log(`Store publish summary: ${JSON.stringify(summary)}`)
const failures = results.filter(result => result.status === 'failed')
if (failures.length) {
  throw new AggregateError(failures.map(result => new Error(`${result.plugin.name}: ${result.error}`)), `${failures.length} plugin releases failed`)
}
