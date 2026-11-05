# Architecture

Both parts share one dependency direction, enforced by eslint and a pre-write hook. A spec reads as the scenario and gets everything through fixtures. A selector or a path changes in one file.

```
spec  ->  fixtures  ->  page objects / API facade  ->  selectors / contract
```

## Patterns (why: `docs/decisions/`)

| Pattern | Where |
|---|---|
| Page Object, one screen each, plus component objects (navbar, comment list) | `e2e-tests/src/pages/` |
| Fixtures as dependency injection (`test.extend`), no shared world or global state | `e2e-tests/src/fixtures/test.ts`, `api-tests/src/fixtures.ts` |
| Facade over the HTTP client, operations table from the spec | `api-tests/src/client.ts`, `e2e-tests/src/api/` |
| Builder / factory for test data with overrides and a run id | `api-tests/src/payloads.ts`, `e2e-tests/src/test-data/factories.ts` |
| Test oracle separated from the system under test | `api-tests/src/expected-paths.ts` vs `api-tests/stub/state-machine.ts` |
| Table-driven tests for combinations and invalid pairs | `api-tests/tests/workflow/` |
| Hermetic tests: a sandbox per test (tenant UUID, run-id data), state-aware teardown | fixtures of both parts |
| Spec-driven contract validation on every read: schema by path, method and status, ajv | `api-tests/src/contract.ts` |
| Named environments: one table, `TEST_ENV` picks the row, production refused | `config/environments.ts`, both `playwright.config.ts` |
| Ports and adapters in the stub: pure state machine, in-memory store, thin HTTP adapter | `api-tests/stub/` |
| Template Method in `BasePage`: one navigation and one error context per page | `e2e-tests/src/pages/base.page.ts` |

## Avoided on purpose

- A Gherkin step layer: no non-technical reader here, scenario IDs and page-object methods keep specs readable.
- A shared mutable World and global cleanup lists: fixtures own their data and its teardown.
- Sleeps and fixed waits: Playwright assertions retry, the only timeouts are in the config.
- Assertions on global lists of a shared environment: every check is scoped to data the test created.
- A mock that replays examples (Prism): a rule-enforcing stub makes the suite meaningful before a real service exists.
