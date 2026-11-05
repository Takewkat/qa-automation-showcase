import { NO_FLAGS, flags } from "@api/expected-paths";
import { expect, test } from "@api/fixtures";

test("CFG-001 a fresh company has every flag off; an update is echoed and read back", async ({
  api,
  companyId,
}) => {
  const defaults = await api.getCompanyConfiguration();
  expect(defaults).toMatchObject({ companyId, ...NO_FLAGS });
  const updated = await api.updateCompanyConfiguration(flags([true, true, true]));
  expect(updated).toMatchObject(flags([true, true, true]));
  expect(await api.getCompanyConfiguration()).toEqual(updated);
  expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(defaults.updatedAt));
});

test(
  "CFG-002 flags are snapshotted on the offer at creation",
  { tag: "@smoke" },
  async ({ api, configure, offers }) => {
    const before = await offers.create();
    await configure({ approvalRequired: true });
    const after = await offers.create();
    expect((await api.transitionJobOffer(before.id, "submit")).status).toBe("PUBLISHED");
    expect((await api.transitionJobOffer(after.id, "submit")).status).toBe("TO_APPROVE");
  },
);
