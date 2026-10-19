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
