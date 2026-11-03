---
name: verify
description: Run the repo's "done" gate (lint, format, types, API suite, E2E suite, traceability) and report one line per step. Use for "verify", "is it green", "run the gate", "/verify".
---

Run `npm run verify` from the repo root.

Report one line per step, in this order: `lint`, `format`, `typecheck`, `test:api`, `test:e2e`, `traceability`.
Each line is `ok` or the first failing line of that step, verbatim. The script stops at the first failure: mark the later steps `not run`.
Do not fix anything from this skill; name the step and hand back.
