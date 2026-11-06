# 0004 One class per endpoint over a generic base

Context: the API layer is what a reviewer reads first. The author's previous suites (Hublo, Believe) declare one class per endpoint with `path`, `method` and the success status, over a base that sends, checks the status and checks the schema.

Decision: `shared/api/api.ts` is that base, shared by both parts and generic over any spec: `getUrl`, `request`, `checkStatusCode`, `checkSchema`, `getResponseBody`, and `send` runs the four. `src/api/job-offer-api.ts` sets the contract and the `X-Company-Id` header. `src/api/<resource>/<action>.ts` is one class with one typed method; the last argument names another documented status and the body comes back as the named type: `get<ErrorResponse>(id, 404)`. `src/api/types.ts` names the spec's models, like a generated api-types package.

Consequences: an endpoint is one file and one export line; the base carries every cross-cutting rule. An undocumented status fails at run time in `checkSchema`, the trade the previous suites made. Part 2's seeding client extends the same base and sets no contract: a precondition call checks its status only, as the Believe suite does.
