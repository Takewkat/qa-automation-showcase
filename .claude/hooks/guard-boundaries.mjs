import { block, readInput } from "./_input.mjs";

/** Layer boundaries, mirrored from eslint.config.mjs so the agent is stopped before the file is written. */
const RULES = [
  {
    when: /e2e-tests\/tests\/.*\.ts$/,
    deny: /\bpage\.|\bgetBy[A-Z]\w*\(|\.locator\(|from ["'][^"']*\/(selectors|pages|api)\//,
    rule: "specs drive page objects from fixtures; selectors, pages and api live under src/ and are reached through fixtures",
  },
  {
    when: /api-tests\/tests\/.*\.ts$/,
    deny: /\brequest\.|\.json\(\)|\.status\(\)|\.request\(|\.getResponseBody\(|from ["'][^"']*stub\/|from ["']node:crypto["']/,
    rule: "specs call endpoint methods (create, get, ...), which check status and schema; never request, .json(), .status(), .request(), .getResponseBody(), the stub or node:crypto (random data comes from src/test-data/factories.ts)",
  },
  {
    when: /api-tests\/src\/.*\.ts$/,
    deny: /from ["'][^"']*stub\/|from ["']node:crypto["']/,
    rule: "src/ never imports stub/ (independent oracle) nor node:crypto (random data comes from src/test-data/factories.ts)",
  },
  {
    when: /api-tests\/stub\/.*\.ts$/,
    deny: /from ["'](@job-offer\/|[^"']*\/src\/)/,
    rule: "stub/ never imports the suite",
  },
  {
    when: /api-tests\/stub\/domain\/.*\.ts$/,
    deny: /from ["']\.\.\/(http|store)\//,
    rule: "stub/domain/ imports neither http/ nor store/: they depend on it",
  },
  {
    when: /api-tests\/stub\/store\/.*\.ts$/,
    deny: /from ["']\.\.\/http\//,
    rule: "stub/store/ never imports http/",
  },
];

const { path, text } = readInput();
const hit = RULES.find((candidate) => candidate.when.test(path) && candidate.deny.test(text));
if (!hit) process.exit(0);
block(
  `guard-boundaries: ${path} breaks a layer rule: ${hit.rule} (AGENTS.md, "Rules, each with its check").`,
);
