---
name: figma-workspace
description: Inspect Figma design context and support design-to-implementation workflows through Figma’s official remote MCP server.
license: Apache-2.0
compatibility: Requires network access and authorization for mcp.figma.com.
---

# Figma Workspace

Use this skill when the user needs to inspect Figma design context and support design-to-implementation workflows through Figma’s official remote MCP server.

## Inputs

- Figma file or selection.
- Design question.
- Implementation constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Retrieve the smallest relevant design context.
2. Preserve component and variable semantics.
3. Compare design intent with implementation constraints.
4. Link findings back to source nodes.

## Deliverables

- Design context summary.
- Component mapping.
- Implementation notes.
- Open design questions.

## Guardrails

- Do not claim pixel parity without rendering and verification.
