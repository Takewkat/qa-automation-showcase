# e2e-tests: Conduit E2E flows

Six user flows on the Conduit RealWorld demo (`docs/test-scenarios.md`): Playwright, page objects behind fixtures, data seeded through the API, one user per run. Rules for people and agents: `AGENTS.md`.

## Run

| Command | Runs |
|---|---|
| `npm run test:demo:run` (here) or `npm run test:e2e:demo` (root); `npm test` is the same | the suite on the public demo, Chromium, once per 15 minutes |
| `npm run test:local:run` (here) or `npm run test:e2e:local` (root) | the same suite on a local Conduit (`localhost:3000`, below), as often as you like |
| `WEB_BASE_URL=https://host npm test` | an ad-hoc target |
| `BROWSERS=chromium,firefox,webkit npm test` | more browsers (`npx playwright install` first) |
| `npx playwright test -c e2e-tests tests/articles` | one domain |
| `npx playwright test -c e2e-tests --grep @smoke` | one tier: `@smoke`, `@sanity`, `@regression`, `@release-check`; `--grep @p1` the critical set |
| `npm run test:local:ui`, `npm run test:demo:ui`, `npm run report` | the UI mode per target; the HTML report under `reports/e2e/`, its metadata names the target |

## Structure

| Layer | Path | Holds |
|---|---|---|
| selectors | `src/selectors/<page>.selectors.ts` | `<PAGE>_SELECTORS as const`, a group per component, functions for dynamic ones, no logic |
| pages | `src/pages/<page>.page.ts` | one class per screen over `BasePage`, every method a named `this.step`, checks named `assert...` |
| fixtures | `src/fixtures/<domain>.fixtures.ts`, `test.ts` | page objects and data of one domain, chained into the `test` every spec imports |
| specs | `tests/<domain>/<domain>-<flow>.spec.ts` | one flow each, titled `XXX-000 I can ...`, tagged domain, layer, priority, tier; fixtures and factories only |
| api | `src/api/` | one class per Conduit endpoint, for seeding and cleanup, never for assertions |
| setup | `src/setup/auth.setup.ts` | the project that registers the run's user once and caches its session per environment |
| test data | `src/test-data/factories.ts` | `uniqueUser()`, `articleDraft()`, `commentText()`, every value carrying the run id |

## The demo and its limits

The demo is shared and limits every IP: 5 register or login calls per hour, about 100 requests per 15 minutes. A blank page under the navbar after Sign up or Login is a 429, not a selector problem: wait for the window, or switch to the local target. One run spends about 75 requests and 2 auth calls (AUTH-001); a cold cache adds one register, a CI retry of AUTH-001 two more, which is the whole hour. Never loop a run, `--repeat-each` or retry a failure on the demo by hand; iterate locally. Every browser context is budgeted (`src/utils/requests.ts`): the document and the bundles are fetched once per worker and served from memory, icons, manifest and the tag cloud never leave the browser, and the report attaches `server requests` to each test (`api N, app N`, then one line per request) with a 429 as a `rate-limited` annotation. No retry on the demo, whatever `CI` says.

## Local Conduit, one command

The upstream app has no limiter. From the root, with Docker running:

```
npm run conduit:local                # terminal 1: docker compose up --build, Postgres and the app on http://localhost:3000
npm run test:local:ui                # terminal 2, from e2e-tests/: UI mode on it (npm run test:e2e:local from the root)
npm run conduit:local:down           # afterwards
```

`e2e-tests/local/`: the `Dockerfile` builds the upstream app from source inside the image (production mode: the backend serves the built frontend and `/api` on one port, as the demo does; `CONDUIT_REF` pins a branch or tag), `compose.yml` adds Postgres with a healthcheck and maps the app to port 3000. The first `up --build` takes a few minutes; later ones reuse the image. Without Docker: a Postgres of your own (user, password and database `conduit`), the upstream repo cloned, the `.env` below in its root and in `backend/`, then `npm install && npm run dev` (Vite on 3000 proxies `/api` to the backend on 3001). No `DEV_DB_LOGGING` line: a string there breaks Sequelize's sync and no table is created.

```
PORT=3001
JWT_KEY=any-string
DEV_DB_USERNAME=conduit
DEV_DB_PASSWORD=conduit
DEV_DB_NAME=conduit
DEV_DB_HOSTNAME=127.0.0.1
DEV_DB_DIALECT=postgres
```
