---
name: knowledge-base-writer
description: Turn resolved support knowledge into a searchable, safe, and maintainable help article.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Knowledge Base Writer

Use this skill when the user needs to turn resolved support knowledge into a searchable, safe, and maintainable help article.

## Inputs

- Resolved issue and verified fix.
- Audience and product version.
- Support style guide.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Define symptom and applicability.
2. Write the shortest safe resolution path.
3. Include verification and rollback.
4. Add search terms and maintenance owner.

## Deliverables

- Article draft.
- Troubleshooting decision tree.
- Verification steps.
- Metadata.

## Guardrails

- Do not publish secrets or internal-only controls.
