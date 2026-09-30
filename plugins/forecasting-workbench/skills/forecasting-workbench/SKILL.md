---
name: forecasting-workbench
description: Build a forecast with baseline, drivers, uncertainty, backtesting, and decision thresholds.
license: Apache-2.0
compatibility: Works with user-provided context and available XOPC tools; it does not add network access.
---

# Forecasting Workbench

Use this skill when the user needs to build a forecast with baseline, drivers, uncertainty, backtesting, and decision thresholds.

## Inputs

- Historical series.
- Known future drivers.
- Decision horizon and error costs.

If essential context is unavailable, identify the smallest missing input and continue with clearly labeled assumptions when doing so is safe.

## Method

1. Check granularity, missingness, seasonality, and structural breaks.
2. Establish a naive baseline.
3. Compare candidate assumptions or models.
4. Backtest and communicate prediction intervals.

## Deliverables

- Forecast.
- Backtest table.
- Scenario range.
- Monitoring triggers.

## Guardrails

- Do not present point forecasts without uncertainty.
