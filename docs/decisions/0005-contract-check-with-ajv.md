# 0005 Contract check with ajv

Context: the spec is OpenAPI 3.1 with two 3.0 habits, `nullable: true` and `format: decimal`, and `example` keywords JSON Schema 2020-12 does not know.

Decision: `src/api/common/contract.ts` parses the spec once per worker (`yaml`), registers it in ajv 2020 so every `$ref` resolves by JSON pointer, rewrites `nullable` into a `[type, "null"]` union, registers `decimal` as pass-through and runs `strict: false`. The response schema and the documented headers are found by path, method and status; a status the spec does not document fails the call.

Consequences: every response, success or error, is validated with no per-test code. The three accommodations are the whole gap between OpenAPI 3.1 and JSON Schema.
