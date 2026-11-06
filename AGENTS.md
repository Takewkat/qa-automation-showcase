# qa-automation-showcase: rules for agents

Read this first, then `api-tests/AGENTS.md` or `e2e-tests/AGENTS.md`. Every rule has a tool, and its error text names the rule.

## Map

- `api-tests/` Part 1: Job Offer Microservice API tests, Playwright `request` + TypeScript. Target: the reference stub, or any deployment through `TEST_ENV` or `API_BASE_URL`.
- `e2e-tests/` Part 2: Conduit RealWorld E2E flows with Playwright, live demo by default.
- `config/` the environments table and the reporter set, shared by both parts.
- `scripts/` `verify.sh` the "done" gate, `check-traceability.mts` ties scenario tables to tests by ID, `scenario-report.mts` ties results to them.
- `docs/architecture.md` the patterns and the dependency direction. `docs/decisions/` why they were chosen.
- `HOMEWORK.md` and `api-tests/spec/` are inputs as received, never edited. Transcribed to ASCII (arrows, dashes, one accented example), schemas untouched.

## Commands

```
npm ci                              # once, from the root (npm workspaces)
npm run verify                      # done = exit 0
npm run test:api                    # Part 1, TEST_ENV=local by default (stub started by Playwright)
npm run test:e2e                    # Part 2, TEST_ENV=demo by default
TEST_ENV=staging npm run test:api   # any row of config/environments.ts
npm run lint:fix                    # eslint --fix + prettier
npm run traceability                # docs <-> tests by scenario ID; tags by folder and layer
```

Run Claude Code from this folder: hooks and settings load from the primary working directory.

## Environments and reports

- Targets: `config/environments.ts`, `TEST_ENV` picks the row, ADR `docs/decisions/0006`. `API_BASE_URL` / `WEB_BASE_URL` override one target. A root `.env` is read automatically.
- Reports: `config/reporting.ts` writes `html/`, `results.json`, `junit.xml` and `artifacts/` under `reports/<part>/`, ignored by git, ADR `docs/decisions/0007`. `npm run report:scenarios` writes `reports/scenarios.md` and exits 1 when a P1 scenario did not pass.

## Rules, each with its check

| Rule | Checked by | What you see |
|---|---|---|
| E2E specs call page objects through fixtures, never `page`, a locator or a selector | eslint `no-restricted-syntax`, `no-restricted-imports`; hook `guard-boundaries` | `Specs drive page objects from fixtures, never page directly`, `Specs call page-object methods from fixtures, never a locator`, `Specs import fixtures and test-data only`, `guard-boundaries:` |
| API specs call endpoint classes with a company fixture, `new GetJobOffer(company).get<ErrorResponse>(id, 404)`; the class checks status and schema. Never `request`, `.json()`, `.status()`, `.request()`, `.getResponseBody()` | eslint `no-restricted-syntax`; hook `guard-boundaries` | `Specs never touch request; endpoint classes send it`, `Specs call endpoint methods, never the request primitives`, `guard-boundaries:` |
| Expected states come from `src/oracle.ts`, written from the spec. `src/` and `tests/` never import `stub/`, `stub/` never imports `src/` | eslint `no-restricted-imports`; hook `guard-boundaries`; agent `harness-reviewer` | `the oracle stays independent` |
| Every `test()` title starts with its scenario ID `XXX-000`, a row of `docs/test-scenarios.md`, both directions | eslint `no-restricted-syntax`; `npm run traceability` | `A test title starts with its scenario ID, for example "WFL-001 ..."`, `api-tests: XXX-000 is documented but has no test`, `e2e-tests: test XXX-000 is not in docs/test-scenarios.md` |
| Every `test()` call carries, in its own options, its folder tag and exactly one layer tag: `@happy-path`, `@validation-error`, `@error-case` | `npm run traceability` | `"OFR-001 ..." in create.spec.ts carries @offers; expected @offers and one of @happy-path, @validation-error, @error-case` |
| A sandbox per test: a fresh `companyId` UUID (API), run-id data and own-title assertions (E2E) | agent `harness-reviewer` | the shared id or the global list |
| Random data comes from `src/test-data/factories.ts` (faker); specs and `src/` never import `node:crypto` | eslint `no-restricted-imports`; hook `guard-boundaries` | `Random data comes from src/test-data/factories.ts` |
| Created data is known to teardown: the `offers` factory (API), `track(title)` after a UI create (E2E) | agent `harness-reviewer` | the untracked create |
| Only AUTH-001 logs in through the UI; every other E2E spec starts from `authenticatedPage` | agent `harness-reviewer` | the extra UI login |
| No hardcoded timeout or number in a page object | eslint `no-magic-numbers` | `No magic number:` and the value |
| File budgets 120 lines (`src`), 60 (specs), 150 (`stub`); 40 per function; complexity 8; no disable directives | eslint `max-lines`, `max-lines-per-function`, `complexity`, `linterOptions.noInlineConfig` | split the file, never raise the budget |
| One-line JSDoc on exports only; no inline comments; no TODO | eslint `jsdoc/*`, `no-inline-comments`, `no-warning-comments` | the why goes to `docs/decisions/` or the commit |
| ASCII only in everything the repo authors | hook `guard-ascii` | `guard-ascii:` with the line and the characters; use `-` and `->` |
| Prettier formatting | `npm run format`; hook `lint-touched` after each write | the diff to apply |
| No second copy of a helper, builder or setup | agent `harness-reviewer` | both locations |
| A fallback is a documented default (`TEST_ENV`, an override) or an empty collection, never a stand-in for a value the spec or the API should have returned | agent `harness-reviewer` | the masked read |
| A condition reads as a named boolean; a matrix row is an object with named fields, never a tuple read by index | agent `harness-reviewer` | the unnamed condition or the index |
| A status, action or error code carries its contract type (`JobOfferStatus`, `TransitionAction`) or comes from `ERROR_CODES`; never a bare `string` | agent `harness-reviewer` | the bare string |

## Done means

`npm run verify` exits 0, then one conventional commit per slice (`feat(api): ...`, `feat(e2e): ...`, `docs: ...`). A commit Claude authored ends with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Never

- Edit `oracle.ts`, the stub or a docs row to make a test pass. Fix the test, or fix the rule and say which in the commit.
- Silence a lint rule or raise a budget. Split the file.
- Put data in a shared tenant, or read global lists of the live demo.
- Add a file that does not demonstrate a practice listed in `README.md`.

## Writing and `.claude/`

- Writing: English, ASCII only, tables over prose. One-line JSDoc on exports, nothing inline. A doc page starts with what the reader gets.
- Hooks in `settings.json`: `guard-ascii` and `guard-boundaries` block a write that breaks a rule, `lint-touched` runs prettier and `eslint --fix` after it. Permissions allow npm, npx and git read commands; anything else asks.
- Skills `/add-api-scenario <GROUP> <ID> "<scenario>"`, `/add-e2e-flow <domain> "<flow>"`, `/verify` run the part checklists and the gate. Agent `harness-reviewer` reviews the diff read-only; run it before done and fix Critical and Major findings.
