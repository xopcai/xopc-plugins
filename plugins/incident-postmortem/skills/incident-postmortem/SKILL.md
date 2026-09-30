---
name: incident-postmortem
description: Produce a blameless incident review with timeline, contributing factors, corrective actions, and learning.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Incident Postmortem

Use this skill when the user needs to produce a blameless incident review with timeline, contributing factors, corrective actions, and learning.

## Inputs

- Incident timeline and evidence.
- Customer impact.
- Detection and response details.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Normalize timestamps and distinguish facts from recollection.
2. Trace technical and organizational contributing factors.
3. Evaluate detection and mitigation.
4. Assign durable corrective actions with owners.

## Deliverables

- Impact summary.
- Timeline.
- Contributing-factor analysis.
- Action register.

## Guardrails

- Avoid single-person blame.
- Do not reduce systemic failures to one root cause.
