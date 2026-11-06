# api-tests: Job Offer API suite

24 scenarios on a microservice that exists only as its OpenAPI document (`spec/job-offer-swagger.yml`): tenant isolation, the state machine and its three flags, validation, listing, history. Playwright `request` + TypeScript; every response checked against the spec; a reference stub keeps the suite green on a clean clone. Rules for people and agents: `AGENTS.md`.

## Run

| Command | Runs |
|---|---|
| `npm run test:api` (from the root) or `npm test` (here) | the suite on `TEST_ENV=local`: Playwright starts the stub, the suite runs against it |
| `npm run test:local:ui` | the same in UI mode; `npm run test:local:run` without it |
| `npm run test:staging:run`, `npm run test:staging:ui` | the `staging` row of `config/environments.ts`, nothing started |
| `API_BASE_URL=https://host/api/v1 npm test` | an ad-hoc deployment; production is refused |
| `npm run stub` | the stub alone on port 8080, to read its answers by hand |
| `npm run test:p1`, `npx playwright test --grep @workflow`, `--grep @error-case` | the critical set; one feature; one layer |
| `npm run gen:types` | regenerates `src/generated/schema.d.ts` from the spec (committed, idempotent) |
| `npm run report` | the HTML report under `reports/api/` |

Every run opens with `[env] api-tests on <env>: <url>`; every call logs as `[api] POST /job-offers -> 201`.

## Structure

| Layer | Path | Holds |
|---|---|---|
| contract | `spec/`, `src/generated/` | the OpenAPI document as received, and its types |
| endpoint base | `shared/api/api.ts`, `contract.ts` | `request`, `checkStatusCode`, `checkSchema`, `getResponseBody`; `send` runs the four; the contract check by path, method and status |
| service | `src/api/job-offer-api.ts` | the Job Offer service over the base: its contract, the `X-Company-Id` header |
| endpoints | `src/api/<resource>/<action>.ts` | one class per endpoint, one typed method; `get<ErrorResponse>(id, 404)` asserts that status and types the body |
| oracle | `src/oracle.ts` | the expected states, written from the spec, never from the stub: the 8 happy paths, the invalid pairs, the editable, deletable and withdrawable statuses |
| test data | `src/test-data/` | faker generators and request builders with overrides |
| fixtures | `src/fixtures/` | `company`, `otherCompany`, `anonymous`, `malformedHeader`; `offers` factory with `create` and `createIn(status)`; `configure(flags)` |
| cleanup | `src/cleanup/` | withdraw, delete, close what is live; what is kept goes to the report |
| specs | `tests/<feature>/*.spec.ts` | one folder per feature, titles `XXX-000 ...`, tags feature, layer, priority |
| stub | `stub/` | `http/` the adapter, `domain/` the rules, `store/` the memory; a means to run the suite, not a deliverable |
| docs | `docs/test-scenarios.md` | the grid operation x layer, the scenario tables, rationale, assumptions |

## The stub

`stub/` implements the spec's rules on `node:http` and zod: the state machine from the snapshotted flags, the completeness gate, the tenancy rules, the documented error bodies. The suite never imports it (eslint and a pre-write hook refuse), the oracle is written from the spec, and a wrong rule in the stub turns a test red: `npm run verify` has been run with a rule broken on purpose (delete allowed in PUBLISHED) and OFR-003 failed. Outside CI a stub already running on 8080 is reused.

## Adding a scenario

The checklist and the error of each skipped step: `AGENTS.md`, "Add a scenario". `/add-api-scenario` runs it. A new state of the machine is one row in the oracle and one branch in the stub; the matrices pick it up: ADR 0002.
