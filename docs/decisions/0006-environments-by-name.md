# 0006 Environments by name, not by URL

Context: a suite that only knows one `BASE_URL` scales to one target. Real projects run the same tests on local, integration, staging and a demo, and must never point them at production.

Decision: `config/environments.ts` holds one row per environment with the targets it has (`api`, `web`); the api rows mirror the `servers` list of the OpenAPI document. `TEST_ENV` picks the row, each part has its own fallback (`local` for the API suite, `demo` for E2E), `API_BASE_URL` and `WEB_BASE_URL` override one target for an ad-hoc run, a root `.env` is read without a dependency. An unknown name fails with the supported list; `production` is listed, so the refusal is explicit, and refused.

Consequences: `TEST_ENV=staging npm run test:api` is the whole switch; the stub starts only for `local`. Adding an environment is one row. The shape is the one used on the author's previous projects (an environment-to-URL table with a production guard).
