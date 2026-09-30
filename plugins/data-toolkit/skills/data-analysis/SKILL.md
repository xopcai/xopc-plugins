---
name: data-analysis
description: Inspect JSON or CSV methodically, validate shape and quality, calculate summaries with local tools, and communicate reproducible findings.
license: Apache-2.0
compatibility: Uses the data-toolkit local MCP server when installed and enabled.
---

# Local data analysis

Use the `csv_summary` and `json_get` tools for data pasted or supplied explicitly by the user.

Before analysis, identify columns or JSON structure, missing values, likely types, units, and the user's decision question. Report row counts and data-quality limitations before drawing conclusions. Keep transformations reproducible by naming the tool and arguments used. Distinguish observations from interpretation, and do not claim statistical significance without an appropriate test and sample context.

The tools do not read local files or use the network. Do not work around that boundary without asking the user to provide the relevant data through an authorized mechanism.
