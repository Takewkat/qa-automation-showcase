/** One line on the console for a key moment of a test, prefixed by its scope; UI mode's Console and the HTML report show it next to the test. */
export const log = (scope: string, message: string): void => console.log(`[${scope}] ${message}`);
