---
name: add-e2e-flow
description: Add one E2E flow to e2e-tests through the 4-file chain - selectors, page object, fixture, docs row, spec - then run it and check traceability. Use for "add an E2E flow", "new E2E test", "/add-e2e-flow domain flow".
---

Arguments: `$ARGUMENTS` = `<domain> "<flow>"`, for example `profile "follow an author and see the feed"`.

Follow `e2e-tests/AGENTS.md`, "Add a flow", bottom up, and stop at the first failure:

1. Open the target screens once (`npx playwright codegen https://conduit-realworld-example-app.fly.dev`, or `$WEB_BASE_URL`, or a snapshot) and write `src/selectors/<page>.selectors.ts` from `src/_template/template.selectors.ts.example`. Reuse an existing selectors file when the page exists.
2. Page object `src/pages/<page>.page.ts` from `src/_template/template.page.ts.example`: one `test.step()` per method, `assert*` for checks.
3. Fixture: add the page object to `src/fixtures/<domain>.fixtures.ts` (new file from `src/_template/template.fixtures.ts.example` for a new domain) and chain it in `src/fixtures/test.ts`.
4. Row in `e2e-tests/docs/test-scenarios.md`: next ID of the domain, `Impl = yes`.
5. Spec `tests/<domain>/<domain>-<flow>.spec.ts` from `tests/_template/template.spec.ts.example`; data from `src/test-data/factories.ts`; `track(title)` after a UI create.
6. From the repo root: `npx playwright test -c e2e-tests tests/<domain>`, then `npm run traceability`. `/verify` is the done gate.
7. Report: files touched, the Playwright result line, the `e2e-tests:` traceability line.
