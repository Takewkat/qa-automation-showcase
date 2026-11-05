# How a new state enters the suite

What this page gives: the files that change when the state machine grows, with one worked example. Everything else (facade, contract check, fixtures, the specs) stays as it is: the matrices read the oracle, the types come from the spec.

## Worked example: TO_REVIEW

A `reviewRequired` flag inserts TO_REVIEW between TO_APPROVE and TO_POST, left by `review`, and `withdraw` applies to it.

| Step | File | Change |
|---|---|---|
| 1 | `spec/job-offer-swagger.yml` | `TO_REVIEW` in `JobOfferStatus`, `review` in `TransitionAction`, `reviewRequired` in both configuration schemas. `npm run gen:types`: TypeScript now names every switch on a status that misses the new one |
| 2 | `src/enum/job-offer.enum.ts`, `src/oracle.ts` | `TO_REVIEW` in `JOB_OFFER_STATUSES`; `VALID_ACTIONS.TO_REVIEW = [review, withdraw]`, `FORWARD.TO_REVIEW = review`, `REACHED_WITH.TO_REVIEW = { reviewRequired }`, `reviewRequired: false` in `NO_FLAGS`. `HAPPY_PATHS`: 8 rows become 16, each naming the flags on. `INVALID_TRANSITIONS`: the pairs the spec refuses, for example `(TO_REVIEW, approve)` |
| 3 | `stub/state-machine.ts`, `stub/validation.ts` | one branch in the target function, the flag in the configuration schema. The stub is a means to run the suite; a real deployment replaces it with `TEST_ENV` |
| 4 | `tests/` | nothing: WFL-001 runs 16 paths, WFL-002 the new pairs, OFR-002, OFR-003 and WFL-006 take `TO_REVIEW` as one more row. A new guard (say, `review` needs a comment) is one new row and one new `test()`, by `/add-api-scenario` |
| 5 | `docs/test-scenarios.md` | the counts in the WFL-001 and WFL-002 rows, the new assumption if the spec is silent |
| 6 | `npm run verify` | green means the oracle, the stub and the table agree |

## Why it stays small

- The oracle is data: a status is a row, not a branch. The stub is the only place with logic, and the suite proves it, never the other way round (`docs/decisions/0003`).
- The facade and the contract check never mention a status: they read the spec.
- Each matrix is `for (const row of TABLE) test(...)`: more rows, no more code.
