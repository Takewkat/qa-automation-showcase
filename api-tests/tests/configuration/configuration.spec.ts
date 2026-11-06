import {
  type ErrorResponse,
  GetCompanyConfiguration,
  TransitionJobOffer,
  UpdateCompanyConfiguration,
  type UpdateCompanyConfigurationRequest,
} from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { ALL_FLAGS, NO_FLAGS } from "@job-offer/oracle";
import { malformed } from "@job-offer/test-data/job-offers";

test(
  "CFG-001 a fresh company has every flag off; an update is echoed and read back",
  { tag: ["@configuration", "@happy-path", "@p2"] },
  async ({ company }) => {
    const configuration = new GetCompanyConfiguration(company);
    const defaults = await configuration.get();
    expect(defaults).toMatchObject({ companyId: company.id, ...NO_FLAGS });
    const updated = await new UpdateCompanyConfiguration(company).update(ALL_FLAGS);
    expect(updated).toMatchObject(ALL_FLAGS);
    const readBack = await configuration.get();
    expect(readBack).toEqual(updated);
    expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(defaults.updatedAt));
  },
);

test(
  "CFG-002 flags are snapshotted on the offer at creation",
  { tag: ["@configuration", "@happy-path", "@p1"] },
  async ({ company, configure, offers }) => {
    const before = await offers.create();
    await configure({ approvalRequired: true });
    const after = await offers.create();
    const transition = new TransitionJobOffer(company);
    const submittedBefore = await transition.transition(before.id, "submit");
    expect(submittedBefore.status).toBe("PUBLISHED");
    const submittedAfter = await transition.transition(after.id, "submit");
    expect(submittedAfter.status).toBe("TO_APPROVE");
  },
);

test(
  "CFG-003 a flag that is not a boolean is a bad request and changes nothing",
  { tag: ["@configuration", "@validation-error", "@p3"] },
  async ({ company }) => {
    const body = malformed<UpdateCompanyConfigurationRequest>({ approvalRequired: "yes" });
    await new UpdateCompanyConfiguration(company).update<ErrorResponse>(body, company.id, 400);
    const untouched = await new GetCompanyConfiguration(company).get();
    expect(untouched).toMatchObject(NO_FLAGS);
  },
);
