import { createRequire as __xopcCreateRequire } from "node:module"; const require = __xopcCreateRequire(import.meta.url);

// runtime/office/mcp.mjs
import { createInterface } from "node:readline";
var object = (properties, required = []) => ({ type: "object", properties, required, additionalProperties: false });
var string = (maxLength = 1e4) => ({ type: "string", minLength: 1, maxLength });
function validate(value, schema) {
  if (schema.enum && !schema.enum.includes(value)) throw Error("Unsupported value");
  if (schema.type === "object") {
    if (!value || Array.isArray(value) || typeof value !== "object") throw Error("Expected object");
    for (const key of schema.required || []) if (!(key in value)) throw Error(`Missing field: ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (!schema.properties?.[key]) throw Error(`Unknown field: ${key}`);
      validate(item, schema.properties[key]);
    }
  } else if (schema.type === "array") {
    if (!Array.isArray(value) || value.length > (schema.maxItems ?? 100)) throw Error("Invalid array");
    for (const item of value) validate(item, schema.items);
  } else if (schema.type === "integer" || schema.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value) || schema.type === "integer" && !Number.isInteger(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity)) throw Error("Invalid number");
  } else if (typeof value !== schema.type || schema.type === "string" && (value.length < (schema.minLength ?? 0) || value.length > (schema.maxLength ?? 1e4))) throw Error(`Invalid ${schema.type}`);
}
async function serve(name, tools, initialize = async () => {
}) {
  await initialize();
  const lines = createInterface({ input: process.stdin });
  for await (const line of lines) {
    if (line.length > 1024 * 1024) {
      process.exitCode = 1;
      break;
    }
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue;
    }
    if (message.id === void 0) continue;
    let result;
    try {
      if (message.method === "initialize") result = { protocolVersion: message.params?.protocolVersion || "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: `xopc-${name}`, version: "1.0.0" } };
      else if (message.method === "tools/list") result = { tools: tools.map(({ execute, ...tool }) => tool) };
      else if (message.method === "ping") result = {};
      else if (message.method === "tools/call") {
        const tool = tools.find((value) => value.name === message.params?.name);
        if (!tool) throw Error("Unknown tool");
        const args = message.params.arguments ?? {};
        validate(args, tool.inputSchema);
        const output = await tool.execute(args);
        result = { content: [{ type: "text", text: JSON.stringify(output) }] };
      } else throw Error("Unsupported MCP method");
    } catch (error) {
      let text = String(error.message || "Operation failed");
      for (const value of [process.env.ACCESS_TOKEN].filter(Boolean)) text = text.replaceAll(value, "[redacted]");
      result = { isError: true, content: [{ type: "text", text: text.slice(0, 500) }] };
    }
    console.log(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
  }
}

// runtime/office/vault.mjs
import { realpath, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve, relative, join, dirname, isAbsolute } from "node:path";
var inside = (root, path) => path === root || !relative(root, path).startsWith("..") && !isAbsolute(relative(root, path));
async function fileIn(vault, path, create = false) {
  const root = await realpath(vault);
  if (!(await stat(root)).isDirectory()) throw Error("Vault must be a directory supplied by the user");
  const candidate = resolve(root, path);
  if (!inside(root, candidate) || !candidate.toLowerCase().endsWith(".md")) throw Error("Use a Markdown path inside this vault");
  const actual = create ? join(await realpath(dirname(candidate)), candidate.slice(dirname(candidate).length + 1)) : await realpath(candidate);
  if (!inside(root, actual)) throw Error("Symlinks may not escape the selected vault");
  return { root, path: actual };
}
async function vaultRead({ vault, path }) {
  const file = await fileIn(vault, path);
  if ((await stat(file.path)).size > 512e3) throw Error("Note exceeds 500 KiB");
  const text = await readFile(file.path, "utf8");
  return { path: relative(file.root, file.path), text, links: [...text.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g)].map((match) => match[1]).slice(0, 100) };
}
async function vaultSearch({ vault, query, limit = 20 }) {
  const root = await realpath(vault), matches = [];
  let count = 0, truncated = false;
  async function walk(dir, depth = 0) {
    if (depth > 20) {
      truncated = true;
      return;
    }
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || ["node_modules"].includes(entry.name) || entry.isSymbolicLink()) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path, depth + 1);
      else if (entry.isFile() && entry.name.endsWith(".md")) {
        if (++count > 3e3) {
          truncated = true;
          return;
        }
        if ((await stat(path)).size > 512e3) continue;
        const text = await readFile(path, "utf8"), index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index >= 0) matches.push({ path: relative(root, path), excerpt: text.slice(Math.max(0, index - 100), index + 500) });
      }
      if (count > 3e3) return;
    }
  }
  await walk(root);
  return { matches: matches.slice(0, limit), total: matches.length, scannedFiles: Math.min(count, 3e3), truncated: truncated || matches.length > limit };
}
async function vaultCapture({ vault, path, text, confirm }) {
  if (confirm !== true) throw Error("Creating a note requires explicit user intent and confirm=true");
  if (text.length > 128e3) throw Error("Note exceeds 128 KiB");
  const file = await fileIn(vault, path, true);
  await writeFile(file.path, text, { flag: "wx", mode: 384 });
  return { path: relative(file.root, file.path), created: true, bytes: Buffer.byteLength(text) };
}

// runtime/office/entries/vault.mjs
await serve("obsidian", [
  { name: "vault_search", description: "Search Markdown in a vault directory explicitly provided by the user; excludes hidden files and symlinks. No automatic home scan.", inputSchema: object({ vault: string(), query: string(500), limit: { type: "integer", minimum: 1, maximum: 100 } }, ["vault", "query"]), execute: vaultSearch },
  { name: "vault_read", description: "Read one Markdown note and wiki links inside the explicitly selected vault; reject traversal/symlink escape.", inputSchema: object({ vault: string(), path: string() }, ["vault", "path"]), execute: vaultRead },
  { name: "vault_capture", description: "Create a NEW Markdown note inside the selected vault only when requested by the user; never overwrite or delete. Requires confirm=true.", inputSchema: object({ vault: string(), path: string(), text: string(128e3), confirm: { type: "boolean" } }, ["vault", "path", "text", "confirm"]), execute: vaultCapture }
]);
