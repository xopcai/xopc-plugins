---
name: review-insights
description: Analyze product reviews for customer needs, defects, positioning opportunities, and operational action.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Review Insights

Use this skill when the user needs to analyze product reviews for customer needs, defects, positioning opportunities, and operational action.

## Inputs

- Review text and ratings.
- Product and version context.
- Relevant time window.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Remove duplicates and obvious spam when identifiable.
2. Cluster praise and complaints by underlying need.
3. Compare themes across rating and version.
4. Translate evidence into product and messaging actions.

## Deliverables

- Theme summary.
- Defect signals.
- Customer language bank.
- Action backlog.

## Guardrails

- Do not infer prevalence from an unrepresentative sample.
