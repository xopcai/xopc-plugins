import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib.mjs'

const upstream = process.argv[2]
if (!upstream || !existsSync(join(upstream, '.agents', 'plugins', 'marketplace.json'))) {
  throw new Error('Usage: pnpm analyze:openai /path/to/openai/plugins')
}
const marketplace = JSON.parse(readFileSync(join(upstream, '.agents', 'plugins', 'marketplace.json'), 'utf8'))
const allowedLicenses = new Set(['Apache-2.0', 'MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'])
const exists = (directory, file) => existsSync(join(directory, file))
const directories = readdirSync(join(upstream, 'plugins'), { withFileTypes: true }).filter(entry => entry.isDirectory())
const marketplaceByName = new Map(marketplace.plugins.map(entry => [entry.name, entry]))

const plugins = directories.map(entry => {
  const directory = join(upstream, 'plugins', entry.name)
  const pluginJsonPath = join(directory, '.codex-plugin', 'plugin.json')
  let manifest = {}
  try { manifest = JSON.parse(readFileSync(pluginJsonPath, 'utf8')) } catch {}
  const surfaces = {
    skills: exists(directory, 'skills'),
    mcp: exists(directory, '.mcp.json'),
    app: exists(directory, '.app.json'),
    agents: exists(directory, 'agents'),
    commands: exists(directory, 'commands'),
    hooks: exists(directory, 'hooks'),
  }
  const license = manifest.license ?? null
  const portable = surfaces.skills && !surfaces.app && !surfaces.agents && !surfaces.commands && !surfaces.hooks
  const status = !license || !allowedLicenses.has(license)
    ? 'license-review'
    : portable && !surfaces.mcp ? 'portable-skill-review'
      : portable && surfaces.mcp ? 'portable-mcp-review'
        : 'platform-adapter-required'
  return {
    name: entry.name,
    category: marketplaceByName.get(entry.name)?.category ?? null,
    license,
    status,
    surfaces,
  }
}).sort((a, b) => a.name.localeCompare(b.name))

const counts = Object.fromEntries([...new Set(plugins.map(plugin => plugin.status))].sort().map(status => [status, plugins.filter(plugin => plugin.status === status).length]))
const report = {
  schemaVersion: 1,
  upstream: {
    repository: 'https://github.com/openai/plugins',
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: upstream, encoding: 'utf8' }).trim(),
  },
  counts,
  plugins,
}
mkdirSync(join(root, 'reports'), { recursive: true })
writeFileSync(join(root, 'reports', 'openai-compatibility.json'), `${JSON.stringify(report, null, 2)}\n`)
console.log(`Analyzed ${plugins.length} OpenAI plugins: ${JSON.stringify(counts)}`)
