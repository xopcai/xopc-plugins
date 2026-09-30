---
name: linear-workspace
description: Plan and execute issue, project, and team workflows through Linear’s official remote MCP server.
license: Apache-2.0
compatibility: Requires network access and authorization for mcp.linear.app.
---

# Linear Workspace

Use this skill when the user needs to plan and execute issue, project, and team workflows through Linear’s official remote MCP server.

## Inputs

- Workspace context.
- Project or issue objective.
- Desired read or write action.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Search before creating duplicate work.
2. Summarize proposed mutations before executing them.
3. Keep status, owner, and due-date changes explicit.
4. Report created or changed object identifiers.

## Deliverables

- Workspace findings.
- Proposed changes.
- Execution result.
- Follow-up actions.

## Guardrails

- Require user confirmation before consequential or bulk changes.
