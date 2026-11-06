# 0002 A reference stub, and an oracle independent of it

Context: Part 1 ships an OpenAPI document and no server; the brief asks for a runnable collection.

Decision: `api-tests/stub/` implements the spec's rules on `node:http` and zod; Playwright starts it as `webServer` on `TEST_ENV=local`, and `TEST_ENV` or `API_BASE_URL` points the same suite at a deployment. Expected values come from `src/oracle.ts`, written from the spec by hand: the status chain of each of the 8 flag combinations and the invalid pairs. Imports between `src/` or `tests/` and `stub/` are refused by eslint and the pre-write hook. The stub is three folders, `http/` the adapter, `domain/` the rules and request shapes, `store/` the memory; `domain/` depends on nothing, enforced the same way.

Consequences: green on a clean clone, every assertion meaningful, a wrong rule in the stub turns a test red. A new state is a row in the oracle and a branch in the stub; the matrices pick it up. A mock replaying examples would have left transitions and tenancy untestable.
