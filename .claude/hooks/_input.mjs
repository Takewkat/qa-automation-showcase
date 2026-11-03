import { readFileSync } from "node:fs";

/** Reads the Claude Code hook payload from stdin: the file path and the text being written. */
export function readInput() {
  const payload = JSON.parse(readFileSync(0, "utf8"));
  const input = payload.tool_input ?? {};
  return { path: input.file_path ?? "", text: input.content ?? input.new_string ?? "" };
}

/** Prints a blocking message for Claude and exits with the hook's blocking code. */
export function block(message) {
  console.error(message);
  process.exit(2);
}
