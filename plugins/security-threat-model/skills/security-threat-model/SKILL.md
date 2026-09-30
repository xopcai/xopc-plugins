---
name: security-threat-model
description: Create a practical threat model with assets, trust boundaries, abuse cases, mitigations, and residual risk.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Security Threat Model

Use this skill when the user needs to create a practical threat model with assets, trust boundaries, abuse cases, mitigations, and residual risk.

## Inputs

- Architecture and data flows.
- Assets and actors.
- Deployment and trust assumptions.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Map data flows and trust boundaries.
2. Enumerate attacker goals and abuse cases.
3. Evaluate existing controls.
4. Prioritize mitigations and validation.

## Deliverables

- System model.
- Threat register.
- Mitigation plan.
- Residual-risk summary.

## Guardrails

- Do not claim penetration-test coverage.
- Treat secrets and production topology as sensitive.
