# Architecture

One dependency direction in both parts, enforced by eslint and a pre-write hook:

```
spec  ->  fixtures  ->  page objects / API facade  ->  selectors / contract
```

A spec reads as the scenario. Everything it needs arrives through fixtures. A selector or a path changes in one file.

## Patterns, named

| Pattern | Where | Why here |
|---|---|---|
| Layered test architecture, one import direction | both parts, `eslint.config.mjs` | a change has one home; a selector edit never touches a spec |
| Page Object plus component objects (navbar, comment list) | `e2e-tests/src/pages/` | pages stay one screen each; a component is reused by several pages |
| Fixtures as dependency injection (`test.extend`), no shared world or global state | `e2e-tests/src/fixtures/test.ts`, `api-tests/src/fixtures.ts` | a test declares what it needs; parallel-safe; teardown lives next to setup |
| Facade over the HTTP client with an operations table from the spec | `api-tests/src/client.ts`, `e2e-tests/src/api/` | one place for headers, paths and expected statuses; specs never see `request` |
| Builder / factory for test data with overrides and a run id | `api-tests/src/payloads.ts`, `e2e-tests/src/test-data/factories.ts` | no copied payloads; unique data on a shared environment |
| Test oracle separated from the system under test | `api-tests/src/expected-paths.ts` vs `api-tests/stub/state-machine.ts` | the suite proves the stub, not itself; a new state is one table row |
| Table-driven tests for combinations and invalid pairs | `api-tests/tests/workflow/` | 8 configurations and the invalid transitions in two readable tables |
| Hermetic tests: a sandbox per test (tenant UUID, run-id data), state-aware teardown | fixtures of both parts | no order dependence, exact assertions |
| Spec-driven contract validation on every read | `api-tests/src/contract.ts` | the response schema is looked up by path, method and status in the OpenAPI document and validated with ajv |
| Named environments: one table of targets, `TEST_ENV` picks the row, production refused | `config/environments.ts`, both `playwright.config.ts` | same suite on local, demo, staging; the stub starts only for local; adding an environment is one row |
| Ports and adapters in the stub: pure domain, in-memory store, HTTP adapter | `api-tests/stub/` | the state machine is a pure function, the HTTP layer is thin |
| Template Method in `BasePage` | `e2e-tests/src/pages/base.page.ts` | one navigation and one error context for every page |

## Avoided on purpose

- A Gherkin step layer: indirection without a non-technical reader here; titles with scenario IDs and page-object methods keep specs readable.
- A shared mutable World and global cleanup lists: fixtures own their data and its teardown.
- Sleeps and fixed waits: Playwright assertions retry; the only timeouts are in the config.
- Assertions on global lists of a shared environment: every check is scoped to data the test created.
- A mock that replays examples (Prism): a stub that enforces the rules is what makes the suite meaningful before a real service exists.

Decisions and their trade-offs: `docs/decisions/`.
