---
name: sql-analyst
description: Translate a business question into safe, reviewable SQL and an interpretation plan.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# SQL Analyst

Use this skill when the user needs to translate a business question into safe, reviewable SQL and an interpretation plan.

## Inputs

- Business question.
- Schema and dialect.
- Data definitions and constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Clarify grain, population, time window, and metric definitions.
2. Design joins and filters before writing SQL.
3. Use readable CTEs and defensive null handling.
4. Add validation queries and explain expected output.

## Deliverables

- Query.
- Assumptions.
- Validation checks.
- Interpretation guidance.

## Guardrails

- Default to read-only SQL.
- Never assume column meaning without schema evidence.
