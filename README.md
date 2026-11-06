# qa-automation-showcase

Two independent test suites for a QA automation take-home (`HOMEWORK.md`), written so that a team or an agent can extend them without asking.

- `api-tests/` Part 1: a risk-based API suite for a job-offer microservice that exists only as an OpenAPI document. Playwright `request` + TypeScript. Every response is validated against the spec. A small reference stub keeps the suite green on a clean clone.
- `e2e-tests/` Part 2: three user flows on the Conduit RealWorld demo. Playwright, page objects, API-seeded data.

Status: the harness and Part 1 are in; Part 2 lands next.

## Run

```
npm ci
npm run verify                      # lint, format, types, both suites, traceability, P1 gate
npm run test:api                    # Part 1 on TEST_ENV=local (the stub starts itself)
npm run test:e2e                    # Part 2 on TEST_ENV=demo
TEST_ENV=staging npm run test:api   # any row of config/environments.ts; production is refused
BROWSERS=chromium,firefox,webkit npm run test:e2e   # more browsers, default chromium
npm run report:scenarios            # reports/scenarios.md: result per scenario ID and priority
npm run report:api                  # html report of the last API run (report:e2e for Part 2)
```

Node 24 or newer: it runs the scripts and the stub as TypeScript, no build tool. Playwright browsers once: `npx playwright install chromium`. Copy `.env.example` to `.env` to pin `TEST_ENV`, override one URL or add browsers.

## Practices shown

| # | Practice | Where |
|---|---|---|
| 1 | Test design on two axes, feature by layer: a grid of every documented status per operation, 24 scenarios, exclusions explained | `api-tests/docs/test-scenarios.md`, `docs/decisions/0011` |
| 2 | OpenAPI as the contract: every response validated, types generated | `api-tests/src/api/common/contract.ts` |
| 3 | An oracle independent of the system under test, lint-enforced | `api-tests/src/oracle.ts`, `docs/decisions/0003` |
| 4 | A tenant per test: parallel-safe, exact assertions | `api-tests/src/fixtures/`, `docs/decisions/0002` |
| 5 | Table-driven matrices: configurations and invalid transitions | `api-tests/tests/workflow/` |
| 6 | State-aware teardown: withdraw then delete, close what is live, report what is kept | `api-tests/src/cleanup/job-offers.cleanup.ts` |
| 7 | Named environments: `TEST_ENV` picks the row, production refused | `config/environments.ts`, `docs/decisions/0006` |
| 8 | Selectors -> pages -> fixtures -> specs, import direction enforced | `e2e-tests/src/`, `eslint.config.mjs` |
| 9 | Shared-demo discipline: API seeding, injected session, own-data assertions | `e2e-tests/src/fixtures/`, `docs/decisions/0004` |
| 10 | Docs tied to tests by scenario ID, both directions; every test tagged with its feature and one layer, checked | `scripts/check-traceability.mts` |
| 11 | Agent-ready: one rule source, machine-enforced, executable recipes | `AGENTS.md`, `.claude/` |
| 12 | Reports keyed by scenario ID: html, junit, json, P1 gate | `config/reporting.ts`, `scripts/scenario-report.mts`, `docs/decisions/0007` |
| 13 | Honest reporting: time, assumptions, limits, AI use | below |

Patterns and the dependency direction: `docs/architecture.md`. Decisions and trade-offs: `docs/decisions/`.

## For agents

Read `AGENTS.md`. Every rule in it is enforced by a tool whose error text names the rule. `npm run verify` is what "done" means.

## How this was built

Planned and written with Claude Code, every file reviewed by hand. The harness came first because agents will maintain the suites as much as people. Time spent and assumptions are stated in each part's `docs/`.
