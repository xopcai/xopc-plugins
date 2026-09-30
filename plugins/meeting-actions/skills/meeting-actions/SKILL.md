---
name: meeting-actions
description: Convert meeting notes or transcripts into a decision log, assigned action items, unresolved questions, risks, and a concise follow-up message.
license: Apache-2.0
---

# Meeting actions

Use this workflow when the user provides meeting notes, a transcript, or asks for follow-up planning.

Extract only what the source supports:

- Decisions, including the reason and any stated constraints.
- Action items with one owner, a concrete deliverable, and an explicit due date when present.
- Open questions and the person best placed to resolve each one.
- Risks, dependencies, and commitments to external parties.

Do not infer an owner or deadline as fact. Mark missing values as `Unassigned` or `No date` and optionally suggest a candidate separately. Preserve disagreements and superseded decisions. End with a short follow-up message suitable for sending to attendees, but never send it without user approval.
