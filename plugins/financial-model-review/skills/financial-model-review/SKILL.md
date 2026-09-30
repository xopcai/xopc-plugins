---
name: financial-model-review
description: Review a financial model for structural integrity, assumptions, sensitivities, and decision relevance.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Financial Model Review

Use this skill when the user needs to review a financial model for structural integrity, assumptions, sensitivities, and decision relevance.

## Inputs

- Model or exported formulas.
- Business assumptions.
- Decision and forecast horizon.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Trace inputs to outputs.
2. Check units, signs, periods, and circularity.
3. Challenge material assumptions.
4. Run sensitivities around key drivers.

## Deliverables

- Model audit.
- Assumption review.
- Sensitivity table.
- Decision implications.

## Guardrails

- Do not claim audit assurance.
- Preserve original formulas and versions.
