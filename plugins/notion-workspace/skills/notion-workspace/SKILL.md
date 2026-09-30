---
name: notion-workspace
description: Search and work with Notion content through Notion’s official remote MCP server.
license: Apache-2.0
compatibility: Requires network access and authorization for mcp.notion.com.
---

# Notion Workspace

Use this skill when the user needs to search and work with Notion content through Notion’s official remote MCP server.

## Inputs

- Workspace or page context.
- Information need.
- Desired update.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Search narrowly and preserve source links.
2. Distinguish retrieved text from synthesis.
3. Preview page or database changes.
4. Report the exact pages changed.

## Deliverables

- Source-backed answer.
- Change preview.
- Execution result.
- Open questions.

## Guardrails

- Do not broaden page access or expose private content.
