import {
  type Company,
  DeleteJobOffer,
  GetAvailableTransitions,
  GetJobOffer,
  GetJobOfferHistory,
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
  { name: "transitions", call: (other, id) => new GetAvailableTransitions(other).get(id, 404) },
  {
    name: "submit",
    call: (other, id) => new TransitionJobOffer(other).transition(id, "submit", {}, 404),
  },
  { name: "history", call: (other, id) => new GetJobOfferHistory(other).get(id, 404) },
];

for (const row of AS_OTHER) {
  test(
    `TEN-003 ${row.name} of another company's offer is not found and has no effect`,
    { tag: ["@tenancy", "@error-case", "@p1"] },
    async ({ company, offers, otherCompany }) => {
      const offer = await offers.create();
      await row.call(otherCompany, offer.id);
      const untouched = await new GetJobOffer(company).get(offer.id);
      expect(untouched).toMatchObject({ status: "DRAFT", title: offer.title });
    },
  );
}
