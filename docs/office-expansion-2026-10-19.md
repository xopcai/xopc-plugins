# Office and everyday research plugins — 2026-10-19

## Product scope

Eight focused plugins extend the existing 24-package catalog. Five require no cloud account and install directly; three use the host's existing generic account setup. Installation remains global for all Agents. Account selection and unusual per-Agent policies remain optional Agent settings, not installation steps.

| Store package | User value | Connection | Limits |
| --- | --- | --- | --- |
| rss-reader | Collect Chinese/international RSS/Atom sources; import OPML, deduplicate, preserve timestamps | None | Public HTTPS or supplied XML; no login bypass |
| web-clipper | Extract articles and save source-cited Markdown in a private local library | None | Static public HTML; no authenticated browser session or JavaScript rendering |
| pdf-reader | Read selected PDFs by page for evidence-based summaries | None | Text PDFs, 20 MiB, bounded page ranges; scanned pages need separate OCR |
| calendar-ics | Review exported/public calendars, recurrence and overlaps | None | Read-only ICS; explicit time window, floating times reported as UTC |
| obsidian | Search/read a selected Markdown vault; capture new notes | None | Explicit vault path; no automatic disk scan, overwrite or delete |
| notion-office | Workspace research, meeting preparation and decision capture | Official Notion MCP OAuth | Provider controls available tools and workspace scopes |
| todoist | Read tasks/projects and create/complete explicitly requested tasks | Personal API token | No live user account acceptance claimed |
| readwise-reader | Search reading backlog and save requested articles | Reader API token | Reader API access/subscription required; no live user account acceptance claimed |

Notion uses a distinct plugin slug because Store already has a useful `notion` connector. It adds task-oriented workflows rather than replacing that connector. Original vector icons are included in every archive.

## Ecosystem research and selection

- [OpenAI plugin catalog](https://github.com/openai/plugins) and [Notion workflows](https://github.com/openai/plugins/blob/main/plugins/notion/README.md): research, meeting context and knowledge capture are reusable product ideas. Their ChatGPT App bindings are not portable standalone credentials, so these were not copied into XOPC.
- [Claude official plugin catalog](https://github.com/anthropics/claude-plugins-official): separate provider tools from task-focused Skills. New packages use portable plugin manifests, MCP and authored Skills, with XOPC setup metadata layered on top.
- [Notion's official MCP setup](https://developers.notion.com/guides/mcp/get-started-with-mcp): use the official `https://mcp.notion.com/mcp` endpoint and native OAuth. Discovery supports dynamic client registration and PKCE S256.
- [Slack MCP](https://docs.slack.dev/ai/slack-mcp-server/): excluded this round because its fixed client registration requirement does not support the promised simple arbitrary-user OAuth installation.
- Existing Feishu, DingTalk and Yuque account integrations already address domestic office accounts. Public Chinese feeds, article collection, PDF evidence and Markdown notes extend everyday domestic usage without adding another account setup screen.

Official implementation references: [RSS](https://www.rssboard.org/rss-specification), [iCalendar RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), [Obsidian files](https://help.obsidian.md/Files+and+folders/Manage+notes), [Todoist API v1](https://developer.todoist.com/api/v1/), [Readwise Reader API](https://readwise.io/reader_api), [Mozilla Readability](https://github.com/mozilla/readability), [unpdf](https://github.com/unjs/unpdf).

## Architecture and interaction

Host code remains unchanged. It renders existing declarative setup methods and owns preparation, encrypted local configuration, skip/resume, native MCP projection, global availability and removal. Provider behavior stays in each plugin. Notion uses the native OAuth transport; Todoist/Reader declare one sensitive token field and validate identity against the official API before exposing tools. A missing account can be skipped and resumed from details, with private tools withheld until connected.

All seven local stdio servers are bundled into their Store archives. No npm/pip installation or third-party runtime code download is required during installation. Skills instruct Agents to preserve sources, distinguish missing evidence, and request writes only for explicit user intent. The host can install these through its generic portable plugin mechanism.

Public fetches allow HTTPS only, validate DNS addresses at socket lookup, reject private/reserved addresses, revalidate redirects, and bound response sizes/time. They carry no account cookies or Authorization headers. Vault operations enforce realpath containment and reject symlink escape. Token APIs use pinned official origins, reject redirects, and avoid secret-bearing error output. Provider writes require an explicit `confirm` argument in addition to user intent in the Skill.

## Reproduce

Use the package manager version pinned in package.json, then `pnpm validate`, `pnpm test`, and `pnpm build`. `scripts/build-office.mjs` bundles the seven office runtimes. Their third-party license texts are retained in each package; `scripts/office-notices.mjs` regenerates notices from the installed locked dependencies. The existing `generate` command also synchronizes older provider runtimes and should only be used with corresponding version bumps.

Store integration verification requires a sibling XOPC checkout and its dependencies. From that checkout run:

```sh
pnpm exec tsx ../xopc-plugins/scripts/verify-office-store.mts
```

The harness uses an isolated configuration/database and an authenticated local Gateway. It downloads actual Store releases and checks hashes, inspections, preparation, skipped-account indicators, durable receipts and two-Agent global availability. Five local plugins are invoked through native pi MCP sessions. Tool selection is deterministic in this integration test; it is not a paid-model production conversation. Notion's real OAuth challenge is obtained then cancelled without consenting to an account. Todoist/Reader account validation and writes use synthetic HTTP responses in unit tests; production user credentials are not invented or reused.

## Release verification

Published all eight packages as 1.0.0 to the public Store. Validation and all 20 tests passed. The Store integration harness passed for all eight: five real local MCP calls, three deferred account states, an official Notion OAuth challenge, two-Agent global availability and receipt reload. Public Chinese RSS and article extraction were also tested against 少数派. [Machine-readable evidence](office-expansion-2026-10-19.result.json) records exact archive hashes and boundaries. No changes to XOPC core or the Store service were required.
