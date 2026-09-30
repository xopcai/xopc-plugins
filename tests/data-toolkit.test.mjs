import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import test from 'node:test'

test('data-toolkit serves MCP tools and performs local summaries', async t => {
  const child = spawn(process.execPath, ['plugins/data-toolkit/mcp/server.mjs'], { stdio: ['pipe', 'pipe', 'inherit'] })
  t.after(() => child.kill())
  const output = createInterface({ input: child.stdout })
  const lines = []
  output.on('line', line => lines.push(JSON.parse(line)))
  const request = (id, method, params = {}) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
  const waitFor = async id => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const found = lines.find(item => item.id === id)
      if (found) return found
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    throw new Error(`Timed out waiting for response ${id}`)
  }

  request(1, 'initialize', { protocolVersion: '2025-06-18' })
  assert.equal((await waitFor(1)).result.serverInfo.name, 'xopc-data-toolkit')
  request(2, 'tools/list')
  assert.deepEqual((await waitFor(2)).result.tools.map(tool => tool.name), ['csv_summary', 'json_get'])
  request(3, 'tools/call', { name: 'csv_summary', arguments: { csv: 'name,value\na,2\nb,4\nc,' } })
  const summary = JSON.parse((await waitFor(3)).result.content[0].text)
  assert.equal(summary.rowCount, 3)
  assert.deepEqual(summary.columns[1], { name: 'value', missing: 1, type: 'number', min: 2, max: 4, mean: 3 })
  request(4, 'tools/call', { name: 'json_get', arguments: { json: '{"users":[{"name":"Ada"}]}', path: 'users.0.name' } })
  assert.equal(JSON.parse((await waitFor(4)).result.content[0].text), 'Ada')
})
