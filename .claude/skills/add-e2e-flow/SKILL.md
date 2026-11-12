---
name: add-e2e-flow
description: Add one E2E flow to e2e-tests through the 4-file chain - selectors, page object, fixture, docs row, spec - then run it, check traceability and review it in a capped loop. Use for "add an E2E flow", "new E2E test", "/add-e2e-flow domain flow".
---

`$ARGUMENTS` = `<domain> "<flow>" [<tier>]`, for example `social "follow an author and see their article in my feed" sanity`.

Follow `e2e-tests/AGENTS.md`, "Add a flow", bottom up; stop at the first failure before step 8, the only loop.

1. Tier, one of `smoke` (proves the product works), `sanity` (a daily action), `regression` (a fixed bug), `release-check` (an entry point): from `$ARGUMENTS`, else from the existing docs row, else ask once.
2. Selectors `src/selectors/<page>.selectors.ts` from the template, after one look at the screens of the `TEST_ENV` target: `npx playwright codegen <its URL>` when a person is at the screen, else the frontend source (on `local`, `docker exec local-app-1 ls /conduit/frontend/src`). Locators by role and name, placeholder or text, as codegen proposes them; one CSS class only for what has no role (ADR 0008). Reuse the file when the page exists.
3. Page object `src/pages/<page>.page.ts` from the template: one `this.step()` per method, `assert*` for checks.
4. Fixture: the page object in `src/fixtures/<domain>.fixtures.ts` on `authenticatedPage` (on `page` only for a flow that starts logged out, as `authPage` and `navbar`), chained in `src/fixtures/test.ts`.
5. Row in `e2e-tests/docs/test-scenarios.md`, next ID of the domain, its `Priority`, its `Tier`, `Impl = yes`. For a designed row, `Impl = yes`, its ID out of italics in the grid, the count of the first line and the "Left out" text follow.
6. Spec `tests/<domain>/<domain>-<flow>.spec.ts` from the template: title `"<ID> <flow>"`, tags `{ tag: ["@<domain>", "@<layer>", "@<priority>", "@<tier>"] }`, data from `src/test-data/factories.ts`, `track(title)` after a UI create.
7. `TEST_ENV=local npx playwright test -c e2e-tests tests/<domain>` when a local Conduit runs, else the same on the demo, once; then `npm run traceability`.
8. Review loop, at most 3 rounds: agent `harness-reviewer` on the diff, `/triage e2e` first when the run is red. Fix only `test` rows and Critical or Major findings, then step 7 again. Done when the run is green and the reviewer ends `0 critical, 0 major`. Hand back on any other row, on a finding only a change to a rule or an ADR would close (the rule is a person's call, never edited to close a finding), or with the findings of the third review unfixed. Every rerun of step 7 is on `TEST_ENV=local` (`npm run conduit:local`); without a local Conduit, hand back after the first review, before any rerun: the demo gets one run per flow, never a loop.
9. Report: files touched, the Playwright result line, the `e2e-tests:` traceability line, the rounds used and the last reviewer line; `/verify` on `TEST_ENV=local` is the done gate, left to the person without a local Conduit.
