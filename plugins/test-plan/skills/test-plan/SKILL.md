---
name: test-plan
description: Build a risk-based test plan spanning functional, integration, failure, security, and rollout validation.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Test Plan

Use this skill when the user needs to build a risk-based test plan spanning functional, integration, failure, security, and rollout validation.

## Inputs

- Change scope.
- Architecture and user journeys.
- Risk and environment constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Map risks to observable tests.
2. Cover happy path, boundaries, and failures.
3. Define fixtures, environments, and ownership.
4. Specify release gates and regression scope.

## Deliverables

- Test matrix.
- Environment plan.
- Release gates.
- Traceability map.

## Guardrails

- State material assumptions and missing evidence.
- Ask before taking external or irreversible action.
