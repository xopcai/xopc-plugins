import { createInterface } from 'node:readline'

const tools = [
  {
    name: 'csv_summary',
    description: 'Summarize CSV text locally: headers, row count, missing counts, and numeric ranges.',
    inputSchema: {
      type: 'object',
      properties: { csv: { type: 'string', description: 'CSV text including a header row' } },
      required: ['csv'],
      additionalProperties: false,
    },
  },
  {
    name: 'json_get',
    description: 'Read a value from JSON text using a dot-separated object/array path.',
    inputSchema: {
      type: 'object',
      properties: {
        json: { type: 'string', description: 'JSON text' },
        path: { type: 'string', description: 'Dot path such as users.0.name; empty returns the root' },
      },
      required: ['json', 'path'],
      additionalProperties: false,
    },
  },
]

function parseCsv(source) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted && character === '"' && source[index + 1] === '"') { field += '"'; index += 1 }
    else if (character === '"') quoted = !quoted
    else if (!quoted && character === ',') { row.push(field); field = '' }
    else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && source[index + 1] === '\n') index += 1
      row.push(field); field = ''
      if (row.some(value => value.length > 0)) rows.push(row)
      row = []
    } else field += character
  }
  row.push(field)
  if (row.some(value => value.length > 0)) rows.push(row)
  if (!rows.length) throw new Error('CSV is empty')
  const headers = rows[0]
  if (!headers.length || headers.some(header => !header.trim())) throw new Error('CSV headers must not be blank')
  return { headers, rows: rows.slice(1) }
}

function csvSummary(source) {
  const { headers, rows } = parseCsv(source)
  const columns = headers.map((name, index) => {
    const values = rows.map(row => row[index] ?? '')
    const present = values.filter(value => value.trim() !== '')
    const numeric = present.map(Number).filter(Number.isFinite)
    return {
      name,
      missing: values.length - present.length,
      ...(present.length > 0 && numeric.length === present.length
        ? { type: 'number', min: Math.min(...numeric), max: Math.max(...numeric), mean: numeric.reduce((sum, value) => sum + value, 0) / numeric.length }
        : { type: 'string', unique: new Set(present).size }),
    }
  })
  return { rowCount: rows.length, columnCount: headers.length, columns }
}

function jsonGet(source, path) {
  let value = JSON.parse(source)
  for (const segment of path ? path.split('.') : []) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, segment)) throw new Error(`Path not found: ${path}`)
    value = value[segment]
  }
  return value
}

function result(id, value) {
  return { jsonrpc: '2.0', id, result: value }
}

async function handle(message) {
  const { id, method, params } = message
  if (method === 'initialize') return result(id, { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'xopc-data-toolkit', version: '1.0.0' } })
  if (method === 'notifications/initialized') return null
  if (method === 'ping') return result(id, {})
  if (method === 'tools/list') return result(id, { tools })
  if (method === 'tools/call') {
    try {
      const args = params?.arguments ?? {}
      const value = params?.name === 'csv_summary' ? csvSummary(String(args.csv ?? ''))
        : params?.name === 'json_get' ? jsonGet(String(args.json ?? ''), String(args.path ?? ''))
          : (() => { throw new Error(`Unknown tool: ${String(params?.name)}`) })()
      return result(id, { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] })
    } catch (error) {
      return result(id, { isError: true, content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }] })
    }
  }
  return id === undefined ? null : { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } }
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity })
for await (const line of input) {
  if (!line.trim()) continue
  try {
    const response = await handle(JSON.parse(line))
    if (response) process.stdout.write(`${JSON.stringify(response)}\n`)
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: error instanceof Error ? error.message : String(error) } })}\n`)
  }
}
