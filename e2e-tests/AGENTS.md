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
| `src/api/` | `conduit-api.ts`: a `Session` (`request`, optional `token`) over `@shared/api/api`, paths under `/api/` on the web base URL, `Authorization: Token` when the session has one, no contract (a precondition call checks its status only); one class per endpoint in `users/`, `articles/`, `comments/`; `types.ts` flat, `index.ts` the barrel |
| `src/fixtures/<domain>.fixtures.ts`, `test.ts` | page objects and data of one domain; `test.ts` chains the domains (`auth`, `articles`, `comments`) and exports `test`. Two page bases: `authPage` and `navbar` sit on the plain `page` (a clean browser, for the one flow that starts logged out); `editorPage`, `articlePage`, `profilePage`, `commentsPage` sit on `authenticatedPage` |
| `src/setup/auth.setup.ts`, `auth-file.ts` | the `setup` project every browser project depends on: reuses `reports/e2e/.auth/<TEST_ENV>.json` when its token answers `GET /api/user`, else registers one user and writes that storageState. One user per run, not per test: the demo allows 5 register or login calls per hour per IP, a token never expires, users stay (no delete endpoint) |
| `apiUser`, `session`, `anonymous`, `authenticatedPage` | the cached user (`username`, `email`, `token`); the API sessions with and without its token; a new context from the cached storageState (`localStorage.loggedUser`), closed after the test |
| `articles`, `track(title)` | `ArticlesFactory` of the cached user: `seed(draft?)` and `comment(slug, text?)` through the API, `track(title)` for an article the UI creates; teardown deletes every seeded slug and every tracked title found among the user's own, reported through `reportLeftovers` |
| `src/test-data/factories.ts` | `RUN_ID` (`qa-<base36 time>-<worker>`); `uniqueUser()`, `articleDraft()` (slug-safe title with the run id, no tag), `commentText()`; faker, never `node:crypto` |
| `src/utils/requests.ts` | the budget of a context: shell served once per worker, noise answered locally, `server requests` attached per test, a 429 annotated |
| `tests/<domain>/<domain>-<flow>.spec.ts` | one flow, readable as a user story; tags: the domain, one layer, one priority (`@p1`, `@p2`, `@p3`, the docs row), one tier (`@smoke` proves the product works, `@sanity` a daily action, `@regression` a fixed bug, `@release-check` an entry point). Model: `articles`, ART-001 |

## Add a flow (bottom up; in brackets, the error when a step is skipped)

1. Selectors from `src/_template/template.selectors.ts.example`.
2. Page object from `src/_template/template.page.ts.example` [`No magic number`, `Missing JSDoc comment`].
3. Fixture in `src/fixtures/<domain>.fixtures.ts` on `authenticatedPage` (on `page` only for a flow that starts logged out), chained in `src/fixtures/test.ts` [`Test has unknown parameter "xPage"`].
4. Row in `docs/test-scenarios.md`, next ID, its `Priority`, its `Tier`, `Impl = yes` [`test XXX-000 is not in docs/test-scenarios.md`].
5. Spec from `tests/_template/template.spec.ts.example`: title `XXX-000 <flow>`, tags `{ tag: ["@<domain>", "@<layer>", "@<priority>", "@<tier>"] }`, `track(title)` after a UI create [`Specs drive page objects from fixtures`, `A test title starts with its scenario ID`, `carries ...; expected @<domain>, one of ..., one of @p1, @p2, @p3 and one of @smoke, ...`].
6. `npx playwright test -c e2e-tests tests/<domain>`, then `npm run traceability`; `/verify` is the done gate.

## Common errors

| You see | Cause | Fix |
|---|---|---|
| `Test has unknown parameter "editorPage"` | domain not chained in `src/fixtures/test.ts` | add the `.extend()` line |
| `"ART-001 ..." carries @articles @happy-path; expected @articles, one of ..., one of @p1, @p2, @p3 and one of @smoke, ...` | no tier tag, two, or no layer or priority | one layer, one priority and one tier per test, priority and tier from the docs row |
| `strict mode violation` | the locator matched several records of the shared demo | scope by own title with the dynamic selector |
| `Prefer locator methods instead of page methods` on `xPage.fill(...)` | eslint reads an object named `...Page` as the page | name the action by intent: `write`, `post`, `publish` |
| a fill is overwritten, or a check passes on an empty list | the screen fills itself after a fetch (`/#/editor/<slug>`), or shows a placeholder first (`.article-preview > em`) | wait in the page object for the prefill or the loaded list, as `openEdit` and `assertArticleNotListed` do |
| `net::ERR_NAME_NOT_RESOLVED` or 5xx from fly.dev | demo down | `TEST_ENV=local` or `WEB_BASE_URL=...` |
| a blank page after Sign up or Login, nothing under the navbar | the demo answered 429: 5 register or login calls per hour per IP, about 100 requests per 15 minutes | wait for the window; iterate on `TEST_ENV=local`; never loop a run or `--repeat-each` on the demo |
| an element appears late | shared demo latency | assertions retry; raise `expect.timeout` in the config only, never a sleep |
