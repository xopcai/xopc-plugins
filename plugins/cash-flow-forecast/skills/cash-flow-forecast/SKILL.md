---
name: cash-flow-forecast
description: Build a scenario-based cash-flow forecast with assumptions, timing, and liquidity risks.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Cash Flow Forecast

Use this skill when the user needs to build a scenario-based cash-flow forecast with assumptions, timing, and liquidity risks.

## Inputs

- Opening cash.
- Expected receipts and payments.
- Timing assumptions and commitments.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Normalize cash timing.
2. Separate committed and probabilistic flows.
3. Build base, downside, and upside scenarios.
4. Identify minimum cash points and triggers.

## Deliverables

- Forecast table.
- Assumption register.
- Scenario analysis.
- Liquidity actions.

## Guardrails

- Label estimates and uncertainty.
- Do not substitute for professional financial advice.
