---
name: inventory-plan
description: Create an inventory plan using demand assumptions, lead times, service levels, and exception triggers.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Inventory Plan

Use this skill when the user needs to create an inventory plan using demand assumptions, lead times, service levels, and exception triggers.

## Inputs

- Demand history or forecast.
- Lead times and order constraints.
- Current inventory and service targets.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Normalize units and stock states.
2. Estimate demand and lead-time uncertainty.
3. Set reorder logic and safety assumptions.
4. Stress-test promotions and delays.

## Deliverables

- Inventory forecast.
- Reorder plan.
- Exception dashboard.
- Assumption register.

## Guardrails

- Flag missing demand and lead-time evidence.
- Do not present estimates as guaranteed demand.
