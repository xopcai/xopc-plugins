---
name: api-design-review
description: Review an API contract for consistency, evolvability, security, failure behavior, and developer usability.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# API Design Review

Use this skill when the user needs to review an API contract for consistency, evolvability, security, failure behavior, and developer usability.

## Inputs

- API specification.
- Use cases.
- Compatibility and security constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Trace primary and failure journeys.
2. Review resource and operation semantics.
3. Check errors, pagination, idempotency, and versioning.
4. Assess authentication and data exposure.

## Deliverables

- Findings by severity.
- Contract revisions.
- Compatibility notes.
- Test cases.

## Guardrails

- State material assumptions and missing evidence.
- Ask before taking external or irreversible action.
