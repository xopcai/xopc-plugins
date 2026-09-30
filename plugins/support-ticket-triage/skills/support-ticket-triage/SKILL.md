---
name: support-ticket-triage
description: Classify support tickets by severity, product area, reproducibility, and next action.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Support Ticket Triage

Use this skill when the user needs to classify support tickets by severity, product area, reproducibility, and next action.

## Inputs

- Ticket text and attachments.
- Service-level policy.
- Product and customer context.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Identify impact and affected scope.
2. Extract reproduction evidence and environment.
3. Assign category and severity using policy.
4. Draft clarification or escalation steps.

## Deliverables

- Triage record.
- Reproduction summary.
- Customer response draft.
- Escalation package.

## Guardrails

- Do not expose one customer’s data to another.
- Do not promise unconfirmed resolution dates.
