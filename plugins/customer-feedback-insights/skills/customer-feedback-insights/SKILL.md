---
name: customer-feedback-insights
description: Synthesize customer feedback into themes, severity, evidence, and prioritized product opportunities.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Customer Feedback Insights

Use this skill when the user needs to synthesize customer feedback into themes, severity, evidence, and prioritized product opportunities.

## Inputs

- Feedback records or transcripts.
- Customer segment context.
- Product goals.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Normalize feedback without erasing customer language.
2. Cluster by underlying need rather than keyword alone.
3. Count evidence and flag selection bias.
4. Prioritize by reach, severity, confidence, and strategic fit.

## Deliverables

- Theme map.
- Evidence excerpts.
- Opportunity backlog.
- Research gaps.

## Guardrails

- Redact personal data.
- Do not present anecdotal frequency as population prevalence.
