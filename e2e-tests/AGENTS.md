# e2e-tests: rules

Stack: Playwright with TypeScript. Targets: `TEST_ENV=demo` (the public demo, default), `TEST_ENV=local` (Conduit on `localhost:3000`), `WEB_BASE_URL` for an ad-hoc one.
Run: `npm test`; `npm run test:ui` to watch; `BROWSERS=chromium,firefox npm test` for more browsers.
Rules: the table in the root `AGENTS.md`. Below: the chain, the checklist, the errors.

## The 4-file chain (enforced)

spec -> fixtures -> page object -> selectors. API clients are reached through fixtures too.

| Path | Holds |
|---|---|
| `src/selectors/<page>.selectors.ts` | `<PAGE>_SELECTORS as const`: one group per component, functions for dynamic selectors, no logic |
| `src/pages/<page>.page.ts` | one class extending `BasePage`, every method in `test.step()`, assertions prefixed `assert`; `getByRole` is fine here, raw CSS only from the selectors file |
| `src/api/` | one class per endpoint over `@shared/api/api`, the api-tests shape, for login, seeding and cleanup; the service class sets the Token header and no contract, so a precondition call checks its status only |
| `src/fixtures/<domain>.fixtures.ts`, `test.ts` | page objects and data of one domain; `test.ts` chains the domains and exports `test` |
| `authenticatedPage`, `track(title)` | a user registered through the API, session injected into `localStorage`; a UI-created article, found in teardown by its title among the user's own, then deleted |
| `src/test-data/factories.ts` | users, articles and comments carrying the run id |
| `tests/<domain>/<domain>-<flow>.spec.ts` | one flow, readable as a user story. Model: `articles`, ART-001 |

## Add a flow (bottom up; in brackets, the error when a step is skipped)

1. Selectors from `src/_template/template.selectors.ts.example`.
2. Page object from `src/_template/template.page.ts.example` [`No magic number`, `Missing JSDoc comment`].
3. Fixture in `src/fixtures/<domain>.fixtures.ts`, chained in `src/fixtures/test.ts` [`Test has unknown parameter "xPage"`].
4. Row in `docs/test-scenarios.md`, next ID, `Impl = yes` [`test XXX-000 is not in docs/test-scenarios.md`].
5. Spec from `tests/_template/template.spec.ts.example`: title `XXX-000 <flow>`, tags `{ tag: ["@<domain>", "@<layer>"] }`, `track(title)` after a UI create [`Specs drive page objects from fixtures`, `A test title starts with its scenario ID`, `carries ...; expected @<domain> and one of ...`].
6. `npx playwright test -c e2e-tests tests/<domain>`, then `npm run traceability`; `/verify` is the done gate.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `Test has unknown parameter "editorPage"` | domain not chained in `src/fixtures/test.ts` | add the `.extend()` line |
| `strict mode violation` | the locator matched several records of the shared demo | scope by own title with the dynamic selector |
| `net::ERR_NAME_NOT_RESOLVED` or 5xx from fly.dev | demo down | `TEST_ENV=local` or `WEB_BASE_URL=...` |
| an element appears late | shared demo latency | assertions retry; raise `expect.timeout` in the config only, never a sleep |
