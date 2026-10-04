# XOPC Plugins

Official portable [Agent Plugins](https://agent-plugins.org/) maintained by XOPC. The catalog intentionally contains a small set of compound plugins that combine workflow guidance with executable tools, connectors, apps, agents, commands, or scripts.

## Install in xopc

Use the capability marketplace, or the CLI:

```bash
xopc extensions install store:data-toolkit
xopc extensions install store:linear-workspace
xopc extensions install store:supabase
xopc extensions install store:zoom
xopc extensions install store:expo
```

Plugins install disabled. Review their declared capabilities before enabling them. Connector-backed plugins start the provider OAuth flow on first use; credentials remain in XOPC's local authorization store. `data-toolkit` runs a dependency-free local Node.js MCP process and never sends input data over the network.

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
