import type { JobOfferApi } from "@api/client";
import { NO_FLAGS } from "@api/expected-paths";
import { expect, test } from "@api/fixtures";

/** Each row: B on A's configuration. */
const AS_OTHER: { name: string; call: (b: JobOfferApi, id: string) => Promise<unknown> }[] = [
  { name: "read", call: (b, id) => b.getCompanyConfiguration(id, { expect: 403 }) },
  {
    name: "update",
    call: (b, id) =>
      b.updateCompanyConfiguration({ ...NO_FLAGS, approvalRequired: true }, id, { expect: 403 }),
  },
];

for (const row of AS_OTHER) {
  test(`TEN-005 ${row.name} of another company's configuration is forbidden`, async ({
    api,
    companyId,
    otherApi,
  }) => {
    await row.call(otherApi, companyId);
    expect(await api.getCompanyConfiguration()).toMatchObject(NO_FLAGS);
  });
}
