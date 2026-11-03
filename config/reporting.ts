import { join } from "node:path";

import type { PlaywrightTestConfig } from "@playwright/test";

/** Everything a run leaves behind sits under reports/<part>/: one place for humans, CI and the scenario report. */
export const REPORTS_ROOT = join(__dirname, "..", "reports");

export type Part = "api" | "e2e";

/** The reporter set of one part: list for the terminal, html to debug, json and junit for machines. */
export function reportsFor(part: Part): Pick<PlaywrightTestConfig, "reporter" | "outputDir"> {
  const dir = join(REPORTS_ROOT, part);
  return {
    reporter: [
      ["list"],
      ["html", { outputFolder: join(dir, "html"), open: "never" }],
      ["json", { outputFile: join(dir, "results.json") }],
      ["junit", { outputFile: join(dir, "junit.xml") }],
    ],
    outputDir: join(dir, "artifacts"),
  };
}
