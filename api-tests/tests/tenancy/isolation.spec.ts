import {
  type Company,
  DeleteJobOffer,
  GetJobOffer,
  GetJobOfferHistory,
  ListJobOffers,
  TransitionJobOffer,
  UpdateJobOffer,
} from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";

/** Every mutation and read of A's offer, tried as B. */
const AS_OTHER: { name: string; call: (other: Company, id: string) => Promise<unknown> }[] = [
  {
    name: "update",
    call: (other, id) => new UpdateJobOffer(other).update(id, { title: "hijacked" }, 404),
  },
  { name: "delete", call: (other, id) => new DeleteJobOffer(other).delete(id, 404) },
  {
    name: "submit",
    call: (other, id) => new TransitionJobOffer(other).transition(id, "submit", {}, 404),
  },
  { name: "history", call: (other, id) => new GetJobOfferHistory(other).get(id, 404) },
];

for (const row of AS_OTHER) {
  test(`TEN-003 ${row.name} of another company's offer is not found and has no effect`, async ({
    company,
    offers,
    otherCompany,
  }) => {
    const offer = await offers.create();
    await row.call(otherCompany, offer.id);
    const untouched = await new GetJobOffer(company).get(offer.id);
    expect(untouched).toMatchObject({ status: "DRAFT", title: offer.title });
  });
}

test(
  "TEN-004 lists are scoped to the caller's company",
  { tag: "@smoke" },
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
