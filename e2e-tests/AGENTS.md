# e2e-tests: rules

Stack: Playwright with TypeScript. Targets in `config/environments.ts`: `TEST_ENV=demo` (the public demo) by default, `TEST_ENV=local` for a Conduit run from its README on `localhost:3000`, `WEB_BASE_URL` for an ad-hoc one.
Run: `npm test`. `npm run test:ui` to watch. `BROWSERS=chromium,firefox npm test` for more browsers.
Rules: the table "Rules, each with its check" in the root `AGENTS.md`. Below: the chain, the checklist, the errors.

## The 4-file chain (dependency direction, enforced)

spec -> fixtures -> page object -> selectors. API clients are reached through fixtures too.

| Path | Holds |
|---|---|
| `src/selectors/<page>.selectors.ts` | `<PAGE>_SELECTORS as const`: one group per component, camelCase keys, functions for dynamic selectors. No logic |
| `src/pages/<page>.page.ts` | one class, extends `BasePage`, every method in `test.step()`, assertion methods prefixed `assert`. Semantic locators (`getByRole`) are fine here, raw CSS only from the selectors file |
| `src/api/` | thin typed wrappers over `APIRequestContext`, for seeding and cleanup only |
| `src/fixtures/<domain>.fixtures.ts` | page objects and data of one domain |
| `src/fixtures/test.ts` | chains the domains, exports `test` and `expect` |
| fixtures `authenticatedPage`, `track(title)` | a user registered through the API, session injected into `localStorage`. A UI-created article, found in teardown through the API by its title among the user's own, then deleted. API-seeded data cleans itself up in its fixture |
| `src/test-data/factories.ts` | users, articles and comments carrying the run id |
| `tests/<domain>/<domain>-<flow>.spec.ts` | one flow, readable as a user story. Model: the `articles` domain and the ART-001 spec |

## Add a flow (bottom up; skipping a step gives the error in brackets)

1. Selectors: `src/selectors/<page>.selectors.ts` from `src/_template/template.selectors.ts.example`.
2. Page object: `src/pages/<page>.page.ts` from `src/_template/template.page.ts.example` [`No magic number:`, `Missing JSDoc comment`].
3. Fixture: add the page object to `src/fixtures/<domain>.fixtures.ts` and chain the domain in `src/fixtures/test.ts` [`Test has unknown parameter "xPage"`].
4. Row in `docs/test-scenarios.md`, next ID, `Impl = yes` [`e2e-tests: test XXX-000 is not in docs/test-scenarios.md`].
5. Spec: `tests/<domain>/<domain>-<flow>.spec.ts` from `tests/_template/template.spec.ts.example`, tags `{ tag: ["@<domain>", "@<layer>"] }` with one layer of `@happy-path`, `@validation-error`, `@error-case`, `track(title)` after a UI create [`Specs drive page objects from fixtures, never page directly`, `A test title starts with its scenario ID, for example "WFL-001 ..."`].
6. From the root: `npx playwright test -c e2e-tests tests/<domain>`, then `npm run traceability`. `/verify` is the done gate.

`/add-e2e-flow` runs this list.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `Test has unknown parameter "editorPage"` | domain not chained in `src/fixtures/test.ts` | add the `.extend()` line |
| `strict mode violation` | the locator matched several records of the shared demo | scope by own title with the dynamic selector |
| `net::ERR_NAME_NOT_RESOLVED` or 5xx from fly.dev | demo down | run Conduit locally and `TEST_ENV=local`, or set `WEB_BASE_URL=...` |
| an element appears late | shared demo latency | assertions auto-retry, never add a sleep. Raise `expect.timeout` in the config only |
