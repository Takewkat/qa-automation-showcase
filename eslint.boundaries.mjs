/** Layer boundaries: a folder that must not import from another one, with the reason. */
const noImports = (files, ...patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const ORACLE = "the oracle stays independent";
const FACTORIES = "Random data comes from src/test-data/factories.ts";
const SHARED = ["@shared/*", "**/shared/**"];

/** The import direction of the repo, one entry per folder that must not reach another; mirrored in .claude/hooks/guard-boundaries.mjs. */
export const BOUNDARIES = [
  noImports(["e2e-tests/tests/**/*.ts"], {
    group: ["**/selectors/**", "**/pages/**", "**/api/**", ...SHARED],
    message: "Specs import fixtures and test-data only; the rest is reached through fixtures",
  }),
  noImports(
    ["api-tests/tests/**/*.ts", "api-tests/src/**/*.ts"],
    { group: ["**/stub/**"], message: `Tests and src never import stub/: ${ORACLE}` },
    { group: ["node:crypto", "crypto"], message: FACTORIES },
  ),
  noImports(["api-tests/tests/**/*.ts"], {
    group: SHARED,
    message: "Specs reach shared/ through endpoint classes and fixtures",
  }),
  noImports(["api-tests/stub/**/*.ts"], {
    group: ["@job-offer/*", "**/src/**", ...SHARED],
    message: `stub/ never imports the suite nor shared/: ${ORACLE}`,
  }),
  noImports(["api-tests/stub/domain/**/*.ts"], {
    group: ["**/http/**", "**/store/**"],
    message: "stub/domain/ imports neither http/ nor store/: they depend on it",
  }),
  noImports(["api-tests/stub/store/**/*.ts"], {
    group: ["**/http/**"],
    message: "stub/store/ never imports http/",
  }),
  noImports(["shared/**/*.ts"], {
    group: ["@job-offer/*", "@e2e/*", "**/api-tests/**", "**/e2e-tests/**", "**/stub/**"],
    message: "shared/ imports no part: both parts extend it",
  }),
];
