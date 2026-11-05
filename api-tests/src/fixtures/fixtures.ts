import { test as base } from "@playwright/test";

import { type JobOffersFixtures, jobOffersFixtures } from "./job-offers.fixtures";

/** The test every spec imports; chain the next domain's fixtures here. */
export const test = base.extend<JobOffersFixtures>(jobOffersFixtures);
export type Fixtures = JobOffersFixtures;
export { expect } from "@playwright/test";
