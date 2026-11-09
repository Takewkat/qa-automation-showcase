---
name: verify
description: Run the repo's "done" gate (lint, format, types, API suite, E2E suite, traceability, P1 scenario report) and report one line per step. Use for "verify", "is it green", "run the gate", "/verify".
---

Run `npm run verify` from the repo root. Report one line per step, in order: `lint`, `format`, `typecheck`, `test:api`, `test:e2e`, `traceability`, `report:scenarios`, each `ok` or the first failing line, verbatim. A failure in the first three stops the script: mark the rest `not run`. When a suite, traceability or the P1 gate fails, the triage follows: pass on its `triage:` line, or its single line when it has none. Fix nothing from this skill; name the step and hand back.
