import { spawnSync } from "node:child_process";

import { block, readInput } from "./_input.mjs";

const { path } = readInput();
if (!/\.(ts|mjs)$/.test(path)) process.exit(0);

/** Runs a repo tool through npx from the project root and returns its result. */
const run = (tool, args) =>
  spawnSync("npx", [tool, ...args], { cwd: process.env.CLAUDE_PROJECT_DIR, encoding: "utf8" });

run("prettier", ["--write", "--log-level", "warn", path]);
const lint = run("eslint", ["--fix", "--no-warn-ignored", path]);
if (lint.status === 0) process.exit(0);
block(`lint-touched: eslint still reports errors in ${path}\n${lint.stdout}${lint.stderr}`);
