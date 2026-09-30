---
name: requirements-review
description: Review requirements for ambiguity, completeness, testability, dependencies, and hidden scope.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Requirements Review

Use this skill when the user needs to review requirements for ambiguity, completeness, testability, dependencies, and hidden scope.

## Inputs

- Requirements document.
- System context.
- Delivery constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Map actors and journeys.
2. Find ambiguous or unverifiable statements.
3. Check edge cases and non-functional requirements.
4. Rank clarification questions by delivery risk.

## Deliverables

- Findings by severity.
- Clarification questions.
- Rewritten acceptance criteria.
- Dependency map.

## Guardrails

- State material assumptions and missing evidence.
- Ask before taking external or irreversible action.
