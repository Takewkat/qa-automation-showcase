# 0002 The company id is the test sandbox

Context: every request carries `X-Company-Id`; the spec scopes all data to it and trusts the header.

Decision: each test gets a fresh UUID from the `companyId` fixture. Configuration flags are set on that company. A second fixture gives another fresh company for isolation scenarios.

Consequences: no shared state, no reset step, exact counts in list assertions, `fullyParallel` is safe. Against a deployment that validates companies, the two ids come from env variables and list counts need a title filter; the README says so.
