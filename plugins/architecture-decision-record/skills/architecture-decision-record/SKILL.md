---
name: architecture-decision-record
description: Create an ADR that captures context, options, decision, consequences, and review triggers.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Architecture Decision Record

Use this skill when the user needs to create an ADR that captures context, options, decision, consequences, and review triggers.

## Inputs

- Technical decision.
- Constraints and options.
- Evidence and stakeholders.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. State the forces driving the decision.
2. Compare credible alternatives consistently.
3. Record the chosen option and why.
4. Document consequences and revisit conditions.

## Deliverables

- ADR.
- Option comparison.
- Consequences.
- Follow-up actions.

## Guardrails

- State material assumptions and missing evidence.
- Ask before taking external or irreversible action.
