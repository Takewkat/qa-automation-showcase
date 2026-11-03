# qa-automation-showcase

Two independent test suites built for a QA automation take-home (`HOMEWORK.md`), written so that a team, or an agent, can extend them without asking:

- `api-tests/` Part 1: a risk-based API suite for a job-offer microservice that exists only as an OpenAPI document. Playwright `request` + TypeScript, every response validated against the spec, a small reference stub so the suite runs green on a clean clone.
- `e2e-tests/` Part 2: three user flows on the Conduit RealWorld demo. Playwright, page objects, API-seeded data.

Status: the harness is in place; Part 1 and Part 2 land next.

## Run

```
npm ci
npm run verify        # lint, format, types, both suites, docs-to-tests traceability
npm run test:api      # Part 1 (the stub starts itself)
npm run test:e2e      # Part 2 (live demo by default)
```

Node 22.22 or newer (24 recommended). Playwright browsers once: `npx playwright install chromium`.

## Practices shown

| # | Practice | Where |
|---|---|---|
| 1 | Risk-based scoping: 22 API scenarios, every P1 risk, a written list of what was left out and why | `api-tests/docs/test-scenarios.md` |
| 2 | The OpenAPI document is the contract: every response validated against it on every read, types generated from it | `api-tests/src/contract.ts` |
| 3 | An oracle independent of the system under test, enforced by lint | `api-tests/src/expected-paths.ts`, `docs/decisions/0003` |
| 4 | A tenant per test: parallel-safe, no shared fixtures, exact assertions | `api-tests/src/fixtures.ts`, `docs/decisions/0002` |
| 5 | Table-driven matrices for configuration combinations and invalid transitions | `api-tests/tests/workflow/` |
| 6 | State-aware teardown: withdraw then delete, close what cannot be deleted and say so | `api-tests/src/fixtures.ts` |
| 7 | One suite, several targets: in-process stub or `BASE_URL` | `api-tests/playwright.config.ts`, `docs/decisions/0001` |
| 8 | The 4-file chain selectors -> pages -> fixtures -> specs, import direction enforced | `e2e-tests/src/`, `eslint.config.mjs` |
| 9 | Shared-environment discipline: API-seeded preconditions, session injected without the UI, assertions scoped to own data | `e2e-tests/src/fixtures/`, `docs/decisions/0004` |
| 10 | Docs tied to tests by scenario ID, both directions, in one command | `scripts/check-traceability.ts` |
| 11 | Agent-ready: one source of rules, machine-enforced, scaffolding as executable recipes | `AGENTS.md`, `.claude/` |
| 12 | Honest reporting: time spent, assumptions, limits, how AI was used | below |

Patterns and the dependency direction: `docs/architecture.md`. Decisions and trade-offs: `docs/decisions/`.

## For agents

Read `AGENTS.md`. Every rule in it is enforced by a tool whose error text names the rule, and `npm run verify` is what "done" means.

## How this was built

Planned and written with Claude Code, every file reviewed by hand. The harness came first because the suites will be maintained by agents as much as by people. Time spent and assumptions are stated in each part's `docs/`.
