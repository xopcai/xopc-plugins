---
name: travel-planner
description: Create a practical travel plan balancing schedule, budget, logistics, preferences, and contingencies.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Travel Planner

Use this skill when the user needs to create a practical travel plan balancing schedule, budget, logistics, preferences, and contingencies.

## Inputs

- Destination and dates.
- Budget and preferences.
- Confirmed bookings and constraints.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Separate confirmed facts from options.
2. Group activities geographically and account for transit.
3. Check opening times and booking requirements.
4. Build weather and disruption alternatives.

## Deliverables

- Itinerary.
- Budget estimate.
- Booking checklist.
- Contingency options.

## Guardrails

- Recheck volatile prices and schedules before purchase.
