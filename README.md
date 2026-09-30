# XOPC Plugins

Official portable [Agent Plugins](https://agent-plugins.org/) maintained by XOPC. Every directory under `plugins/` is independently installable in xopc and other Agent Plugins 1.0 compatible clients.

## Install in xopc

Use the capability marketplace, or the CLI:

```bash
xopc extensions install store:research-brief
xopc extensions install store:meeting-actions
xopc extensions install store:data-toolkit
```

Plugins install disabled. Review the declared Skills and MCP capabilities, then enable the plugin. `data-toolkit` runs a dependency-free local Node.js MCP process and never sends input data over the network.

## Development and release

```bash
pnpm install
pnpm validate
pnpm test
pnpm build
```

`pnpm build` creates deterministic ZIP artifacts and `dist/release-manifest.json`. Maintainers sync a build to XOPC Store with:

```bash
XOPC_STORE_URL=https://store.xopc.ai \
XOPC_API_KEY=... \
XOPC_ADMIN_API_KEY=... \
pnpm publish:store
```

`XOPC_ADMIN_API_KEY` is optional. Without it, uploads remain in the Store review queue.

## Security

See [SECURITY.md](SECURITY.md). Plugin releases are validated by the Store, bound to a source commit and SHA-256 digest, and installed by xopc only after an explicit capability review.

Apache-2.0
