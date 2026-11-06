---
name: add-e2e-flow
description: Add one E2E flow to e2e-tests through the 4-file chain - selectors, page object, fixture, docs row, spec - then run it and check traceability. Use for "add an E2E flow", "new E2E test", "/add-e2e-flow domain flow".
---

`$ARGUMENTS` = `<domain> "<flow>"`, for example `profile "follow an author and see the feed"`.

Follow `e2e-tests/AGENTS.md`, "Add a flow", bottom up; stop at the first failure.

1. Selectors `src/selectors/<page>.selectors.ts` from the template, after one look at the screens (`npx playwright codegen https://conduit-realworld-example-app.fly.dev` or `$WEB_BASE_URL`). Reuse the file when the page exists.
2. Page object `src/pages/<page>.page.ts` from the template: one `test.step()` per method, `assert*` for checks.
3. Fixture: the page object in `src/fixtures/<domain>.fixtures.ts`, chained in `src/fixtures/test.ts`.
4. Row in `e2e-tests/docs/test-scenarios.md`, next ID of the domain, `Impl = yes`.
5. Spec `tests/<domain>/<domain>-<flow>.spec.ts` from the template: title `"<ID> <flow>"`, tags `{ tag: ["@<domain>", "@<layer>"] }`, data from `src/test-data/factories.ts`, `track(title)` after a UI create.
6. `npx playwright test -c e2e-tests tests/<domain>`, then `npm run traceability`.
7. Report: files touched, the Playwright result line, the `e2e-tests:` traceability line.
