import type { TestInfo } from "@playwright/test";

/** What a teardown leaves behind, by design (kept) or by failure (failed). */
export type Leftovers = { kept: string[]; failed: string[] };

/** What was kept goes to the report as an attachment named cleanup, what failed to stderr; nothing is thrown. */
export async function reportLeftovers(info: TestInfo, { kept, failed }: Leftovers): Promise<void> {
  if (kept.length) await info.attach("cleanup", { body: kept.join("\n") });
  if (failed.length) console.warn(`[cleanup] ${info.title}\n${failed.join("\n")}`);
}

/** Hands a factory to the test, then reports what its teardown left; the body of every factory fixture. */
export async function withCleanup<F extends { teardown(): Promise<Leftovers> }>(
  factory: F,
  use: (factory: F) => Promise<void>,
  info: TestInfo,
): Promise<void> {
  await use(factory);
  await reportLeftovers(info, await factory.teardown());
}
