import { randomUUID } from "node:crypto";

import { test as base, type TestInfo } from "@playwright/test";

import { JobOfferApi } from "@api/client";
import type { Flags } from "@api/expected-paths";
import { Offers, configure } from "@api/workflow";

/** What a spec can ask for. */
export type Fixtures = {
  api: JobOfferApi;
  companyId: string;
  otherApi: JobOfferApi;
  anonApi: JobOfferApi;
  badHeaderApi: JobOfferApi;
  offers: Offers;
  otherOffers: Offers;
  configure: (flags: Partial<Flags>) => Promise<unknown>;
};

/** Hands the factory to the test, then removes what it created; leftovers go to the report. */
const withTeardown = async (offers: Offers, use: (o: Offers) => Promise<void>, info: TestInfo) => {
  await use(offers);
  const leftovers = await offers.teardown();
  if (leftovers.length) await info.attach("cleanup", { body: leftovers.join("\n") });
};

/** Every test runs as a fresh company; a second company and two bad callers are one fixture away. */
export const test = base.extend<Fixtures>({
  api: ({ request }, use) => use(new JobOfferApi(request, randomUUID())),
  companyId: ({ api }, use) => use(api.companyId as string),
  otherApi: ({ request }, use) => use(new JobOfferApi(request, randomUUID())),
  anonApi: ({ request }, use) => use(new JobOfferApi(request)),
  badHeaderApi: ({ request }, use) => use(new JobOfferApi(request, "not-a-uuid")),
  offers: ({ api }, use, info) => withTeardown(new Offers(api), use, info),
  otherOffers: ({ otherApi }, use, info) => withTeardown(new Offers(otherApi), use, info),
  configure: ({ api }, use) => use((flags) => configure(api, flags)),
});

export { expect } from "@playwright/test";
