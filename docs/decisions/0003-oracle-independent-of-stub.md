# 0003 The oracle is independent of the stub

Context: the stub implements the state machine and the tests check it. Sharing code between the two would prove nothing.

Decision: `api-tests/src/expected-paths.ts` holds the expected status chain for each of the 8 flag combinations and the invalid (status, action) pairs, written from the spec by hand. The stub has its own engine. Imports in either direction are banned by eslint and the pre-write hook.

Consequences: a wrong rule in the stub turns a test red (the mutation check in the README shows it). Adding a state means one row in the oracle, one branch in the stub, and the matrices pick it up.
