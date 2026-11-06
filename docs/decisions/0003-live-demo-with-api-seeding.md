# 0003 Live demo, data seeded through the API

Context: Part 2 runs on the shared public demo or on a local clone. The demo is shared, slow at times and full of other people's data.

Decision: the demo is the default target. Users are registered through the API and the session injected into `localStorage`; articles are seeded through the API unless the flow creates them; every title carries a run id and assertions are scoped to it; articles are deleted in fixture teardown, users stay (the API has no delete).

Consequences: zero setup for a reviewer. Demo down: `TEST_ENV=local` or `WEB_BASE_URL` points at a Conduit run from its README.
