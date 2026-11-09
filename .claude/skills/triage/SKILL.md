---
name: triage
description: Sort the failures of the last run into infra, contract, flaky, test, product or unsure, each with its evidence and the next step; read-only. Use for "triage", "why is it red", "what failed", "/triage".
---

`$ARGUMENTS` = an optional part, `api` or `e2e`, when only that part ran.

Run `npm run triage -- $ARGUMENTS` from the repo root. Its first lines date the run each part's report comes from; a part that did not run this time is not this run's. The script sorts what the report proves: `infra` (the `rate-limited` annotation, a 429 received, no HTTP answer), `contract` (a response outside its schema, the error text of `shared/api/contract.ts`), `flaky` (passed on retry). Those verdicts stand; a `read` row is the only one left to judge, and its console follows the table.

For each `read` row, from evidence only:

1. Read the error and its `Where`: the spec line, then the helper that threw (`via`). Read the spec, the page object or endpoint class it calls, and the docs row of its ID (`<part>-tests/docs/test-scenarios.md`).
2. Read the console of the row under the table (`[api]` calls with their status, `[ui]` steps), then its artifact: the screenshot (E2E) or `error-context.md` (API). The trace in the same folder opens only in a window (`npx playwright show-trace`): when nothing else settles the row, call it `unsure` and name the trace.
3. Check the `Common errors` table of `api-tests/AGENTS.md` or `e2e-tests/AGENTS.md`: a known cause names its fix.
4. Verdict: `infra` when a `Common errors` row names the environment as the cause (a 5xx from the demo host); `product` when the target (on `TEST_ENV=local`, the reference stub) does what its docs row or the spec says it must not (cite the row or the spec line); `test` when the test asserts what neither says, or a page object waits on the wrong thing (cite file:line); `unsure` when the evidence does not decide, naming the artifact that would.

Never edit a file, rerun a suite (on the demo a rerun spends the budget and can turn every row into `infra`), reopen a verdict the script gave, or call a row `test` to make it fixable.

Report one line per table row, the script's verdicts copied as they stand, `<test title> <verdict> <evidence> - <next step>`, then `N infra, N contract, N flaky, N test, N product, N unsure`. Only a `test` row is fixed by an agent; every other verdict goes to a person.
