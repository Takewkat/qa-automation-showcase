# 0004 Live demo, data seeded through the API

Context: Part 2 may run on the shared public demo or on a local clone. The demo is shared, slow at times and full of other people's data.

Decision: the live demo is the default target. Users are registered through the API, the session is injected into `localStorage` (the shape the frontend reads), articles are seeded through the API when the flow is not about creating them. Every title and comment carries a run id; assertions are scoped to it. Articles are deleted through the API in fixture teardown; users stay, the API has no delete.

Consequences: zero setup for a reviewer. If the demo is down, `BASE_URL` points at a local Conduit; the README gives the steps.
