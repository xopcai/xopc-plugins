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
- The plugin combines at least two capability surfaces: Skill, MCP, App, Agent, Command, Hook, or executable scripts.
- Skills declare inputs, method, deliverables, and safety guardrails.
- Credentials are never committed or declared in `mcp.json`.
- Remote MCP endpoints use public HTTPS and standard OAuth on first use.
- External source material has an approved license and recorded provenance.
- Installation, capability review, enablement, and one representative task have been tested in XOPC.

## Publisher levels

- **Official**: maintained and released by XOPC.
- **Verified partner**: maintained by an identified organization with reviewed ownership and release controls.
- **Community**: reviewed for packaging and safety, without an XOPC maintenance commitment.

Every release remains subject to Store malware, archive, capability, and provenance checks.
