import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { root } from './lib.mjs'

const [name, category = 'productivity'] = process.argv.slice(2)
if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  throw new Error('Usage: pnpm new <lowercase-plugin-name> [category]')
}
const directory = join(root, 'plugins', name)
const skillDirectory = join(directory, 'skills', name)
if (existsSync(directory)) throw new Error(`plugins/${name} already exists`)
mkdirSync(skillDirectory, { recursive: true })
writeFileSync(join(directory, 'plugin.json'), `${JSON.stringify({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name,
  version: '1.0.0',
  description: `TODO: describe the user outcome delivered by ${name}.`,
  author: { name: 'Contributor' },
  repository: 'TODO',
  license: 'Apache-2.0',
  keywords: [category],
}, null, 2)}\n`)
writeFileSync(join(directory, 'README.md'), `# ${name}\n\nTODO: explain the outcome, inputs, and installation.\n`)
writeFileSync(join(skillDirectory, 'SKILL.md'), `---\nname: ${name}\ndescription: TODO: state when and why the agent should use this skill.\nlicense: Apache-2.0\n---\n\n# ${name}\n\n## Inputs\n\n- TODO\n\n## Method\n\n1. TODO\n\n## Deliverables\n\n- TODO\n\n## Guardrails\n\n- State assumptions and ask before external actions.\n`)
console.log(`Created plugins/${name}. Add it to catalog.json, then run pnpm validate.`)
