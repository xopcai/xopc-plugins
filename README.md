# XOPC Plugins

Focused plugins for XOPC, packaged as standard Codex-compatible archives. The catalog contains 33 packages: 20 capabilities migrated from an Accio installation, four retained specialist packages, and nine focused office and information-collection plugins. Test-only Codex, Claude, OAuth and Extension packages remain on the Store for regression testing.

## Install

Open XOPC → 插件 → 插件市场. Select a plugin, review the declared capabilities, and install. Resources are prepared automatically. Connect an account or choose **Skip for now**; the installed card shows **Authorization required** until connected. Return to plugin details at any time to connect or retry. Plugins are available to all Agents.

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
pnpm validate
pnpm test
pnpm build
```

`generate` synchronizes the marketplace and self-contained runtime files without overwriting authored skills. `build` emits deterministic `.codex-plugin/plugin.json` and `.mcp.json` ZIP artifacts with SHA-256 digests. Runtime dependencies are pinned Store resources selected automatically for macOS/Linux/Windows on x64/arm64.

Use `pnpm publish:store -- --dry-run` to review a release. Publishing uses maintainer credentials through environment variables; no credentials belong in this repository. `scripts/publish-on-store.mjs` is the server-side release runner with an ephemeral key, hash checks, approval and idempotent resource uploads. Run it only in the Store workspace after uploading the release artifacts.

See [migration inventory](reports/accio-migration-2026-10-19/inventory.json), [CONTRIBUTING.md](CONTRIBUTING.md), and the release validation report in the same report directory. Wrapper/runtime code is Apache-2.0; retained official skills preserve upstream licensing and attribution in each package.

## Office and information collection

| Plugin | Outcome | Setup |
| --- | --- | --- |
| RSS Reader | RSS/Atom briefs, OPML imports, deduplication with dates and links | None |
| Web Clipper | Read public articles, save/search a private Markdown clip library | None |
| PDF Reader + OCR | Page-cited PDF text and offline Chinese/English scan OCR | None; engines/models prepared from Store |
| File Organizer | Selected-folder preview, approved no-clobber moves and journaled undo | None; folder supplied in chat |
| Calendar ICS | Recurring events, exceptions and overlap checks from ICS exports | None; local/text/public calendar |
| Obsidian | Search/read a selected Markdown vault; explicitly requested new notes | User supplies vault folder in chat |
| Notion | Workspace research, meeting preparation and knowledge capture | Official Notion OAuth |
| Todoist | Read projects/tasks; explicitly requested task creation/completion | API Token |
| Readwise Reader | Read library/tags; save explicitly requested article URLs | Access Token |

The local runtimes are bundled into the Store archive; installation does not run npm/pip or download code from third-party registries. Do not run `generate` merely to add catalog entries: it also synchronizes existing provider runtimes, which requires versioning affected releases. `build-office.mjs` only rebuilds the new office runtimes. SaaS account access is verified with the provider at connection time; release tests use synthetic accounts and do not claim production OAuth consent. See `docs/office-expansion-2026-10-19.md`.

This batch: [OCR, file organization and domestic integration report](docs/office-v2-2026-10-19.md). Microsoft 365 is deferred until an XOPC application Client ID is available; no placeholder is published.
