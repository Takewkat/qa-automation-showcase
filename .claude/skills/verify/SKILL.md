---
name: verify
description: Run the repo's "done" gate (lint, format, types, API suite, E2E suite, traceability, P1 scenario report) and report one line per step. Use for "verify", "is it green", "run the gate", "/verify".
---

Run `npm run verify` from the repo root.

Report one line per step, in this order: `lint`, `format`, `typecheck`, `test:api`, `test:e2e`, `traceability`, `report:scenarios`.
Each line is `ok` or the first failing line of that step, verbatim. A failure in `lint`, `format` or `typecheck` stops the script: mark the later steps `not run`. The suites, `traceability` and `report:scenarios` all run even when one of them fails.
Do not fix anything from this skill; name the step and hand back.
