import type { APIRequestContext, Fixtures, TestInfo } from "@playwright/test";

import type { Company, CompanyConfiguration } from "@job-offer/api";
import type { WorkflowFlags } from "@job-offer/enum/job-offer.enum";
import { generateCompanyId } from "@job-offer/test-data/factories";
import { configure } from "@job-offer/utils/workflow";

import { OffersFactory } from "./offers.factory";

/** What a spec can ask for: companies to act as, offer factories, the configuration switch. */
export type JobOffersFixtures = {
  company: Company;
  otherCompany: Company;
  anonymous: Company;
  malformedHeader: Company;
  offers: OffersFactory;
  otherOffers: OffersFactory;
  configure: (flags: Partial<WorkflowFlags>) => Promise<CompanyConfiguration>;
};

/** Hands the factory to the test, then cleans up: what was kept goes to the report, what failed to stderr. */
const withCleanup = async (
  factory: OffersFactory,
  use: (f: OffersFactory) => Promise<void>,
  info: TestInfo,
) => {
  await use(factory);
  const { kept, failed } = await factory.teardown();
  if (kept.length) await info.attach("cleanup", { body: kept.join("\n") });
  if (failed.length) console.warn(`[cleanup] ${info.title}\n${failed.join("\n")}`);
};

/** Every test runs as a fresh company; a second company and two bad callers are one fixture away. */
export const jobOffersFixtures: Fixtures<
  JobOffersFixtures,
  object,
  { request: APIRequestContext }
> = {
  company: ({ request }, use) => use({ request, id: generateCompanyId() }),
  otherCompany: ({ request }, use) => use({ request, id: generateCompanyId() }),
  anonymous: ({ request }, use) => use({ request, id: "" }),
  malformedHeader: ({ request }, use) => use({ request, id: "not-a-uuid" }),
  offers: ({ company }, use, info) => withCleanup(new OffersFactory(company), use, info),
  otherOffers: ({ otherCompany }, use, info) =>
    withCleanup(new OffersFactory(otherCompany), use, info),
  configure: ({ company }, use) => use((flags) => configure(company, flags)),
};
