# qa-automation-showcase: rules for agents

Read this before changing anything. Part rules: `api-tests/AGENTS.md`, `e2e-tests/AGENTS.md`.
Every rule here is enforced by a tool; its error text is the feedback you get, and it names the rule.

## Map

- `api-tests/` Part 1: Job Offer Microservice API tests (Playwright `request`, TypeScript) against a Hono reference stub, or any deployment through `BASE_URL`.
- `e2e-tests/` Part 2: Conduit RealWorld E2E flows (Playwright), live demo by default.
- `scripts/verify.sh` the "done" gate; `scripts/check-traceability.ts` ties scenario tables to tests by ID.
- `docs/architecture.md` the patterns and the dependency direction; `docs/decisions/` why they were chosen.
- `.claude/` Claude Code surface (hooks, skills, reviewer), described at the end of this file.
- `HOMEWORK.md` the brief and `api-tests/spec/` the OpenAPI spec, as received, transcribed to ASCII (arrows, dashes, one accented example); schemas untouched. Inputs, never edited.

## Commands

```
npm ci                 # once, from the root (npm workspaces)
npm run verify         # done = exit 0
npm run test:api       # Part 1, TEST_ENV=local by default (stub started by Playwright)
npm run test:e2e       # Part 2, TEST_ENV=demo by default
TEST_ENV=staging npm run test:api   # any row of config/environments.ts
npm run lint:fix       # eslint --fix + prettier
npm run traceability   # docs <-> tests by scenario ID
```

## Environments

`config/environments.ts` is the one table of targets; `TEST_ENV` picks the row, `.env` at the root is read automatically.

| TEST_ENV | api | web | Note |
|---|---|---|---|
| `local` | stub on `127.0.0.1:8080`, started by Playwright | Conduit on `localhost:3000` | API fallback |
| `demo` | - | `conduit-realworld-example-app.fly.dev` | E2E fallback |
| `staging` | `api.staging.example.com` (from the spec) | - | |
| `production` | listed, refused | - | never a test target |

`API_BASE_URL` / `WEB_BASE_URL` override one target for an ad-hoc run. `BROWSERS=chromium,firefox,webkit` picks the E2E projects. Add an environment: one row in the table, nothing else.

## Rules, each with its check

| Rule | Checked by | What you see |
|---|---|---|
| Specs call page objects or the API facade through fixtures, never `page`, locators, `request`, `.json()` | eslint `no-restricted-syntax` / `no-restricted-imports`; hook `guard-boundaries` before the write | the rule name and the layer that owns the call |
| `src/` and `tests/` never import `stub/`, `stub/` never imports `src/` | eslint `no-restricted-imports`; hook | "the oracle stays independent" |
| Every `test()` title starts with its scenario ID `XXX-000` and the ID is in `docs/test-scenarios.md`, both directions | eslint `no-restricted-syntax`; `npm run traceability` | `XXX-000 is documented but has no test` / `test XXX-000 is not in docs` |
| File budgets 120 lines (`src`), 60 (specs), 150 (`stub`); 40 per function; complexity 8; no disable directives | eslint `max-lines`, `max-lines-per-function`, `complexity`, `eslint-comments/no-use` | split the file, never raise the budget |
| One-line JSDoc on exports only; no inline comments; no TODO | eslint `jsdoc/*`, `no-inline-comments`, `no-warning-comments` | the why goes to `docs/decisions/` or the commit |
| ASCII only in everything the repo authors | hook `guard-ascii` | the line and the character; use `-` and `->` |
| Prettier formatting | `npm run format`; hook `lint-touched` after each write | diff to apply |
| No second copy of a helper, builder or setup | agent `harness-reviewer` | both locations |

## Done means

`npm run verify` exits 0, then one conventional commit per slice (`feat(api): ...`, `feat(e2e): ...`, `docs: ...`).
A commit Claude authored ends with `Co-Authored-By: Claude <noreply@anthropic.com>`.

## Never

- Edit `expected-paths.ts`, the stub or a docs row to make a test pass. Fix the test, or fix the rule and say which in the commit.
- Silence a lint rule or raise a budget. Split the file.
- Put data in a shared tenant, or read global lists of the live demo.
- Add a file that does not demonstrate a practice listed in `README.md`.

## Writing

English. ASCII only. One-line JSDoc on exported symbols, nothing inline. Tables over prose. A doc page starts with what the reader gets.

## Claude Code surface (`.claude/`)

- Hooks (`settings.json`): `guard-ascii` and `guard-boundaries` run before every Write or Edit and block with the rule they enforce; `lint-touched` runs prettier and `eslint --fix` after the write and reports what is left.
- Skills: `/add-api-scenario <GROUP> <ID> "<scenario>"`, `/add-e2e-flow <domain> "<flow>"`, `/verify`. Each executes the matching checklist of the part's `AGENTS.md`.
- Agent: `harness-reviewer`, a read-only review of the current diff against the rule files. Run it before calling work done; fix Critical and Major findings.
- Permissions allow the npm, npx and git read commands the recipes use; anything else asks.
