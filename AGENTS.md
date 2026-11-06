# qa-automation-showcase: rules for agents

Read this first, then `api-tests/AGENTS.md` or `e2e-tests/AGENTS.md`. Every rule has a tool, and its error text names the rule.

## Map

- `api-tests/` Part 1: Job Offer API tests, Playwright `request` + TypeScript. Target: the reference stub, or a deployment through `TEST_ENV` / `API_BASE_URL`.
- `e2e-tests/` Part 2: Conduit E2E flows, live demo by default.
- `shared/` what both parts extend: `api/` the endpoint base and the contract check, `cleanup/` the leftovers report. Imports no part.
- `config/` the environments table and the reporter set. `scripts/` `verify.sh` the "done" gate, `check-traceability.mts` docs <-> tests by ID and tags, `scenario-report.mts` results per scenario.
- `docs/decisions/` why. `HOMEWORK.md` and `api-tests/spec/` are inputs, never edited.

## Commands

```
npm ci
npm run verify                      # done = exit 0
npm run test:api                    # TEST_ENV=local by default, stub started by Playwright
npm run test:e2e                    # TEST_ENV=demo by default
npm run test:<part>:<env>           # api: local, staging; e2e: demo, local. Inside a part: test:<env>:run, test:<env>:ui
npm run lint:fix                    # eslint --fix + prettier
npm run traceability                # docs <-> tests by scenario ID, tags by folder, layer, priority and tier (E2E)
```

Run Claude Code from this folder: hooks and settings load from it. Reports go under `reports/<part>/` (html, json, junit, artifacts), ignored by git; `npm run report:scenarios` exits 1 when a P1 scenario did not pass.

## Rules, each with its check

| Rule | Checked by | Error text |
|---|---|---|
| E2E specs drive page objects through fixtures: never `page`, a locator, a selector or `shared/` | eslint; hook `guard-boundaries` | `Specs drive page objects from fixtures` |
| API specs call endpoint classes with a company fixture, `new GetJobOffer(company).get<ErrorResponse>(id, 404)`: never `request`, `.json()`, `.status()`, nor `shared/` | eslint; hook `guard-boundaries` | `Specs call endpoint methods`, `Specs reach shared/ through endpoint classes and fixtures` |
| Expected states come from `src/oracle.ts`; `src/` and `tests/` never import `stub/`, `stub/` imports neither `src/` nor `shared/`, `shared/` imports no part; inside the stub `domain/` imports neither `http/` nor `store/` | eslint; hook `guard-boundaries` | `the oracle stays independent`, `shared/ imports no part`, `stub/domain/ imports neither http/ nor store/` |
| A `test()` title starts with its scenario ID `XXX-000`, a row of `docs/test-scenarios.md`, both directions | eslint; `npm run traceability` | `A test title starts with its scenario ID`, `XXX-000 is documented but has no test` |
| A `test()` carries, in its own options, its folder tag, exactly one layer tag (`@happy-path`, `@validation-error`, `@error-case`) and exactly one priority tag (`@p1`, `@p2`, `@p3`) equal to the Priority cell of its docs row; an E2E `test()` also exactly one tier tag: `@smoke`, `@sanity`, `@regression`, `@release-check` | `npm run traceability` | `carries @offers; expected @offers, one of ... and one of @p1, @p2, @p3`, `carries @p2; docs say P1` |
| A sandbox per test: a fresh `companyId` (API), run-id data and own-title assertions (E2E) | agent `harness-reviewer` | |
| Random data from `src/test-data/factories.ts` (faker), never `node:crypto` | eslint; hook `guard-boundaries` | `Random data comes from src/test-data/factories.ts` |
| Created data is known to teardown: the `offers` factory (API), `track(title)` (E2E) | agent `harness-reviewer` | |
| Only AUTH-001 logs in through the UI; every other E2E spec starts from `authenticatedPage` | agent `harness-reviewer` | |
| No magic number in a page object | eslint `no-magic-numbers` | `No magic number` |
| Budgets: 120 lines (`src`), 60 (specs), 150 (`stub`), 40 per function, complexity 8; no disable directive | eslint | split the file, never raise the budget |
| One-line JSDoc on exports only; no inline comment, no TODO | eslint `jsdoc/*` | the why goes to `docs/decisions/` or the commit |
| ASCII only; prettier formatting | hooks `guard-ascii`, `lint-touched` | `guard-ascii:` |
| No second copy of a helper, builder or setup | agent `harness-reviewer` | |

## Done means

`npm run verify` exits 0, then one conventional commit per slice (`feat(api): ...`, `docs: ...`). A commit Claude authored ends with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Never

- Edit `oracle.ts`, the stub or a docs row to make a test pass. Fix the test, or fix the rule and say which in the commit.
- Silence a lint rule or raise a budget. Split the file.
- Put data in a shared tenant, or read global lists of the live demo.
- Add a file that does not demonstrate a practice listed in `README.md`.

## Writing and `.claude/`

English, ASCII, tables over prose; a doc page starts with what the reader gets. Hooks: `guard-ascii` and `guard-boundaries` block a write that breaks a rule, `lint-touched` runs prettier and `eslint --fix` after it. Skills: `/add-api-scenario`, `/add-e2e-flow`, `/verify`. Agent `harness-reviewer` reviews the diff read-only: run it before done, fix Critical and Major.
