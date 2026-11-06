import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import playwright from "eslint-plugin-playwright";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Size budgets: a file or function past the budget is split, never silenced. */
const lines = (max) => ["error", { max, skipBlankLines: true, skipComments: true }];

/** Every test title is a literal that starts with its scenario ID so docs and tests can be tied together. */
const SCENARIO_ID = "/^[A-Z]{3,4}-\\d{3} /";
const TEST_CALL =
  'CallExpression:matches([callee.name="test"], [callee.object.name="test"][callee.property.name=/^(skip|fixme|only|fail)$/])';
const titleWithoutId = [
  `${TEST_CALL}[arguments.0.value=type(string)][arguments.0.value!=${SCENARIO_ID}]`,
  `${TEST_CALL}[arguments.0.type="TemplateLiteral"][arguments.0.quasis.0.value.raw!=${SCENARIO_ID}]`,
].map((selector) => ({
  selector,
  message: 'A test title starts with its scenario ID, for example "WFL-001 ..." (AGENTS.md)',
}));
const titleNotLiteral = {
  selector:
    'CallExpression[callee.name="test"][arguments.0.value!=type(string)][arguments.0.type!="TemplateLiteral"]',
  message: "A test title is a string literal that starts with its scenario ID (AGENTS.md)",
};

/** Spec boundaries: the title rules plus the calls a spec folder must not make, with the reason. */
const noSyntax = (files, ...rules) => ({
  files,
  rules: { "no-restricted-syntax": ["error", ...titleWithoutId, titleNotLiteral, ...rules] },
});

/** Layer boundaries: a folder that must not import from another one, with the reason. */
const noImports = (files, ...patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const ORACLE = "the oracle stays independent";
const FACTORIES = "Random data comes from src/test-data/factories.ts";

export default tseslint.config(
  { ignores: ["**/node_modules/", "**/reports/", "**/*.example", "**/generated/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsdoc.configs["flat/recommended-typescript-error"],
  prettier,
  {
    files: ["**/*.{ts,mts,mjs}"],
    languageOptions: { globals: globals.node },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    rules: {
      "no-inline-comments": "error",
      "no-warning-comments": "error",
      "max-lines": lines(120),
      "max-lines-per-function": lines(40),
      complexity: ["error", 8],
      "jsdoc/require-jsdoc": ["error", { publicOnly: true }],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/multiline-blocks": [
        "error",
        { noMultilineBlocks: true, minimumLengthForMultiline: 100 },
      ],
    },
  },
  { files: ["**/stub/**/*.ts"], rules: { "max-lines": lines(150) } },
  {
    files: ["**/tests/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "max-lines": lines(60),
      "playwright/expect-expect": ["error", { assertFunctionPatterns: ["^assert"] }],
      "playwright/no-skipped-test": ["error", { allowConditional: true }],
    },
  },
  { files: ["api-tests/tests/**/*.ts"], rules: { "playwright/expect-expect": "off" } },
  noSyntax(
    ["e2e-tests/tests/**/*.ts"],
    {
      selector: 'MemberExpression[object.name="page"]',
      message: "Specs drive page objects from fixtures, never page directly (AGENTS.md)",
    },
    {
      selector:
        "CallExpression[callee.property.name=/^(locator|frameLocator|getByRole|getByText|getByLabel|getByPlaceholder|getByTestId|getByTitle|getByAltText)$/]",
      message: "Specs call page-object methods from fixtures, never a locator (AGENTS.md)",
    },
  ),
  noImports(["e2e-tests/tests/**/*.ts"], {
    group: ["**/selectors/**", "**/pages/**", "**/api/**"],
    message: "Specs import fixtures and test-data only; the rest is reached through fixtures",
  }),
  noSyntax(
    ["api-tests/tests/**/*.ts"],
    {
      selector: 'MemberExpression[object.name="request"]',
      message: "Specs never touch request; endpoint classes send it (AGENTS.md)",
    },
    {
      selector:
        "CallExpression[callee.property.name=/^(json|status|text|request|getResponseBody)$/]",
      message: "Specs call endpoint methods, never the request primitives (AGENTS.md)",
    },
  ),
  noImports(
    ["api-tests/tests/**/*.ts", "api-tests/src/**/*.ts"],
    { group: ["**/stub/**"], message: `Tests and src never import stub/: ${ORACLE}` },
    { group: ["node:crypto", "crypto"], message: FACTORIES },
  ),
  noImports(["api-tests/stub/**/*.ts"], {
    group: ["@job-offer/*", "**/src/**"],
    message: `stub/ never imports the suite: ${ORACLE}`,
  }),
  noImports(["api-tests/stub/domain/**/*.ts"], {
    group: ["**/http/**", "**/store/**"],
    message: "stub/domain/ imports neither http/ nor store/: they depend on it",
  }),
  noImports(["api-tests/stub/store/**/*.ts"], {
    group: ["**/http/**"],
    message: "stub/store/ never imports http/",
  }),
  {
    files: ["e2e-tests/src/pages/**/*.ts"],
    rules: { "no-magic-numbers": ["error", { ignore: [0, 1, -1], enforceConst: true }] },
  },
);
