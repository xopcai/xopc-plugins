---
name: metric-definition
description: Define a metric precisely enough for consistent implementation, interpretation, and governance.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Metric Definition

Use this skill when the user needs to define a metric precisely enough for consistent implementation, interpretation, and governance.

## Inputs

- Business concept.
- Source data.
- Decision and audience.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Define entity, event, grain, and population.
2. Specify numerator, denominator, filters, and time semantics.
3. Document edge cases and exclusions.
4. Set owner and change-control process.

## Deliverables

- Metric contract.
- Example calculations.
- Validation tests.
- Governance record.

## Guardrails

- State material assumptions and missing evidence.
- Ask before taking external or irreversible action.
