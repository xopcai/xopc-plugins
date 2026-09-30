---
name: invoice-review
description: Review invoices for completeness, contract alignment, duplicates, anomalies, and approval readiness.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Invoice Review

Use this skill when the user needs to review invoices for completeness, contract alignment, duplicates, anomalies, and approval readiness.

## Inputs

- Invoice.
- Purchase order or contract.
- Receipt and approval policy.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Validate supplier and invoice identity.
2. Reconcile quantities, rates, tax, and totals.
3. Check duplicate and exception signals.
4. Document approval or dispute reasons.

## Deliverables

- Review checklist.
- Variance table.
- Exception log.
- Approval recommendation.

## Guardrails

- Never authorize payment.
- Mask bank and tax identifiers in summaries.
