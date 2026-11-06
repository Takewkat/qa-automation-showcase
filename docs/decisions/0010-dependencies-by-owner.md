# 0010 Dependencies by owner, and as few as the job needs

Context: the suite's manifest listed `hono`, `@hono/node-server` and `zod`, which only the reference stub uses; the contract check pulled `@apidevtools/swagger-parser` for one call; random ids came from `node:crypto` in the fixtures and in two specs; `tsx` ran the scripts and the stub; a plugin held one lint rule. The author's previous suites generate every random value through `@faker-js/faker` in one `test-data/factories.ts` and carry no library a reader has to look up.

Decision: `api-tests/stub/` is its own npm workspace, on `node:http` (a 70-line router) and `zod`. `api-tests/package.json` lists what the tests need: `ajv` and `ajv-formats` for the contract, `yaml` to read the spec, `@faker-js/faker`. ajv resolves the spec's `$ref` by JSON pointer into the document, so no dereferencer. `src/test-data/factories.ts` is the only source of random data; eslint and the `guard-boundaries` hook refuse `node:crypto` in specs and `src/`. Node 24 runs `scripts/` and the stub as TypeScript, so no `tsx`; the stub's imports carry `.ts`. `linterOptions.noInlineConfig` replaces the eslint-comments plugin.

Consequences: four runtime dependencies in the suite, one in the stub, no build tool. A new kind of random value is one generator. The stub keeps `randomUUID` from `node:crypto`: it is a server, not test data.
