# XOPC Plugins

Official portable [Agent Plugins](https://agent-plugins.org/) maintained by XOPC. The catalog contains 80+ independently installable workflow and connector-backed plugins across product, engineering, office, research, data, finance, marketing, commerce, support, HR, security, education, and compliance.

## Install in xopc

Use the capability marketplace, or the CLI:

```bash
xopc extensions install store:research-brief
xopc extensions install store:meeting-actions
xopc extensions install store:data-toolkit
xopc extensions install store:prd-writer
xopc extensions install store:linear-workspace
```

Plugins install disabled. Review the declared Skills and MCP capabilities, then enable the plugin. Most catalog plugins are content-only and require no account. Connector-backed plugins start the provider OAuth flow on first use; credentials remain in XOPC's local authorization store. `data-toolkit` runs a dependency-free local Node.js MCP process and never sends input data over the network.

## Development and release

```bash
pnpm install
pnpm generate
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

`XOPC_ADMIN_API_KEY` is optional. Without it, uploads remain in the Store review queue. Publishing is incremental, skips byte-identical versions, continues independent uploads after a failure, and prints an aggregate result. Use `pnpm publish:store -- --dry-run` to verify the complete release locally or `XOPC_PUBLISH_PHASES=P0,P1` to select rollout phases.

## Contributing and upstream review

Use `pnpm new my-plugin productivity` to scaffold a community contribution. See [CONTRIBUTING.md](CONTRIBUTING.md) for acceptance criteria and [docs/roadmap.md](docs/roadmap.md) for the P0–P2 supply model.

OpenAI's catalog can be classified without copying it:

```bash
pnpm analyze:openai /path/to/openai/plugins
```

The report separates portable candidates from plugins that need an XOPC adapter or license review.

## Security

See [SECURITY.md](SECURITY.md). Plugin releases are validated by the Store, bound to a source commit and SHA-256 digest, and installed by xopc only after an explicit capability review.

Apache-2.0
