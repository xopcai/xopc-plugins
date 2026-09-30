---
name: analytics-tracking-plan
description: Design an event tracking plan that is minimal, testable, privacy-aware, and tied to decisions.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Analytics Tracking Plan

Use this skill when the user needs to design an event tracking plan that is minimal, testable, privacy-aware, and tied to decisions.

## Inputs

- User journeys.
- Product questions.
- Existing event taxonomy and privacy rules.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Map decisions to required signals.
2. Define event names, triggers, and properties.
3. Specify identity and time semantics.
4. Add QA and governance controls.

## Deliverables

- Event schema.
- Journey map.
- QA checklist.
- Governance plan.

## Guardrails

- Avoid collecting unnecessary personal data.
