# Part 1: Job Offer Microservice, test scenarios

What this page gives: the 24 scenarios the suite runs (each ID is a `test()` title under `tests/`, tied both ways by `npm run traceability`), the design they follow with the grid that places every documented status of every operation, why these, what was left out, and the assumptions made about a system that exists only as `spec/job-offer-swagger.yml`.

`(M)` marks a matrix: one `test()` per row of a table inside the spec file. Priority: P1 critical, P2 important. Smoke tag `@smoke` on OFR-001, OFR-003 (DRAFT row), WFL-001 (all flags false), TEN-002, TEN-004, CFG-002.

## Design: feature by layer

Two axes, carried as tags on every `test()` call itself (not on a `describe`) and checked by `npm run traceability` (ADR `docs/decisions/0011`):

| Axis | Tags | Meaning |
|---|---|---|
| Feature | `@tenancy`, `@offers`, `@workflow`, `@configuration`, `@listing`, `@history` | the folder of the spec file, one business area each |
| Layer | `@happy-path` | the behaviour works as the spec says: the acceptance of a feature, a boundary value accepted |
| | `@validation-error` | the request is refused for its shape: payload, query or header (400, 422 `VALIDATION_ERROR`), and the completeness gate (422 `INCOMPLETE_OFFER`) |
| | `@error-case` | the caller or the target is wrong: 401, 403, 404, and the state rules 409 `INVALID_STATE` and 400 `INVALID_TRANSITION` |

A test carries one layer; a scenario that proves two things is two tests under the same ID. `npx playwright test --grep @error-case` runs a layer, `--grep @workflow` a feature, `--grep @smoke` the acceptance subset.

The grid: one row per operation of the spec, the statuses it documents, the scenarios per layer. A documented status is in a cell or in "Left out" below with its reason.

| Operation | Documented | `@happy-path` | `@validation-error` | `@error-case` |
|---|---|---|---|---|
| GET `/job-offers` | 200 400 401 | TEN-004, LST-001 | LST-002 (400 query), TEN-001 (400 header) | TEN-001 (401) |
| POST `/job-offers` | 201 400 401 422 | OFR-001, VAL-003 | VAL-001 (422); 400 left out | TEN-001 (401) |
| GET `/job-offers/{id}` | 200 401 404 | OFR-001 | | TEN-001 (401), TEN-002 (404) |
| PUT `/job-offers/{id}` | 200 400 401 404 409 422 | OFR-002 | VAL-002 (422); 400 left out | TEN-001 (401), TEN-003 (404), OFR-002 (409) |
| DELETE `/job-offers/{id}` | 204 401 404 409 | OFR-003 | | TEN-001 (401), TEN-003 (404), OFR-003 (409) |
| GET `/job-offers/{id}/transitions` | 200 401 404 | WFL-001, WFL-005 | | TEN-001 (401), TEN-003 (404) |
| POST `/job-offers/{id}/transitions/{action}` | 200 400 401 404 422 | WFL-001, WFL-004, WFL-005, WFL-006, WFL-007, CFG-002 | WFL-003, WFL-004 (422 gate), WFL-005 (422 reason) | TEN-001 (401), TEN-003 (404), WFL-002 (400) |
| GET `/job-offers/{id}/history` | 200 401 404 | HIS-001 | | TEN-001 (401), TEN-003 (404) |
| GET `/companies/{id}/configuration` | 200 401 403 404 | CFG-001 | | TEN-001 (401), TEN-005 (403); 404 left out |
| PUT `/companies/{id}/configuration` | 200 400 401 403 404 | CFG-001, CFG-002 | CFG-003 (400) | TEN-001 (401), TEN-005 (403); 404 left out |

## Tenant isolation (`tests/tenancy/`)

The header is the only wall between companies. A leak is an incident, so every mutation and every read is tried from the wrong side.

