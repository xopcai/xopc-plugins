import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '')

export function catalog() {
  return JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'))
}

export function filesUnder(directory) {
  const files = []
  const visit = current => {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name)
      const stat = statSync(path)
      if (stat.isDirectory()) visit(path)
      else if (stat.isFile()) files.push({ path, name: relative(directory, path).replaceAll('\\', '/') })
      else throw new Error(`Unsupported package entry: ${path}`)
    }
  }
  visit(directory)
  return files
}

export function sha256(data) {
  return createHash('sha256').update(data).digest('hex')
}
