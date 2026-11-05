import { type Company, GetCompanyConfiguration, UpdateCompanyConfiguration } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { ALL_FLAGS, NO_FLAGS } from "@job-offer/oracle";

/** Each row: B on A's configuration. */
const AS_OTHER: { name: string; call: (other: Company, companyId: string) => Promise<unknown> }[] =
  [
    {
      name: "read",
      call: (other, companyId) => new GetCompanyConfiguration(other).get(companyId, 403),
    },
    {
      name: "update",
      call: (other, companyId) =>
        new UpdateCompanyConfiguration(other).update(ALL_FLAGS, companyId, 403),
    },
  ];

for (const row of AS_OTHER) {
  test(`TEN-005 ${row.name} of another company's configuration is forbidden`, async ({
    company,
    otherCompany,
  }) => {
    await row.call(otherCompany, company.id);
    const untouched = await new GetCompanyConfiguration(company).get();
    expect(untouched).toMatchObject(NO_FLAGS);
  });
}
