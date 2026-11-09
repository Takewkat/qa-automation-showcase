# qa-automation-showcase

Two test suites for a QA automation take-home (`HOMEWORK.md`), written so that a team or an agent extends them without asking.

- `api-tests/` Part 1: API suite for a job-offer microservice that exists only as an OpenAPI document. Playwright `request` + TypeScript, every response validated against the spec, a reference stub keeps the suite green on a clean clone. Scenarios, rationale and assumptions: `api-tests/docs/test-scenarios.md`; how to run: `api-tests/README.md`.
- `e2e-tests/` Part 2: six user flows in three domains on the Conduit RealWorld demo. Playwright, page objects behind fixtures, API-seeded data, one cached user per run. Scenarios, rationale and assumptions: `e2e-tests/docs/test-scenarios.md`; how to run: `e2e-tests/README.md`.

Status: the harness, Part 1 and Part 2 are in; both suites green on their default target.

## Run

```
npm ci
npm run verify                      # lint, format, types, both suites, traceability, P1 gate
npm run test:api                    # Part 1, TEST_ENV=local: the stub starts itself
npm run test:e2e                    # Part 2, TEST_ENV=demo: once per 15 minutes, see below
npm run test:<part>:<env>           # api: local, staging; e2e: demo, local. Inside a part: test:<env>:run, test:<env>:ui
npm run conduit:local               # a local Conduit for Part 2: docker compose up --build, then npm run test:e2e:local
npx playwright test -c api-tests --grep @error-case   # a layer, a feature (@workflow) or a priority (@p1); -c e2e-tests also a tier (@smoke)
npm run report:scenarios            # reports/scenarios.md: result per scenario ID, P1 gate
npm run triage                      # reports/triage.md: each failure infra, contract, flaky, or left to /triage
```

Every run opens with `[env] <part> on <env>: <url>`, and the HTML report carries the target in its metadata. `TEST_ENV` picks a row of `config/environments.ts`, `API_BASE_URL` or `WEB_BASE_URL` overrides one target, production is refused.

Part 2 runs on the shared public demo, which limits every IP to 5 sign-up or login calls per hour and about 100 requests per 15 minutes. One run spends about 55 requests and 2 auth calls (3 on a cold cache: the setup registers the run's user), so a second run within 15 minutes, `npm run verify` included, fails with 429 at setup or in the middle of a test; the report then says so (`rate-limited` annotation, `server requests` attachment). Wait for the window, or run Part 2 on a local Conduit: five steps in `e2e-tests/README.md`.

Node 24 or newer (runs the scripts and the stub as TypeScript, no build tool); `npx playwright install chromium` once; `.env.example` pins `TEST_ENV`, overrides one URL or adds browsers. Runtime dependencies: Playwright, ajv with ajv-formats and yaml at the root (`shared/` uses them), faker in both parts, zod in the stub.

## Practices shown

| # | Practice | Where |
|---|---|---|
| 1 | Test design on three axes as tags: feature, layer, priority; a grid of every documented status per operation; each priority level defined by what a failure costs | `api-tests/docs/test-scenarios.md`, ADR 0006 |
| 2 | OpenAPI as the contract: every response validated, types generated | `shared/api/contract.ts`, ADR 0005 |
| 3 | One class per endpoint over a generic base, the base shared by both parts | `shared/api/api.ts`, `api-tests/src/api/`, ADR 0004 |
| 4 | An oracle independent of the system under test, lint-enforced | `api-tests/src/oracle.ts`, ADR 0002 |
| 5 | A tenant per test: parallel-safe, exact assertions, state-aware teardown | `api-tests/src/fixtures/`, `src/cleanup/`, `shared/cleanup/`, ADR 0001 |
| 6 | Table-driven matrices: flag combinations, invalid transitions, every operation without a header | `api-tests/tests/` |
| 7 | Named environments with production refused; one reporter set, reports keyed by scenario ID with a P1 gate | `config/`, `scripts/scenario-report.mts` |
| 8 | Selectors -> pages -> fixtures -> specs, import direction enforced; shared-demo discipline: one cached session, API seeding, a request budget per test | `e2e-tests/src/`, ADR 0003 |
| 9 | Docs tied to tests by scenario ID and by tag (folder, layer, priority, tier), both directions | `scripts/check-traceability.mts` |
| 10 | Agent-ready: one rule source, machine-enforced, executable recipes; the key moments of a test on the console | `AGENTS.md`, `.claude/`, `shared/log.ts` |
| 11 | Failure triage: a script sorts what the report proves (infra, contract, flaky), an agent reads only the rest and fixes only a test bug; authoring loops end on a verdict line, at most 3 rounds | `scripts/triage.mts`, `.claude/skills/`, ADR 0007 |

Not used, on purpose: a Gherkin layer (no non-technical reader; IDs and page-object methods keep specs readable), a shared World or global cleanup list (fixtures own their data), sleeps (assertions retry), assertions on global lists of the shared demo, a mock replaying examples (Prism: transitions and tenancy would be untestable).

## How this was built

Planned and written with Claude Code, every file read before it was kept. The author's own time, design, decisions and review, came to a couple of hours spread over 3 to 6 November; the agents typed the rest, under a harness that stops them before a rule is broken. The harness came first because agents will maintain the suites as much as people. The brief's 4 to 6 hours of effort went into the reference stub and that harness rather than into more scenarios. Assumptions are stated in each part's `docs/`; decisions in `docs/decisions/`.

## Next steps

- The six designed-only E2E rows of `e2e-tests/docs/test-scenarios.md` (AUTH-002, ART-004, SOC-001, CMT-003, NAV-001, NAV-002), and the "Left out" list of Part 1.
- A CI gate on `scripts/verify.sh`: the API part on every push, the E2E part on a manual trigger, since the demo's budget forbids it per push.
- A k6 smoke on the reference stub, with thresholds, before the API suite gets a performance tier.
- Firefox and WebKit runs (`BROWSERS=chromium,firefox,webkit`), declared and not yet exercised.
