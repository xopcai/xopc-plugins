# XOPC Plugins

Focused plugins for XOPC, packaged as standard Codex-compatible archives. The catalog contains 20 capabilities migrated from an Accio installation and four retained specialist packages: Data Toolkit, Expo, Supabase and Zoom. Test-only Codex, Claude, OAuth and Extension packages remain on the Store for regression testing.

## Install

Open XOPC → Extensions → Store. Select a plugin, review the declared capabilities, and install. Resources are prepared automatically. Connect an account or choose **Skip for now**; the installed card shows **Authorization required** until connected. Return to plugin details at any time to connect or retry. Plugins are available to all Agents.

```sh
xopc extensions install store:yuque
xopc extensions install store:dingtalk
xopc extensions install store:feishu
```

- **Yuque:** Access Token, validated against the real user API.
- **DingTalk:** official managed CLI and local browser login.
- **Feishu:** official managed CLI, QR application setup or App ID/Secret, then user authorization.
- **Gmail:** local Google OAuth using your own Desktop OAuth client; Google requires this application configuration. Gmail API must be enabled and test accounts admitted where applicable.
- **OpenBoost:** public remote MCP with provider OAuth and the user's own subscription.

Other migrated business plugins are explicitly **independent workflow editions**. They work with user data, public browser pages and already connected official tools. They include actual local analysis, HTML reporting and basic DOCX/XLSX/PPTX processing. They do not include Accio's private backend, account bridge or cloud publishing services. The migration report lists the scope of every package; this is not a claim of identical cloud functionality.

## Build and verify

```sh
pnpm install
pnpm generate
pnpm validate
pnpm test
pnpm build
```

`generate` synchronizes the marketplace and self-contained runtime files without overwriting authored skills. `build` emits deterministic `.codex-plugin/plugin.json` and `.mcp.json` ZIP artifacts with SHA-256 digests. Runtime dependencies are pinned Store resources selected automatically for macOS/Linux/Windows on x64/arm64.

Use `pnpm publish:store -- --dry-run` to review a release. Publishing uses maintainer credentials through environment variables; no credentials belong in this repository. `scripts/publish-on-store.mjs` is the server-side release runner with an ephemeral key, hash checks, approval and idempotent resource uploads. Run it only in the Store workspace after uploading the release artifacts.

See [migration inventory](reports/accio-migration-2026-10-19/inventory.json), [CONTRIBUTING.md](CONTRIBUTING.md), and the release validation report in the same report directory. Wrapper/runtime code is Apache-2.0; retained official skills preserve upstream licensing and attribution in each package.
