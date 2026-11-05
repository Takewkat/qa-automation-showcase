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
    deny: /\brequest\.|\.json\(\)|\.status\(\)|from ["'][^"']*stub\//,
    rule: "specs call the api fixture and read bodies through expectCall(); never request, .json(), .status() or the stub",
  },
  {
    when: /api-tests\/src\/.*\.ts$/,
    deny: /from ["'][^"']*stub\//,
    rule: "src/ never imports stub/ (independent oracle)",
  },
  {
    when: /api-tests\/stub\/.*\.ts$/,
    deny: /from ["'](@api\/|[^"']*\/src\/)/,
    rule: "stub/ never imports the suite",
  },
];

const { path, text } = readInput();
const hit = RULES.find((candidate) => candidate.when.test(path) && candidate.deny.test(text));
if (!hit) process.exit(0);
block(
  `guard-boundaries: ${path} breaks a layer rule: ${hit.rule} (AGENTS.md, "Rules, each with its check").`,
);
