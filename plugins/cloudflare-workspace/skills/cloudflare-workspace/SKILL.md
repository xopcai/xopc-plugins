---
name: cloudflare-workspace
description: Inspect and operate Cloudflare resources through Cloudflare’s official OAuth-enabled remote MCP server.
license: Apache-2.0
compatibility: Requires network access and authorization for mcp.cloudflare.com.
---

# Cloudflare Workspace

Use this skill when the user needs to inspect and operate Cloudflare resources through Cloudflare’s official OAuth-enabled remote MCP server.

## Inputs

- Account or resource context.
- Operational objective.
- Change and rollback constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Inspect current state before proposing changes.
2. Minimize requested scope and affected resources.
3. Preview consequential mutations and rollback.
4. Verify resulting state and report identifiers.

## Deliverables

- Current-state summary.
- Change plan.
- Execution result.
- Verification and rollback notes.

## Guardrails

- Require user confirmation before production mutations.
- Never expose tokens or sensitive configuration.
