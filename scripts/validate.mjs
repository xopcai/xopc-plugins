import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { catalog, filesUnder, root } from './lib.mjs'

const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
const NAME = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const failures = []
const assert = (condition, message) => { if (!condition) failures.push(message) }
const entries = catalog().plugins
const names = new Set()

assert(catalog().schemaVersion === 2, 'catalog: schemaVersion must be 2')
assert(entries.length >= 80, 'catalog: P2 requires at least 80 plugins')
assert(entries.filter(entry => entry.phase === 'P0' || !entry.phase).length >= 20, 'catalog: P0 requires at least 20 plugins')
assert(entries.filter(entry => ['P0', 'P1'].includes(entry.phase) || !entry.phase).length >= 50, 'catalog: P1 requires at least 50 plugins')

const catalogPaths = new Set(entries.map(entry => entry.path))
for (const directory of readdirSync(join(root, 'plugins'), { withFileTypes: true }).filter(entry => entry.isDirectory())) {
  assert(catalogPaths.has(`plugins/${directory.name}`), `${directory.name}: plugin directory is missing from catalog`)
}

for (const entry of entries) {
  assert(!names.has(entry.name), `${entry.name}: duplicate catalog name`)
  names.add(entry.name)
  assert(entry.path === `plugins/${entry.name}`, `${entry.name}: catalog path must match plugin name`)
  assert(typeof entry.category === 'string' && NAME.test(entry.category), `${entry.name}: invalid category`)
  assert(['none', 'oauth-on-first-use'].includes(entry.authentication ?? 'none'), `${entry.name}: invalid authentication policy`)
  const directory = join(root, entry.path)
  const manifestPath = join(directory, 'plugin.json')
  assert(existsSync(manifestPath), `${entry.name}: missing plugin.json`)
  assert(existsSync(join(directory, 'README.md')), `${entry.name}: missing README.md`)
  assert(existsSync(join(directory, 'skills')), `${entry.name}: missing skills directory`)
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert(manifest.$schema === PLUGIN_SCHEMA, `${entry.name}: unsupported plugin schema`)
  assert(manifest.name === entry.name && NAME.test(manifest.name), `${entry.name}: invalid manifest name`)
  assert(manifest.version === entry.version, `${entry.name}: catalog and manifest versions differ`)
  assert(typeof manifest.description === 'string' && manifest.description.trim(), `${entry.name}: description is required`)
  const xopc = manifest.extensions?.['ai.xopc']
  assert(xopc && typeof xopc === 'object', `${entry.name}: extensions.ai.xopc is required`)
  assert(typeof xopc?.localizations?.en?.displayName === 'string' && xopc.localizations.en.displayName.trim(), `${entry.name}: English display name is required`)
  assert(typeof xopc?.localizations?.['zh-CN']?.displayName === 'string' && xopc.localizations['zh-CN'].displayName.trim(), `${entry.name}: Chinese display name is required`)
  assert(xopc?.branding?.icon === 'assets/icon.svg', `${entry.name}: branding icon must be assets/icon.svg`)
  assert(existsSync(join(directory, 'assets', 'icon.svg')), `${entry.name}: missing assets/icon.svg`)

  let skillCount = 0
  for (const file of filesUnder(join(directory, 'skills'))) {
    if (!file.name.endsWith('/SKILL.md')) continue
    skillCount += 1
    const skillName = file.name.split('/')[0]
    const source = readFileSync(file.path, 'utf8')
    const header = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    assert(Boolean(header), `${entry.name}/${skillName}: missing Skill frontmatter`)
    assert(new RegExp(`^name:\\s*${skillName}\\s*$`, 'm').test(header?.[1] ?? ''), `${entry.name}/${skillName}: Skill name must match directory`)
    assert(/^description:\s*\S.+$/m.test(header?.[1] ?? ''), `${entry.name}/${skillName}: Skill description is required`)
    assert(source.includes('## Guardrails') || !entry.generated, `${entry.name}/${skillName}: generated Skill must include guardrails`)
  }
  assert(skillCount > 0, `${entry.name}: at least one Skill is required`)

  const mcpPath = join(directory, 'mcp.json')
  if (existsSync(mcpPath)) {
    const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
    assert(mcp.$schema === MCP_SCHEMA && mcp.mcpServers && typeof mcp.mcpServers === 'object', `${entry.name}: invalid mcp.json`)
    const serialized = JSON.stringify(mcp)
    assert(!/(API_?KEY|TOKEN|SECRET|PASSWORD)/i.test(serialized), `${entry.name}: mcp.json must not declare credential fields`)
    for (const [serverName, server] of Object.entries(mcp.mcpServers ?? {})) {
      assert(NAME.test(serverName), `${entry.name}: invalid MCP server name ${serverName}`)
      if (server?.type === 'streamable-http' || server?.type === 'sse') {
        let url
        try { url = new URL(server.url) } catch { /* reported below */ }
        assert(url?.protocol === 'https:' && !url.username && !url.password && !url.hash, `${entry.name}: remote MCP must use a public credential-free HTTPS URL`)
        assert(entry.authentication === 'oauth-on-first-use', `${entry.name}: remote MCP must declare oauth-on-first-use`)
      }
    }
  } else {
    assert(entry.authentication !== 'oauth-on-first-use', `${entry.name}: OAuth policy requires mcp.json`)
  }
}

const marketplacePath = join(root, '.agents', 'plugins', 'marketplace.json')
assert(existsSync(marketplacePath), 'marketplace: missing .agents/plugins/marketplace.json')
if (existsSync(marketplacePath)) {
  const marketplace = JSON.parse(readFileSync(marketplacePath, 'utf8'))
  assert(marketplace.name === 'xopc-official', 'marketplace: invalid name')
  assert(marketplace.plugins?.length === entries.length, 'marketplace: plugin count differs from catalog')
  for (const plugin of marketplace.plugins ?? []) {
    assert(names.has(plugin.name), `marketplace: unknown plugin ${plugin.name}`)
    assert(plugin.source?.path === `./plugins/${plugin.name}`, `marketplace: invalid source path for ${plugin.name}`)
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Validated ${catalog().plugins.length} Agent Plugins`)
}
