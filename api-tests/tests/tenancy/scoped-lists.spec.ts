import { ListJobOffers } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";

test(
  "TEN-004 lists are scoped to the caller's company",
  { tag: ["@tenancy", "@happy-path", "@p1"] },
  async ({ company, offers, otherCompany, otherOffers }) => {
    const first = await offers.create();
    const second = await offers.create();
    await otherOffers.create();
    const mine = await new ListJobOffers(company).list();
    expect(mine.totalElements).toBe(2);
    expect(mine.content.map((item) => item.id).sort()).toEqual([first.id, second.id].sort());
    const theirs = await new ListJobOffers(otherCompany).list();
    expect(theirs.totalElements).toBe(1);
    const drafts = await new ListJobOffers(company).list({ status: "DRAFT" });
    expect(drafts.totalElements).toBe(2);
  },
);
