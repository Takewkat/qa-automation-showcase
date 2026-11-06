# 0009 Contract check with ajv

Context: the spec is OpenAPI 3.1 with two OpenAPI 3.0 habits, `nullable: true` and `format: decimal`, and `example` keywords that JSON Schema 2020-12 does not know.

Decision: `src/api/common/contract.ts` (`Contract`) parses the spec once per worker (`yaml`), registers the document in ajv so every `$ref` resolves by JSON pointer into it, rewrites `nullable: true` into a `[type, "null"]` union, registers `decimal` as a pass-through format and runs ajv 2020 with `strict: false`, so unknown keywords are ignored rather than fatal. The response schema and the documented headers are looked up by path, method and status. A status the spec does not document fails the call.

Consequences: every call validates its body and headers against the document, success and error alike, with no per-test code. The three accommodations are the whole gap between OpenAPI 3.1 and JSON Schema; a stricter spec removes them.
