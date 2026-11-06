# qa-automation-showcase

Two test suites for a QA automation take-home (`HOMEWORK.md`), written so that a team or an agent extends them without asking.

- `api-tests/` Part 1: API suite for a job-offer microservice that exists only as an OpenAPI document. Playwright `request` + TypeScript, every response validated against the spec, a reference stub keeps the suite green on a clean clone.
- `e2e-tests/` Part 2: six user flows in three domains on the Conduit RealWorld demo. Playwright, page objects behind fixtures, API-seeded data, one cached user per run.

Status: the harness, Part 1 and Part 2 are in.

## Run

```
npm ci
npm run verify                      # lint, format, types, both suites, traceability, P1 gate
npm run test:api                    # Part 1, TEST_ENV=local: the stub starts itself
npm run test:e2e                    # Part 2, TEST_ENV=demo
TEST_ENV=staging npm run test:api   # any row of config/environments.ts; production is refused
npx playwright test -c api-tests --grep @error-case   # one layer, a feature (@workflow) or @smoke
npm run report:scenarios            # reports/scenarios.md: result per scenario ID, P1 gate
```

Node 24 or newer (runs the scripts and the stub as TypeScript, no build tool); `npx playwright install chromium` once; `.env.example` pins `TEST_ENV`, overrides one URL or adds browsers. Runtime dependencies: Playwright, ajv with ajv-formats and yaml at the root (`shared/` uses them), faker in both parts, zod in the stub.

## Practices shown

| # | Practice | Where |
|---|---|---|
| 1 | Test design on two axes, feature by layer; a grid of every documented status per operation | `api-tests/docs/test-scenarios.md`, ADR 0006 |
| 2 | OpenAPI as the contract: every response validated, types generated | `shared/api/contract.ts`, ADR 0005 |
| 3 | One class per endpoint over a generic base, the base shared by both parts | `shared/api/api.ts`, `api-tests/src/api/`, ADR 0004 |
| 4 | An oracle independent of the system under test, lint-enforced | `api-tests/src/oracle.ts`, ADR 0002 |
| 5 | A tenant per test: parallel-safe, exact assertions, state-aware teardown | `api-tests/src/fixtures/`, `src/cleanup/`, `shared/cleanup/`, ADR 0001 |
| 6 | Table-driven matrices: flag combinations, invalid transitions, every operation without a header | `api-tests/tests/` |
| 7 | Named environments with production refused; one reporter set, reports keyed by scenario ID with a P1 gate | `config/`, `scripts/scenario-report.mts` |
| 8 | Selectors -> pages -> fixtures -> specs, import direction enforced; shared-demo discipline | `e2e-tests/src/`, ADR 0003 |
| 9 | Docs tied to tests by scenario ID and by tag (folder, layer, tier), both directions | `scripts/check-traceability.mts` |
| 10 | Agent-ready: one rule source, machine-enforced, executable recipes | `AGENTS.md`, `.claude/` |

Not used, on purpose: a Gherkin layer (no non-technical reader; IDs and page-object methods keep specs readable), a shared World or global cleanup list (fixtures own their data), sleeps (assertions retry), assertions on global lists of the shared demo, a mock replaying examples (Prism: transitions and tenancy would be untestable).

## How this was built

Planned and written with Claude Code, every file reviewed by hand. The harness came first because agents will maintain the suites as much as people. Time spent and assumptions are stated in each part's `docs/`.
