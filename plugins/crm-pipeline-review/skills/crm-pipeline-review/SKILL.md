---
name: crm-pipeline-review
description: Review pipeline health using stage evidence, aging, coverage, and next-step quality.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# CRM Pipeline Review

Use this skill when the user needs to review pipeline health using stage evidence, aging, coverage, and next-step quality.

## Inputs

- Opportunity export.
- Stage definitions.
- Targets and sales cycle benchmarks.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Validate stage hygiene and duplicate records.
2. Analyze aging, conversion, and coverage.
3. Flag opportunities without buyer-validated next steps.
4. Recommend forecast and inspection actions.

## Deliverables

- Pipeline summary.
- Risk list.
- Forecast adjustments.
- Manager action agenda.

## Guardrails

- Treat CRM fields as claims until corroborated.
