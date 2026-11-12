/** Locator rules of e2e-tests (ADR 0008): selectors files hold the locators, page objects only act on them. */
const restrict = (files, message, ...selectors) => ({
  files,
  rules: {
    "no-restricted-syntax": ["error", ...selectors.map((selector) => ({ selector, message }))],
  },
});

/** The page calls that take a selector string: a page object acts on the locators of the selectors file instead. */
const SELECTOR_STRING =
  "/^(fill|click|dblclick|check|uncheck|press|type|hover|focus|selectOption|setInputFiles|textContent|innerText|inputValue|isVisible|isHidden|waitForSelector|frameLocator|\\$|\\$\\$)$/";
/** The calls that build or narrow a locator, on a page or on a locator. */
const LOCATOR_BUILDING = "/^(locator|getBy[A-Za-z]+|first|last|nth)$/";
/** The one CSS a selectors file may hold: a single class, the scope of a container the app gives no role. */
const ONE_CLASS = "/^\\.[a-z][\\w-]*$/";

/** One entry per folder, the pages one merged with its no-magic-numbers entry: different rules add up. */
export const LOCATORS = [
  restrict(
    ["e2e-tests/src/pages/**/*.ts"],
    "Pages take locators from the selectors file, never build one (AGENTS.md)",
    `CallExpression:matches([callee.object.name="page"], [callee.object.property.name="page"])[callee.property.name=${SELECTOR_STRING}]`,
    `CallExpression[callee.property.name=${LOCATOR_BUILDING}]`,
    'CallExpression[callee.property.name="filter"][arguments.0.type="ObjectExpression"]',
  ),
  restrict(
    ["e2e-tests/src/selectors/**/*.ts"],
    "CSS in a selectors file is one class scoping what has no role; find by role, placeholder or text (ADR 0008)",
    `CallExpression[callee.property.name="locator"]:not([arguments.0.value=${ONE_CLASS}])`,
    `CallExpression[callee.property.name=${SELECTOR_STRING}]`,
  ),
];
