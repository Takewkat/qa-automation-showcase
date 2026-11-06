# Part 1: Job Offer Microservice, test scenarios

24 scenarios, 13 P1, 8 P2, 3 P3; each ID is a `test()` title under `tests/`, tied both ways by `npm run traceability`. `(M)` marks a matrix: one `test()` per row of a table in the spec file.

## Design: feature by layer

Every `test()` carries three tags (ADR 0006), checked by `npm run traceability`:

- the feature, the folder of the file: `@tenancy`, `@offers`, `@workflow`, `@configuration`, `@listing`, `@history`;
- one layer: `@happy-path` (the behaviour works as the spec says, a boundary accepted), `@validation-error` (a request refused for its shape: 400, 422 `VALIDATION_ERROR`, the completeness gate 422 `INCOMPLETE_OFFER`), `@error-case` (wrong caller or target: 401, 403, 404, and the state rules 409 `INVALID_STATE`, 400 `INVALID_TRANSITION`);
- one priority, `@p1`, `@p2`, `@p3`, equal to the Priority cell of its row: what a failure costs, the table after the grid.

A test that proves two things is two tests under one ID. `npx playwright test -c api-tests --grep @error-case` runs a layer, `--grep @p1` the critical set.

The grid: one row per operation, its documented statuses, the scenarios per layer. A status is in a cell or in "Left out".

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

## Priority: what a failure costs

The brief's three levels, read for this service. The Priority cell of a row is the source, the tag its copy; a P1 that does not pass fails `npm run verify` (`scripts/scenario-report.mts`).

| Level | A failure means | For example |
|---|---|---|
| P1 | the product does not work, a company reaches another company's data, or an offer lands in a state the spec forbids and stays there | TEN-003, an offer edited from another company; WFL-003, an incomplete offer that leaves DRAFT |
| P2 | a wrong answer or a blocked secondary action, nothing corrupted: a 422 shape, a count, a history record, a withdraw or reopen refused | WFL-006, a withdraw refused: the offer stays where it was; LST-001, a page count off by one |
| P3 | automated because cheap: a boundary accepted, a bad query answered 400 not 500, a non-boolean flag refused | VAL-003, a 200-char title accepted |

## Tenant isolation (`tests/tenancy/`)

The header is the only wall between companies, so every mutation and read is tried from the wrong side.

| ID | Scenario | Preconditions | Request | Status | Expected | Priority |
|---|---|---|---|---|---|---|
| TEN-001 | (M) Header contract | none | each of the 10 operations without `X-Company-Id`; GET `/job-offers` with `X-Company-Id: not-a-uuid` | 401 x10; 400 | `Error` body, refused before any lookup | P1 |
| TEN-002 | (M) Not yours and not there look the same | offer of A | GET `/job-offers/{idA}` as B; GET a random UUID as A | 404 each | `Error` body, never 403, no offer field | P1 |
| TEN-003 | (M) Another company's offer | offer of A in DRAFT | as B: PUT, DELETE, GET `/transitions`, POST `/transitions/submit`, GET `/history` | 404 each | A still reads it: DRAFT, same title | P1 |
| TEN-004 | Lists are scoped | 2 offers of A, 1 of B | GET `/job-offers` as A, as B; as A with `status=DRAFT` | 200 | own ids only, `totalElements` 2 then 1 | P1 |
| TEN-005 | (M) Another company's configuration | none | as B: GET and PUT `/companies/{A}/configuration` | 403 each | A's configuration unchanged | P1 |

## Offers (`tests/offers/`)

| ID | Scenario | Preconditions | Request | Status | Expected | Priority |
|---|---|---|---|---|---|---|
| OFR-001 | Create and read back | none | POST `/job-offers` complete; GET | 201; 200 | `Location` header a URI; DRAFT, `isComplete` true, `companyId` = header, `availableTransitions` `[submit]`, `publishedAt` and `closedAt` null; GET equals POST | P1 |
| OFR-002 | (M) Update in editable states only | one offer per status | PUT a new title | 200 DRAFT, TO_FINALIZE; 409 others | 409 `INVALID_STATE`, `allowedStatuses` `[DRAFT, TO_FINALIZE]`, title unchanged | P1 |
| OFR-003 | (M) Delete in DRAFT only | one offer per status | DELETE | 204 DRAFT; 409 others | after 204 GET is 404; 409 `allowedStatuses` `[DRAFT]`, GET still 200 | P1 |
| VAL-001 | (M) Create body rules | none | POST with `{}`; blank title; `title: null`; 201-char title; CUSTOM without city; `countryCode` `fr`; `amount` -1; `currency` `eur` | 422 x8 | `ValidationError`, `fieldErrors[].field` ends with the leaf | P2 |
| VAL-002 | (M) Update body rules | offer in DRAFT | PUT with blank title; `title: null`; 201-char title; `amount` -1 | 422 x4 | `ValidationError` naming the field; title unchanged | P2 |
| VAL-003 | (M) Boundaries accepted | none | POST with a 200-char title; with `amount` 0 | 201 x2 | body as sent, `isComplete` true (`minimum: 0`) | P3 |

## Workflow (`tests/workflow/`)

Expected statuses come from `src/oracle.ts`, written from the spec.

