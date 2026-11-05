# 0008 One class per endpoint

Context: the API layer is what a reviewer reads first and what the author defends in interviews. Her previous suites (Hublo `apps/playwright`, Believe `test-runner-users`) declare one class per endpoint with `path`, `method` and the success status, over a base that sends, checks the status and checks the schema.

Decision: `src/api/job-offer-api.ts` is that base: `request`, `checkStatusCode`, `checkSchema`, `getResponseBody`, and `send` that runs the four. `src/api/<resource>/<action>.ts` holds one class per endpoint with one typed method. A spec writes `new GetJobOffer(company).get(id)`; the last argument names another documented status, and the body comes back as the type the caller names: `get<ErrorResponse>(id, 404)`. `src/api/types.ts` lists the models of the spec under their own names, the way a generated api-types package does; the base class is not generic over the operation. A single facade over an operations table was the first cut: fewer files, a shape nobody on the team had worked with.

Consequences: adding an endpoint is one file and one export line. The typed method is all a spec sees. The base carries every cross-cutting rule: header, URL, step naming, checks. A status the spec does not document fails at run time in `checkSchema`, not at compile time: the trade the previous suites made, kept so the layer reads like theirs.
