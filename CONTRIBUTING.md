# Contributing plugins

XOPC accepts portable Agent Plugins that produce a clear user outcome and can be reviewed independently.

## Start a plugin

```bash
pnpm new my-plugin productivity
```

Complete the generated files, add one entry to `catalog.json`, and run:

```bash
pnpm validate
pnpm test
pnpm build
```

## Acceptance criteria

- The plugin solves a distinct task; it is not a renamed prompt or a thin workflow checklist.
- `plugin.json`, `README.md`, and at least one `skills/<name>/SKILL.md` are present.
- The plugin combines domain-specific guidance with a usable runtime, high-quality specialist references or executable helpers. Unsupported app bindings, hooks and commands are not shipped as working capabilities.
- Skills include task-specific inputs, decision criteria and deliverables without repeating generic boilerplate.
- Credentials are never committed. MCP environment/header values reference declared userConfig fields; real values are saved locally.
- Remote MCP endpoints use public HTTPS. Authorizations use the shared install/detail flow and support Skip for now.
- External source material has an approved license and recorded provenance.
- Installation, capability review, enablement, and one representative task have been tested in XOPC.

## Publisher levels

- **Official**: maintained and released by XOPC.
- **Verified partner**: maintained by an identified organization with reviewed ownership and release controls.
- **Community**: reviewed for packaging and safety, without an XOPC maintenance commitment.

Every release remains subject to Store malware, archive, capability, and provenance checks.

## Store publication review

Every catalog entry must explicitly declare `storeStatus` (`published` or `unpublished`) and `storeDecisionReason`. Build artifacts preserve archived packages for development; the public marketplace, default publisher and release staging include only reviewed `published` entries. A Skill-only guide or a copy of a generic runtime is not sufficient evidence for a distinct public plugin. Record executable behavior, account prerequisites and the actual validation level before changing an archived entry back to `published`. See `docs/plugin-value-audit-2026-10-19.md`.

Official plugin changes must start here. Update catalog and source before any Store mutation; after publishing run `pnpm store:sync` (preview), `pnpm store:sync -- --apply` when needed, and `pnpm store:check`. Include historical retired entries in catalog, not a separate server-only list. See [single-source workflow](docs/store-source-of-truth.md).
