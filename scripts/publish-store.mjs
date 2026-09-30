import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib.mjs'

const store = (process.env.XOPC_STORE_URL ?? 'https://store.xopc.ai').replace(/\/$/, '')
const apiKey = process.env.XOPC_API_KEY
if (!apiKey) throw new Error('XOPC_API_KEY is required')
execFileSync(process.execPath, [join(root, 'scripts/build.mjs')], { stdio: 'inherit' })
const release = JSON.parse(readFileSync(join(root, 'dist/release-manifest.json'), 'utf8'))
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

for (const plugin of release.plugins) {
  const manifest = JSON.parse(readFileSync(join(root, plugin.path, 'plugin.json'), 'utf8'))
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
  if (!response.ok) throw new Error(`${plugin.name}: ${result.error?.message ?? response.statusText}`)
  console.log(`Submitted ${plugin.name}@${plugin.version} (${result.versionId})`)
  if (process.env.XOPC_ADMIN_API_KEY) {
    const approval = await fetch(`${store}/api/v1/admin/versions/${encodeURIComponent(result.versionId)}/approve`, {
      method: 'POST', headers: { 'x-api-key': process.env.XOPC_ADMIN_API_KEY },
    })
    if (!approval.ok) throw new Error(`${plugin.name}: approval failed (${approval.status})`)
    const verification = await fetch(`${store}/api/v1/admin/packages/${encodeURIComponent(plugin.name)}/publisher-verification`, {
      method: 'POST',
      headers: { 'x-api-key': process.env.XOPC_ADMIN_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ verified: true }),
    })
    if (!verification.ok) throw new Error(`${plugin.name}: publisher verification failed (${verification.status})`)
    console.log(`Published ${plugin.name}@${plugin.version}`)
  }
}
