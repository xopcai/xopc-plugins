import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { zipSync } from 'fflate'
import { catalog, filesUnder, root, sha256 } from './lib.mjs'

const output = join(root, 'dist')
rmSync(output, { recursive: true, force: true })
mkdirSync(output, { recursive: true })
const sourceDate = new Date('1980-01-01T00:00:00.000Z')
const release = { schemaVersion: 1, repository: catalog().repository, plugins: [] }

for (const entry of catalog().plugins) {
  const directory = join(root, entry.path)
  const files = Object.fromEntries(filesUnder(directory).map(file => [
    file.name,
    [new Uint8Array(readFileSync(file.path)), { mtime: sourceDate }],
  ]))
  const archive = Buffer.from(zipSync(files, { level: 9 }))
  const artifact = `${entry.name}-${entry.version}.zip`
  writeFileSync(join(output, artifact), archive)
  release.plugins.push({ ...entry, artifact, sha256: sha256(archive) })
}

writeFileSync(join(output, 'release-manifest.json'), `${JSON.stringify(release, null, 2)}\n`)
console.log(`Built ${release.plugins.length} deterministic plugin archives in dist/`)
