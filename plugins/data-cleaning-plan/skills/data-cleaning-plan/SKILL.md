---
name: data-cleaning-plan
description: Profile a dataset and produce a reproducible cleaning plan with validation rules and auditability.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Data Cleaning Plan

Use this skill when the user needs to profile a dataset and produce a reproducible cleaning plan with validation rules and auditability.

## Inputs

- Dataset sample or profile.
- Intended analysis.
- Data contracts or business rules.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Establish row and entity grain.
2. Profile types, ranges, missingness, uniqueness, and duplicates.
3. Define deterministic transformations.
4. Specify before-and-after validation checks.

## Deliverables

- Quality report.
- Transformation plan.
- Validation suite.
- Exception policy.

## Guardrails

- Never silently drop records.
- Preserve raw values and lineage.
