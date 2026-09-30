import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { catalog, filesUnder, root } from './lib.mjs'

const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
const NAME = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const failures = []
const assert = (condition, message) => { if (!condition) failures.push(message) }

for (const entry of catalog().plugins) {
  const directory = join(root, entry.path)
  const manifestPath = join(directory, 'plugin.json')
  assert(existsSync(manifestPath), `${entry.name}: missing plugin.json`)
  if (!existsSync(manifestPath)) continue
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  assert(manifest.$schema === PLUGIN_SCHEMA, `${entry.name}: unsupported plugin schema`)
  assert(manifest.name === entry.name && NAME.test(manifest.name), `${entry.name}: invalid manifest name`)
  assert(manifest.version === entry.version, `${entry.name}: catalog and manifest versions differ`)
  assert(typeof manifest.description === 'string' && manifest.description.trim(), `${entry.name}: description is required`)

  for (const file of filesUnder(join(directory, 'skills'))) {
    if (!file.name.endsWith('/SKILL.md')) continue
    const skillName = file.name.split('/')[0]
    const source = readFileSync(file.path, 'utf8')
    const header = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    assert(Boolean(header), `${entry.name}/${skillName}: missing Skill frontmatter`)
    assert(new RegExp(`^name:\\s*${skillName}\\s*$`, 'm').test(header?.[1] ?? ''), `${entry.name}/${skillName}: Skill name must match directory`)
    assert(/^description:\s*\S.+$/m.test(header?.[1] ?? ''), `${entry.name}/${skillName}: Skill description is required`)
  }

  const mcpPath = join(directory, 'mcp.json')
  if (existsSync(mcpPath)) {
    const mcp = JSON.parse(readFileSync(mcpPath, 'utf8'))
    assert(mcp.$schema === MCP_SCHEMA && mcp.mcpServers && typeof mcp.mcpServers === 'object', `${entry.name}: invalid mcp.json`)
    const serialized = JSON.stringify(mcp)
    assert(!/(API_?KEY|TOKEN|SECRET|PASSWORD)/i.test(serialized), `${entry.name}: mcp.json must not declare credential fields`)
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Validated ${catalog().plugins.length} Agent Plugins`)
}
