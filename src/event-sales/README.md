# src/event-sales

Local-only lead and demo module for live events.

- `model.ts`: pipeline stages, consent states, proposal approval states and the prospect types.
- `demo-harness.ts`: deterministic in-memory harness with synthetic fixtures; no network or service adapters.
- Markdown sales material: playbook, service catalog, proposal template, demo catalog, live-demo runbook and deployment checklist.
- Nothing here sends messages automatically; decisions go to a human reviewer.
