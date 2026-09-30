import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { generatedPlugins } from './plugin-definitions.mjs'
import { root } from './lib.mjs'

const schema = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
const mcpSchema = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'
const pluginsRoot = join(root, 'plugins')
const existingCatalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
const handMaintained = existingCatalog.plugins.filter(entry => !entry.generated)

function sentence(value) {
  const trimmed = value.trim()
  return /[.!?。！？]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function bulletList(values) {
  return values.map(value => `- ${sentence(value)}`).join('\n')
}

for (const plugin of generatedPlugins) {
  const directory = join(pluginsRoot, plugin.name)
  const skillDirectory = join(directory, 'skills', plugin.name)
  mkdirSync(skillDirectory, { recursive: true })
  const manifest = {
    $schema: schema,
    name: plugin.name,
    version: '1.0.0',
    description: plugin.description,
    author: { name: 'XOPC', url: 'https://xopc.ai' },
    homepage: `https://github.com/xopcai/xopc-plugins/tree/main/plugins/${plugin.name}`,
    repository: 'https://github.com/xopcai/xopc-plugins',
    license: 'Apache-2.0',
    keywords: plugin.keywords,
  }
  writeFileSync(join(directory, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(directory, 'README.md'), `# ${plugin.title}\n\n${plugin.description}\n\n## Install\n\n\`\`\`bash\nxopc extensions install store:${plugin.name}\n\`\`\`\n\nThe plugin installs disabled so its declared capabilities can be reviewed before enabling.${plugin.mcp ? ' On first use, XOPC opens the provider OAuth flow and completes setup after authorization.' : ''}\n\n## Included capability\n\n- Skill: \`${plugin.name}\`${plugin.mcp ? `\n- Remote MCP: \`${plugin.mcp.id}\` at \`${plugin.mcp.url}\`` : ''}\n`)
  const compatibility = plugin.mcp
    ? `Requires network access and authorization for ${new URL(plugin.mcp.url).hostname}.`
    : 'Works with user-provided context and available XOPC tools; it does not add network access.'
  const guardrails = plugin.guardrails?.length ? plugin.guardrails : ['State material assumptions and missing evidence', 'Ask before taking external or irreversible action']
  writeFileSync(join(skillDirectory, 'SKILL.md'), `---\nname: ${plugin.name}\ndescription: ${plugin.description}\nlicense: Apache-2.0\ncompatibility: ${compatibility}\n---\n\n# ${plugin.title}\n\nUse this skill when the user needs to ${plugin.description.charAt(0).toLowerCase()}${plugin.description.slice(1)}\n\n## Inputs\n\n${bulletList(plugin.inputs)}\n\nIf essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.\n\n## Method\n\n${plugin.steps.map((step, index) => `${index + 1}. ${sentence(step)}`).join('\n')}\n\n## Deliverables\n\n${bulletList(plugin.outputs)}\n\n## Guardrails\n\n${bulletList(guardrails)}\n`)
  if (plugin.mcp) {
    writeFileSync(join(directory, 'mcp.json'), `${JSON.stringify({
      $schema: mcpSchema,
      mcpServers: { [plugin.mcp.id]: { type: 'streamable-http', url: plugin.mcp.url } },
    }, null, 2)}\n`)
  }
  if (plugin.upstream) {
    writeFileSync(join(directory, 'provenance.json'), `${JSON.stringify({
      schemaVersion: 1,
      relationship: 'format-and-endpoint-reference',
      source: plugin.upstream,
      note: 'XOPC-authored skill content. The referenced upstream manifest supplied interoperability metadata only.',
    }, null, 2)}\n`)
  }
}

const generatedEntries = generatedPlugins.map(plugin => ({
  name: plugin.name,
  version: '1.0.0',
  category: plugin.category,
  phase: plugin.phase,
  path: `plugins/${plugin.name}`,
  generated: true,
  ...(plugin.mcp ? { authentication: 'oauth-on-first-use' } : { authentication: 'none' }),
}))
const catalog = {
  schemaVersion: 2,
  repository: existingCatalog.repository,
  plugins: [...handMaintained, ...generatedEntries].sort((a, b) => a.name.localeCompare(b.name)),
}
writeFileSync(join(root, 'catalog.json'), `${JSON.stringify(catalog, null, 2)}\n`)

const marketplaceDirectory = join(root, '.agents', 'plugins')
mkdirSync(marketplaceDirectory, { recursive: true })
const marketplace = {
  name: 'xopc-official',
  interface: { displayName: 'XOPC Official' },
  plugins: catalog.plugins.map(entry => ({
    name: entry.name,
    source: { source: 'local', path: `./${entry.path}` },
    policy: {
      installation: 'AVAILABLE',
      authentication: entry.authentication === 'oauth-on-first-use' ? 'ON_INSTALL' : 'ON_DEMAND',
    },
    category: entry.category,
  })),
}
writeFileSync(join(marketplaceDirectory, 'marketplace.json'), `${JSON.stringify(marketplace, null, 2)}\n`)

console.log(`Generated ${generatedPlugins.length} managed plugins; catalog now contains ${catalog.plugins.length} plugins`)
