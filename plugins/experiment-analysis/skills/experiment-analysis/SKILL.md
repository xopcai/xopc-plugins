---
name: experiment-analysis
description: Evaluate an experiment using valid metrics, uncertainty, guardrails, and a defensible ship decision.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Experiment Analysis

Use this skill when the user needs to evaluate an experiment using valid metrics, uncertainty, guardrails, and a defensible ship decision.

## Inputs

- Hypothesis and assignment design.
- Metric results and sample sizes.
- Guardrails and runtime.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Check randomization and exposure integrity.
2. Evaluate primary and guardrail metrics.
3. Report effect size and uncertainty.
4. Assess novelty, peeking, and segmentation risks.

## Deliverables

- Validity review.
- Results table.
- Decision recommendation.
- Follow-up experiment plan.

## Guardrails

- Do not claim significance without an appropriate test.
- Avoid post-hoc subgroup conclusions.
