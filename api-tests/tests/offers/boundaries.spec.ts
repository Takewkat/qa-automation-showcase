import { expect, test } from "@job-offer/fixtures/fixtures";
import { compensation, completeOffer, salary } from "@job-offer/test-data/job-offers";

/** Each row: a body on the edge of a rule the spec states, accepted as sent. */
const ACCEPTED = [
  { name: "a 200-char title", body: completeOffer({ title: "a".repeat(200) }) },
  {
    name: "a zero salary",
    body: completeOffer({ compensation: compensation(salary({ amount: 0 })) }),
  },
];

for (const row of ACCEPTED) {
  test(
    `VAL-003 ${row.name} is accepted`,
    { tag: ["@offers", "@happy-path"] },
    async ({ offers }) => {
      const offer = await offers.create(row.body);
      expect(offer).toMatchObject({
        title: row.body.title,
        compensation: row.body.compensation,
        isComplete: true,
      });
    },
  );
}