| ID | Scenario | Preconditions | Request | Status | Expected | Priority |
|---|---|---|---|---|---|---|
| WFL-001 | (M) Happy path per flag combination, then close | flags of the row; a complete offer | forward action until PUBLISHED, then `close`; GET `/transitions` after each | 200 each | status per the oracle; `availableTransitions` equals `GET /transitions`; `publishedAt`, `closedAt` set | P1 |
| WFL-002 | (M) Invalid transitions | one offer per (status, action) pair of the oracle | POST `/transitions/{action}` | 400 each | `INVALID_TRANSITION` with `currentStatus`, `requestedAction`, `validActions`; status and history unchanged | P1 |
| WFL-003 | Submit of an incomplete offer | no flag; offer without compensation | `submit` | 422 | `INCOMPLETE_OFFER`, `missingFields` has `compensation.salaryEntries`; still DRAFT | P1 |
| WFL-004 | Partial save: gate, then publish | `partialSaveEnabled`; incomplete offer in TO_FINALIZE | `finalize`; PUT compensation then `finalize` | 422; 200 then 200 | `INCOMPLETE_OFFER`, still TO_FINALIZE; `isComplete` true, PUBLISHED | P1 |
| WFL-005 | Reject needs a reason, returns to DRAFT | `approvalRequired`; offer in TO_APPROVE | `reject` with `{}`; GET `/transitions` then `reject` with reason and comment | 422; 200 then 200 | `missingFields` `[reason]`, still TO_APPROVE; reject listed with `requiresReason`, DRAFT with `[submit]`, history carries reason and comment | P2 |
| WFL-006 | (M) Withdraw returns to DRAFT | one offer per TO_FINALIZE, TO_APPROVE, TO_POST | `withdraw`; PUT title | 200; 200 | DRAFT, editable again | P2 |
| WFL-007 | Close then reopen | offer in PUBLISHED | `close`; `reopen` | 200; 200 | CLOSED with `closedAt`, `[reopen]`; PUBLISHED with `[close]` | P2 |

## Configuration, listing, history

| ID | Scenario | Preconditions | Request | Status | Expected | Priority |
|---|---|---|---|---|---|---|
| CFG-001 | Defaults, update, read back | fresh company | GET; PUT all true; GET | 200 each | all false with `companyId` = header; echoed; equal to the PUT response | P2 |
| CFG-002 | Flags snapshotted at creation | offer A; then `approvalRequired`; offer B | `submit` A and B | 200; 200 | A PUBLISHED, B TO_APPROVE | P1 |
| CFG-003 | A flag that is not a boolean | fresh company | PUT `{ "approvalRequired": "yes" }` | 400 | `Error` body (A13); GET still all false | P3 |
| LST-001 | Default page and pagination | 5 offers | GET; `size=2` for pages 0 to 3 | 200 each | page 0, size 20, newest first; sizes 2, 2, 1, 0, `totalPages` 3, union of ids is the 5 | P2 |
| LST-002 | (M) Invalid query values | none | `page=-1`; `size=0`; `size=101`; `size=abc`; `status=BOGUS`; `sort=bogus` | 400 each | `Error` body, not 422, not 500 | P3 |
| HIS-001 | History follows the transitions | all flags; fresh offer | GET `/history`; submit, finalize, approve, post, close; GET | 200 | empty first; then the 5 actions in order, each `toStatus` the next `fromStatus`, `performedAt` non-decreasing | P2 |

Contract shapes have no group: the endpoint classes validate every response, success or error, against the spec (ADR 0005).

## Rationale

Risk order: tenant isolation (the header is the only boundary), the state machine with its three flags and the snapshot rule (the only business logic, and the classic latent bug "configuration applies to new offers only"), the mutation guards (a live listing edited or deleted, an incomplete offer published), then the 422 shape a frontend keys on, with boundaries sampled in pairs on both sides of a rule. Pagination and history are P2: wrong counts annoy, they do not leak. The P3 rows cost one table row each and are the first to cut under time pressure.

Left out: unknown id on every endpoint (TEN-002 proves the 404 once); other list filters and sort fields; PUT merge semantics and PUT `{}` (undefined); `COMPANY_ADDRESS` with an address; every maxLength and pattern beyond the sampled ones; configuration 404 (unreachable with a trusted header); malformed JSON (framework); an unknown action in the path (no status documented); concurrency and double submit (no version field, a gap worth raising); `traceId` and `performedBy` values; authentication and CI (the brief).

## Assumptions

Where the spec is silent, the suite reads it this way; each is a sentence to confirm with the service owner.

- A1 An offer is complete with at least one `salaryEntries` entry; bonus-only is incomplete.
- A2 POST always creates a DRAFT, incomplete or not; completeness is checked when leaving DRAFT (`partialSaveEnabled` false) and TO_FINALIZE.
- A3 A wrong action for the status is 400 `INVALID_TRANSITION`; an edit or delete in a wrong status is 409 `INVALID_STATE`. The `code` of 401, 404 and bad requests is implementation-defined: shape only.
- A4 `reject` without `reason` is 422 `VALIDATION_ERROR` with `details.missingFields` `[reason]`; the state is checked first.
- A5 `withdraw` is valid from TO_FINALIZE, TO_APPROVE and TO_POST only; a live offer leaves through `close`.
- A6 The configuration 403 fires when the path `companyId` differs from the header, before any lookup; GET of a never-configured company returns the defaults; a random UUID is a valid tenant.
- A7 The three flags are snapshotted on the offer at creation.
- A8 `submit` lands in TO_FINALIZE whenever `partialSaveEnabled` is true, even for a complete offer.
- A9 `availableTransitions` on the offer lists the same actions as `GET /transitions`.
- A10 History is in transition order; creation adds no entry.
- A11 `fieldErrors[].field` is a dotted path, asserted by its last segment.
- A12 A documented response header is expected on every response of that status, `required` or not (`Location` on 201).
- A13 Offers validate with 422 `ValidationError`, the configuration with 400 `Error`: the spec documents no 422 on PUT configuration.
