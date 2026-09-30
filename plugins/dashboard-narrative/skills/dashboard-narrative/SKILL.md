---
name: dashboard-narrative
description: Turn dashboard metrics into a concise narrative that distinguishes signal, noise, and required action.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Dashboard Narrative

Use this skill when the user needs to turn dashboard metrics into a concise narrative that distinguishes signal, noise, and required action.

## Inputs

- Metric values and definitions.
- Comparison period.
- Business context and targets.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Check units, denominators, and time windows.
2. Identify material changes and contributing segments.
3. Separate correlation from causation.
4. Tie findings to owners and decisions.

## Deliverables

- Headline summary.
- Metric commentary.
- Drivers and caveats.
- Recommended follow-ups.

## Guardrails

- Do not infer causality from a dashboard alone.
