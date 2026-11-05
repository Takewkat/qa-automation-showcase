import {
  GetCompanyConfiguration,
  TransitionJobOffer,
  UpdateCompanyConfiguration,
} from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { ALL_FLAGS, NO_FLAGS } from "@job-offer/oracle";

test("CFG-001 a fresh company has every flag off; an update is echoed and read back", async ({
  company,
}) => {
  const configuration = new GetCompanyConfiguration(company);
  const defaults = await configuration.get();
  expect(defaults).toMatchObject({ companyId: company.id, ...NO_FLAGS });
  const updated = await new UpdateCompanyConfiguration(company).update(ALL_FLAGS);
  expect(updated).toMatchObject(ALL_FLAGS);
  const readBack = await configuration.get();
  expect(readBack).toEqual(updated);
  expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(defaults.updatedAt));
});

test(
  "CFG-002 flags are snapshotted on the offer at creation",
  { tag: "@smoke" },
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