| ID | Scenario | Preconditions | Request | Expected Status | Expected Result | Priority |
|---|---|---|---|---|---|---|
| TEN-001 | (M) Header contract: missing on every operation, not a UUID on list | none | each of the 10 operations without `X-Company-Id`; GET `/job-offers` with `X-Company-Id: not-a-uuid` | 401 x10; 400 | `Error` body; refused before any lookup | P1 |
| TEN-002 | (M) Not yours and not there look the same | offer of A in DRAFT | GET `/job-offers/{idA}` as B; GET `/job-offers/{random UUID}` as A | 404 each | `Error` body, never 403; no offer field in the body | P1 |
| TEN-003 | (M) Mutate or read another company's offer | offer of A in DRAFT | as B: PUT, DELETE, GET `/transitions`, POST `/transitions/submit`, GET `/history` on `{idA}` | 404 each | A still reads it: DRAFT, same title | P1 |
| TEN-004 | Lists are scoped | 2 offers of A, 1 of B | GET `/job-offers` as A, as B; as A with `status=DRAFT` | 200 | own ids only, `totalElements` 2 then 1; the filter does not leak | P1 |
| TEN-005 | (M) Configuration of another company | none | as B: GET and PUT `/companies/{A}/configuration` | 403 each | A's configuration unchanged, all flags false | P2 |

## Offer lifecycle guards (`tests/offers/`)

The mutations that can reach a live listing, and the body rules of the two writes.

| ID | Scenario | Preconditions | Request | Expected Status | Expected Result | Priority |
|---|---|---|---|---|---|---|
| OFR-001 | Create a complete offer and read it back | none | POST `/job-offers` with title, CUSTOM location, one salary entry; then GET | 201; 200 | `Location` header present and a URI (contract check); DRAFT, `isComplete` true, `companyId` = header, `availableTransitions` `[submit]`, `publishedAt` and `closedAt` null; GET body equals the created one | P1 |
| OFR-002 | (M) Update is allowed in editable states only | one offer per status: DRAFT, TO_FINALIZE, TO_APPROVE, TO_POST, PUBLISHED, CLOSED | PUT `/job-offers/{id}` with a new title | 200 for DRAFT, TO_FINALIZE; 409 for the others | 409 body `code` INVALID_STATE, `details.allowedStatuses` = `[DRAFT, TO_FINALIZE]`; title unchanged | P1 |
| OFR-003 | (M) Delete is allowed in DRAFT only | one offer per status: DRAFT, TO_FINALIZE, PUBLISHED, CLOSED | DELETE `/job-offers/{id}` | 204 for DRAFT; 409 for the others | after 204 GET is 404; 409 body `details.allowedStatuses` = `[DRAFT]` and GET still 200 | P1 |
| VAL-001 | (M) Create body rules | none | POST `/job-offers` with: `{}`; blank title; `title: null`; 201-char title; CUSTOM without city; `countryCode` `fr`; salary `amount` -1; `currency` `eur` | 422 x8 | `ValidationError` body, `fieldErrors[].field` ends with the offending leaf | P2 |
| VAL-002 | (M) Update body rules | offer in DRAFT | PUT `/job-offers/{id}` with: blank title; `title: null`; 201-char title; salary `amount` -1 | 422 x4 | `ValidationError` body naming the field; title unchanged | P2 |
| VAL-003 | (M) Boundaries accepted | none | POST `/job-offers` with a 200-char title; with salary `amount` 0 | 201 x2 | body as sent; `isComplete` true with a zero salary (the spec says `minimum: 0`) | P2 |

## Workflow state machine (`tests/workflow/`)

The product logic: 8 paths, the guards, and the gate on incomplete offers. Expected statuses come from `src/oracle.ts`, written from the spec, never from the stub.

