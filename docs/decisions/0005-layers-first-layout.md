# 0005 Layers on top, domains inside

Context: the brief values a clear separation between selectors, actions and test logic, and a structure a team extends without guidance.

Decision: `src/selectors/`, `src/pages/`, `src/fixtures/`, `src/api/` at the top level, a file or folder per domain inside each, `tests/<domain>/` for specs. No Gherkin layer.

Consequences: the separation is visible from the tree, and the import direction is lintable. Adding a domain is one file per layer plus one line in `fixtures/test.ts`. `/add-e2e-flow` scripts it. A feature-sliced layout (one folder per domain with all layers inside) was the alternative. It hides the layers from the root.
