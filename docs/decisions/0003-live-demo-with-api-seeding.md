# 0003 Live demo, data seeded through the API

Context: Part 2 runs on the shared public demo or on a local clone. The demo is shared, slow at times and full of other people's data.

Decision: the demo is the default target. Users are registered through the API and the session injected into `localStorage`; articles are seeded through the API unless the flow creates them; every title carries a run id and assertions are scoped to it; articles are deleted in fixture teardown, users stay (the API has no delete). The session is one user per run, registered by a setup project and cached per environment, because the demo limits register and login to 5 calls per hour per IP; only AUTH-001 logs in through the UI. Every browser context is budgeted (`src/utils/requests.ts`): the document and the built bundles are fetched once per worker and served from memory afterwards, the favicon and the tag cloud never leave the browser, and what still reached the server is attached to every test as `server requests`, a 429 as an annotation; no retry on the demo.

Consequences: zero setup for a reviewer. Demo down: `TEST_ENV=local` or `WEB_BASE_URL` points at a Conduit run from its README.
