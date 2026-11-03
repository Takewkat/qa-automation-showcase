# 0001 A reference stub instead of a mock

Context: Part 1 ships an OpenAPI document and no server. The brief asks for a runnable collection.

Decision: a small Hono stub in `api-tests/stub/` implements the spec's rules (tenancy, state machine, guards, validation), started by Playwright as `webServer`; `BASE_URL` points the same suite at a real deployment.

Consequences: the suite is green on a clean clone and every assertion is meaningful. The stub is extra work and is not a deliverable; its rules are checked by the suite, whose expected values come from the spec, never from the stub (see 0003). A mock replaying examples (Prism) would have made transition and tenancy scenarios untestable.
