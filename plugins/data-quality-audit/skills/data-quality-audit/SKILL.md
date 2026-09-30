---
name: data-quality-audit
description: Audit data quality across completeness, validity, consistency, uniqueness, timeliness, and lineage.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Data Quality Audit

Use this skill when the user needs to audit data quality across completeness, validity, consistency, uniqueness, timeliness, and lineage.

## Inputs

- Dataset or profile.
- Data contract.
- Downstream uses and service levels.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Map critical fields and lineage.
2. Test each quality dimension.
3. Quantify impact by downstream use.
4. Prioritize remediation and monitoring.

## Deliverables

- Audit report.
- Issue register.
- Validation rules.
- Monitoring plan.

## Guardrails

- State material assumptions and missing evidence.
- Ask before taking external or irreversible action.
