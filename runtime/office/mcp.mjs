import { createInterface } from 'node:readline';
export const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });
export const string = (maxLength = 10000) => ({ type: 'string', minLength: 1, maxLength });
export function validate(value, schema) {
  if (schema.enum && !schema.enum.includes(value)) throw Error('Unsupported value');
  if (schema.type === 'object') {
    if (!value || Array.isArray(value) || typeof value !== 'object') throw Error('Expected object');
    for (const key of schema.required || []) if (!(key in value)) throw Error(`Missing field: ${key}`);
    for (const [key, item] of Object.entries(value)) { if (!schema.properties?.[key]) throw Error(`Unknown field: ${key}`); validate(item, schema.properties[key]); }
  } else if (schema.type === 'array') {
    if (!Array.isArray(value) || value.length > (schema.maxItems ?? 100)) throw Error('Invalid array');
    for (const item of value) validate(item, schema.items);
  } else if (schema.type === 'integer' || schema.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value) || schema.type === 'integer' && !Number.isInteger(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) throw Error('Invalid number');
  } else if (typeof value !== schema.type || schema.type === 'string' && (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? 10000))) throw Error(`Invalid ${schema.type}`);
}
export async function serve(name, tools, initialize = async () => {}) {
  await initialize();
  const lines = createInterface({ input: process.stdin });
  for await (const line of lines) {
    if (line.length > 1024 * 1024) { process.exitCode = 1; break; }
    let message; try { message = JSON.parse(line); } catch { continue; }
    if (message.id === undefined) continue;
    let result;
    try {
      if (message.method === 'initialize') result = { protocolVersion: message.params?.protocolVersion || '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: `xopc-${name}`, version: '1.0.0' } };
      else if (message.method === 'tools/list') result = { tools: tools.map(({ execute, ...tool }) => tool) };
      else if (message.method === 'ping') result = {};
      else if (message.method === 'tools/call') {
        const tool = tools.find(value => value.name === message.params?.name); if (!tool) throw Error('Unknown tool');
        const args = message.params.arguments ?? {}; validate(args, tool.inputSchema);
        const output = await tool.execute(args);
        result = { content: [{ type: 'text', text: JSON.stringify(output) }] };
      } else throw Error('Unsupported MCP method');
    } catch (error) {
      let text = String(error.message || 'Operation failed');
      for (const value of [process.env.ACCESS_TOKEN].filter(Boolean)) text = text.replaceAll(value, '[redacted]');
      result = { isError: true, content: [{ type: 'text', text: text.slice(0, 500) }] };
    }
    console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }));
  }
}
