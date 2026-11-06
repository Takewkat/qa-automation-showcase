/** Layer boundaries: a folder that must not import from another one, with the reason. One entry per folder: a later entry for the same files replaces the earlier one, it does not add to it. */
const noImports = (files, ...patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const ORACLE = "the oracle stays independent";
const SHARED = ["@shared/*", "**/shared/**"];

const STUB = { group: ["**/stub/**"], message: `Tests and src never import stub/: ${ORACLE}` };
const CRYPTO = {
  group: ["node:crypto", "crypto"],
  message: "Random data comes from src/test-data/factories.ts",
};
const SPECS_SHARED = {
  group: SHARED,
  message: "Specs reach shared/ through endpoint classes and fixtures",
};
const SUITE = {
  group: ["@job-offer/*", "**/src/**", ...SHARED],
  message: `stub/ never imports the suite nor shared/: ${ORACLE}`,
};
const DOMAIN = {
  group: ["**/http/**", "**/store/**"],
  message: "stub/domain/ imports neither http/ nor store/: they depend on it",
};
const STORE = { group: ["**/http/**"], message: "stub/store/ never imports http/" };

/** The import direction of the repo, every pattern a folder must refuse in its one entry; mirrored in .claude/hooks/guard-boundaries.mjs. */
export const BOUNDARIES = [
  noImports(["e2e-tests/tests/**/*.ts"], {
    group: ["**/selectors/**", "**/pages/**", "**/api/**", ...SHARED],
    message: "Specs import fixtures and test-data only; the rest is reached through fixtures",
  }),
  noImports(["api-tests/src/**/*.ts"], STUB, CRYPTO),
  noImports(["api-tests/tests/**/*.ts"], STUB, CRYPTO, SPECS_SHARED),
  noImports(["api-tests/stub/**/*.ts"], SUITE),
  noImports(["api-tests/stub/domain/**/*.ts"], SUITE, DOMAIN),
  noImports(["api-tests/stub/store/**/*.ts"], SUITE, STORE),
  noImports(["shared/**/*.ts"], {
    group: ["@job-offer/*", "@e2e/*", "**/api-tests/**", "**/e2e-tests/**", "**/stub/**"],
    message: "shared/ imports no part: both parts extend it",
  }),
];
