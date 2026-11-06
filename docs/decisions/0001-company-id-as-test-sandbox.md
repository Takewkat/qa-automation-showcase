# 0001 The company id is the test sandbox

Context: every request carries `X-Company-Id`; the spec scopes all data to it and trusts the header.

Decision: each test gets a fresh UUID from the `company` fixture and sets its flags on that company; `otherCompany` is a second fresh one for isolation scenarios.

Consequences: no shared state, no reset step, exact counts in list assertions, `fullyParallel` is safe. A deployment that validates companies needs the two ids from the environment and a title filter on lists.