| ID | Scenario | Preconditions | Request | Expected Status | Expected Result | Priority |
|---|---|---|---|---|---|---|
| WFL-001 | (M) Happy path for each of the 8 flag combinations, then close | configuration set to the row's flags; one complete offer | POST `/transitions/{forward action}` until PUBLISHED, then `close`; GET `/transitions` after each | 200 each | status per the oracle at each step; `availableTransitions` equals the actions of `GET /transitions`; `publishedAt` set on PUBLISHED, `closedAt` on CLOSED | P1 |
| WFL-002 | (M) Invalid transitions are refused without side effect | one offer per pair: (DRAFT, approve), (DRAFT, finalize), (DRAFT, close), (TO_APPROVE, post), (TO_POST, approve), (PUBLISHED, submit), (PUBLISHED, withdraw), (CLOSED, close), (CLOSED, withdraw) | POST `/transitions/{action}` | 400 each | `code` INVALID_TRANSITION, `details.currentStatus`, `requestedAction`, `validActions` per the oracle; status and history unchanged | P1 |
| WFL-003 | Submit of an incomplete offer is refused | `partialSaveEnabled` false; offer without compensation | POST `/transitions/submit` | 422 | `code` INCOMPLETE_OFFER, `details.missingFields` contains `compensation.salaryEntries`; still DRAFT | P1 |
| WFL-004 | Partial save: finalize gate, then publish | `partialSaveEnabled` true; one offer without compensation submitted to TO_FINALIZE per test | finalize; PUT compensation then finalize | 422; 200 then 200 | INCOMPLETE_OFFER, still TO_FINALIZE; `isComplete` true, PUBLISHED | P1 |
| WFL-005 | Reject requires a reason, then returns to DRAFT | `approvalRequired` true; one offer in TO_APPROVE per test | POST `reject` with `{}`; GET `/transitions` then POST `reject` with reason and comment | 422; 200 then 200 | `details.missingFields` `[reason]`, still TO_APPROVE; reject listed with `requiresReason` true, DRAFT with `[submit]` available, last history entry carries reason and comment | P2 |
| WFL-006 | (M) Withdraw returns to DRAFT | one offer per status: TO_FINALIZE, TO_APPROVE, TO_POST | POST `/transitions/withdraw`; PUT title | 200; 200 | DRAFT; editable again | P2 |
| WFL-007 | Close then reopen | offer in PUBLISHED | POST `close`; POST `reopen` | 200; 200 | CLOSED with `closedAt`, `[reopen]` available; PUBLISHED with `[close]` available | P2 |

## Company configuration (`tests/configuration/`)

Flags route the workflow. Changing them must not re-route offers that already exist.

| ID | Scenario | Preconditions | Request | Expected Status | Expected Result | Priority |
|---|---|---|---|---|---|---|
| CFG-001 | Defaults, update, read back | fresh company | GET; PUT all three true; GET | 200 each | all false with `companyId` = header; echoed; equal to the PUT response, `updatedAt` not before the previous one | P2 |
| CFG-002 | Flags are snapshotted at creation | offer A created; then `approvalRequired` true; offer B created | POST `submit` on A and on B | 200; 200 | A PUBLISHED, B TO_APPROVE | P1 |
| CFG-003 | A flag that is not a boolean | fresh company | PUT `{ "approvalRequired": "yes" }` | 400 | `Error` body (A22); GET still all false | P2 |

## Listing (`tests/listing/`)

Read side: wrong counts annoy, they do not leak.

| ID | Scenario | Preconditions | Request | Expected Status | Expected Result | Priority |
|---|---|---|---|---|---|---|
| LST-001 | Default page and pagination | 5 offers | GET `/job-offers`; GET with `size=2` for pages 0 to 3 | 200 each | page 0, size 20, 5 elements newest first; sizes 2, 2, 1, 0, `totalPages` 3, the union of ids is the 5 | P2 |
| LST-002 | (M) Invalid query values | none | GET `/job-offers` with `page=-1`; `size=0`; `size=101`; `size=abc`; `status=BOGUS`; `sort=bogus` | 400 each | `Error` body, not 422, not 500 | P2 |

## Audit history (`tests/history/`)

Every transition leaves a consistent trail.

| ID | Scenario | Preconditions | Request | Expected Status | Expected Result | Priority |
|---|---|---|---|---|---|---|
| HIS-001 | History follows the transitions | all flags true; fresh offer | GET `/history`; then submit, finalize, approve, post, close; GET `/history` | 200 | empty first; then the 5 actions in order, each `toStatus` equal to the next `fromStatus`, `performedAt` non-decreasing | P2 |

## Contract shapes

No dedicated group: the facade validates every response, success or error, against the spec on every call (README practice 2). The error side is exercised by TEN-001, TEN-002, TEN-005, OFR-002, OFR-003, VAL-001, VAL-002, CFG-003, WFL-002, WFL-003 and WFL-005 through that same check.

