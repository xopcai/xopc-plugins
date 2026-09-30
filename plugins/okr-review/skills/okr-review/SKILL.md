---
name: okr-review
description: Review OKR progress using evidence, confidence, root causes, and concrete corrective actions.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# OKR Review

Use this skill when the user needs to review OKR progress using evidence, confidence, root causes, and concrete corrective actions.

## Inputs

- Objectives and key results.
- Current metrics.
- Initiatives, blockers, and changes.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Validate each metric definition and baseline.
2. Compare actual progress with the expected trajectory.
3. Diagnose causes rather than only restating variance.
4. Recommend continue, change, stop, or reset decisions.

## Deliverables

- Status table.
- Confidence assessment.
- Root-cause analysis.
- Corrective actions.

## Guardrails

- Do not hide metric-definition changes.
- Separate forecast from committed result.
