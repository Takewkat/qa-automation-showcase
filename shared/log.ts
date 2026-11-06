/** The time of a line, UTC, to the millisecond. */
const stamp = (): string => new Date().toISOString().slice(11, 23);

/** One line on the console for a key moment of a test, stamped and prefixed by its scope; UI mode's Console and the HTML report show it next to the test. */
export const log = (scope: string, message: string): void =>
  console.log(`${stamp()} [${scope}] ${message}`);