## Rationale

The grid is the checklist, read before the groups: every status the spec documents for an operation lands in a cell or in the list below with a reason, so a refusal nobody tests shows as an empty cell rather than as a surprise.

Focus, in risk order: tenant isolation (the header is the only boundary between companies), the state machine with its three company flags and the snapshot rule (the only business logic, eight paths, and the classic latent bug "configuration applies to new offers only"), the mutation guards (an edited or deleted live listing, an incomplete offer published). Then the 422 shape a frontend keys on, with boundaries sampled rather than enumerated: the pair that matters is on both sides of the rule (`amount` -1 refused, 0 accepted; 201 characters refused, 200 accepted). The read side (listing, history) is P2: wrong counts annoy, they do not leak or corrupt.

Left out, and why: unknown id on every endpoint (TEN-002 covers the 404 once, repeating it per endpoint shows nothing new); the other list filters and sort fields (read side; date filters are flaky on real deployments); PUT merge semantics (undefined, A9) and PUT with `{}` on an offer or a configuration (A9 and A10 leave the outcome undefined); `COMPANY_ADDRESS` with an address (contract detail, A20); every maxLength and pattern beyond the sampled ones (same mechanism, more rows, no more information); configuration 404 (unreachable with a trusted header); malformed JSON and a non-object body, the 400 of POST and PUT (framework behaviour); an unknown action in the path (the spec documents no status for it); concurrency and double submit (no version field in the spec, a design gap worth raising); `traceId` and `performedBy` values (opaque); authentication and CI (the brief).

## Assumptions

Where the spec is silent or ambiguous, the suite reads it this way. Each one is a sentence a real team would confirm with the service owner.

- A1 An offer is complete when `compensation.salaryEntries` has at least one entry; bonus-only is incomplete (the brief's completeness rule over the `Compensation` description).
- A2 POST always creates a DRAFT and never rejects an incomplete offer (`compensation` is optional, `INCOMPLETE_OFFER` is declared on transitions only). Completeness is checked when leaving DRAFT with `partialSaveEnabled` false, and when leaving TO_FINALIZE.
- A3 A wrong action for the current status is 400 `INVALID_TRANSITION`; an edit or delete in a wrong status is 409 `INVALID_STATE`. Clients branch on them, so they are tested literally.
- A4 `reject` without `reason` is 422 `VALIDATION_ERROR` with `details.missingFields` `[reason]`, the `Error` shape the spec documents for every transition 422. The state is checked first, so `reject` from DRAFT is 400.
- A5 `withdraw` is valid from TO_FINALIZE, TO_APPROVE and TO_POST only; a live offer leaves through `close`.
- A6 The configuration 403 fires when the path `companyId` differs from the header, before any existence check.
- A7 `createdAfter` is inclusive, `createdBefore` exclusive.
- A8 The three flags are snapshotted on the offer at creation ("existing offers retain their original workflow").
- A9 PUT on an offer merges the fields sent (all optional in the request schema).
- A10 PUT on a configuration replaces it; the suite only sends full bodies.
- A11 `submit` lands in TO_FINALIZE whenever `partialSaveEnabled` is true, even for a complete offer.
- A12 `availableTransitions` on the offer lists the same actions as `GET /transitions`.
- A13 GET configuration of a never-configured company returns the defaults, not 404.
- A14 Companies need no provisioning: a random UUID is a valid tenant.
- A15 History is in transition order; creation adds no entry.
- A16 `performedBy` and the error `code` of 401, 404 and 400 are implementation-defined: presence and shape only.
- A17 `fieldErrors[].field` is a dotted path; asserted by its last segment.
- A18 Timestamps are ISO 8601 with offset.
- A19 No optimistic locking: concurrency is out of scope.
- A20 With `COMPANY_ADDRESS`, an `address` sent is dropped from the response.
- A21 A documented response header is expected on every response of that status, `required` or not: the spec documents `Location` on 201 without `required: true`, and a header nobody sends has no reason to be documented.
- A22 Offers are validated with 422 `ValidationError`; the configuration with 400 `Error`: the spec documents no 422 on PUT configuration, so a flag that is not a boolean is a bad request there.
