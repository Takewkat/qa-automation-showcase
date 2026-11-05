import { block, readInput } from "./_input.mjs";

const codePoint = (char) => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;

const { path, text } = readInput();
const offending = text
  .split("\n")
  .map((line, index) => ({
    line: index + 1,
    chars: [...new Set(line.match(/[^\x20-\x7E\t]/gu) ?? [])].map(codePoint),
  }))
  .filter((hit) => hit.chars.length > 0)
  .slice(0, 3);

if (offending.length === 0) process.exit(0);
block(
  `guard-ascii: non-ASCII characters in ${path}. The repo is ASCII only (AGENTS.md): use "-" not an em dash, "->" not an arrow. ` +
    offending.map((hit) => `line ${hit.line}: ${hit.chars.join(" ")}`).join("; "),
);
