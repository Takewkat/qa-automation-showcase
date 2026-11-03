import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import playwright from "eslint-plugin-playwright";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Size budgets: a file or function past the budget is split, never silenced. */
const lines = (max) => ["error", { max, skipBlankLines: true, skipComments: true }];

/** Every test title starts with its scenario ID so docs and tests can be tied together. */
const SCENARIO_ID = "/^[A-Z]{3,4}-\\d{3} /";
const titleWithoutId = [
  `CallExpression[callee.name="test"][arguments.0.type="Literal"][arguments.0.value!=${SCENARIO_ID}]`,
  `CallExpression[callee.name="test"][arguments.0.type="TemplateLiteral"][arguments.0.quasis.0.value.raw!=${SCENARIO_ID}]`,
].map((selector) => ({
  selector,
  message: 'A test title starts with its scenario ID, for example "WFL-001 ..." (AGENTS.md)',
}));

/** Layer boundaries: a folder that must not import from another one, with the reason. */
const noImports = (files, group, message) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns: [{ group, message }] }] },
});

const ORACLE = "the oracle stays independent";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/",
      "**/test-results/",
      "**/playwright-report/",
      "**/*.example",
      "**/generated/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsdoc.configs["flat/recommended-typescript-error"],
  comments.recommended,
  prettier,
  {
    files: ["**/*.{ts,mjs}"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-inline-comments": "error",
      "no-warning-comments": "error",
      "max-lines": lines(120),
      "max-lines-per-function": lines(40),
      complexity: ["error", 8],
      "@eslint-community/eslint-comments/no-use": "error",
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
    rules: { ...playwright.configs["flat/recommended"].rules, "max-lines": lines(60) },
  },
  {
    files: ["e2e-tests/tests/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...titleWithoutId,
        {
          selector: 'MemberExpression[object.name="page"]',
          message: "Specs drive page objects from fixtures, never page directly (AGENTS.md)",
        },
      ],
    },
  },
  noImports(
    ["e2e-tests/tests/**/*.ts"],
    ["**/selectors/**", "**/pages/**", "**/api/**"],
    "Specs import fixtures and test-data only; the rest is reached through fixtures",
  ),
  {
    files: ["api-tests/tests/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...titleWithoutId,
        {
          selector: 'MemberExpression[object.name="request"]',
          message: "Specs call the api fixture (JobOfferApi), never request directly (AGENTS.md)",
        },
        {
          selector: "CallExpression[callee.property.name=/^(json|status|text)$/]",
          message: "Read responses through expectCall(), which validates the contract (AGENTS.md)",
        },
      ],
    },
  },
  noImports(
    ["api-tests/tests/**/*.ts", "api-tests/src/**/*.ts"],
    ["**/stub/**"],
    `Tests and src never import stub/: ${ORACLE}`,
  ),
  noImports(
    ["api-tests/stub/**/*.ts"],
    ["@api/*", "**/src/**"],
    `stub/ never imports the suite: ${ORACLE}`,
  ),
  {
    files: ["e2e-tests/src/pages/**/*.ts"],
    rules: {
      "no-magic-numbers": [
        "error",
        { ignore: [0, 1, -1], enforceConst: true, detectObjects: false },
      ],
    },
  },
);
