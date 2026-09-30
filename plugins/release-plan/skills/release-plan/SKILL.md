---
name: release-plan
description: Create a release plan covering scope, dependencies, verification, rollout, communication, and rollback.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Release Plan

Use this skill when the user needs to create a release plan covering scope, dependencies, verification, rollout, communication, and rollback.

## Inputs

- Change list.
- Target environments.
- Operational constraints and owners.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Identify release-critical dependencies.
2. Define preflight and go/no-go checks.
3. Sequence rollout and observation windows.
4. Specify rollback triggers and ownership.

## Deliverables

- Release checklist.
- Timeline and owners.
- Verification matrix.
- Rollback plan.

## Guardrails

- Never mark an unverified check complete.
- Keep irreversible operations explicit.
