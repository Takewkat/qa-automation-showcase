# e2e-tests: rules

Stack: Playwright with TypeScript. Target: `https://conduit-realworld-example-app.fly.dev` by default, `BASE_URL` for another one
(Conduit run locally from its README answers on `http://localhost:3000`). Run: `npm test`; `npm run test:ui` to watch.

## The 4-file chain (dependency direction, enforced)

spec -> fixtures -> page object -> selectors. API clients are reached through fixtures too.

- `src/selectors/<page>.selectors.ts` `<PAGE>_SELECTORS as const`: one group per component, camelCase keys, functions for dynamic selectors. No logic.
- `src/pages/<page>.page.ts` one class, extends `BasePage`, every method in `test.step()`, assertion methods prefixed `assert`. Semantic locators (`getByRole`) are fine here; raw CSS only from the selectors file.
- `src/api/` thin typed wrappers over `APIRequestContext`, for seeding and cleanup only.
- `src/fixtures/<domain>.fixtures.ts` page objects and data of one domain; `src/fixtures/test.ts` chains them and exports `test` and `expect`.
- `src/test-data/factories.ts` users, articles and comments carrying the run id.
- `tests/<domain>/<domain>-<flow>.spec.ts` one flow, readable as a user story.

## Critical rules

1. A spec never touches `page`, a locator or a selector; it calls page-object methods from fixtures. Checked by eslint and the pre-write hook.
2. Every assertion on the live demo is scoped to data the test created (a title or text carrying the run id); never count or read global lists. Checked by `harness-reviewer`.
3. Only AUTH-001 logs in through the UI. Every other spec starts from `authenticatedPage` (API registration, session injected into `localStorage`). Checked by the reviewer.
4. Data created through the UI is registered for cleanup (`track(slug)`); API-seeded data cleans itself up in its fixture. Checked by the reviewer.
5. No hardcoded timeout in a page object. Checked by eslint `no-magic-numbers`.
6. Every `test()` title starts with its scenario ID and the ID is a row of `docs/test-scenarios.md` with `Impl = yes`. Checked by eslint and `npm run traceability`.

## Add a flow (bottom up; skipping a step gives the error in brackets)

1. Selectors: `src/selectors/<page>.selectors.ts` from `src/_template/template.selectors.ts.example`.
2. Page object: `src/pages/<page>.page.ts` from `src/_template/template.page.ts.example` [eslint: `no-magic-numbers`, `jsdoc/require-jsdoc`].
3. Fixture: add the page object to `src/fixtures/<domain>.fixtures.ts` and chain the domain in `src/fixtures/test.ts` [`Test has unknown parameter "xPage"`].
4. Row in `docs/test-scenarios.md`, next ID, `Impl = yes` [`traceability: test XXX-000 is not in docs`].
5. Spec: `tests/<domain>/<domain>-<flow>.spec.ts` from `tests/_template/template.spec.ts.example` [eslint: `page` in a spec, title without ID].
6. `npx playwright test tests/<domain>`, then `npm run verify` from the root.

`/add-e2e-flow` runs this list.

## Reference architecture

Copy from the `articles` domain: its selectors, page objects, fixtures and the ART-001 spec are the model.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `Test has unknown parameter "editorPage"` | domain not chained in `src/fixtures/test.ts` | add the `.extend()` line |
| `strict mode violation` | the locator matched several records of the shared demo | scope by own title with the dynamic selector |
| `net::ERR_NAME_NOT_RESOLVED` or 5xx from fly.dev | demo down | run Conduit locally, set `BASE_URL` |
| an element appears late | shared demo latency | assertions auto-retry; never add a sleep; raise `expect.timeout` in the config only |
