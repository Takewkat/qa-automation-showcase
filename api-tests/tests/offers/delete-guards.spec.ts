import { DeleteJobOffer, type ErrorResponse, GetJobOffer } from "@job-offer/api";
import { ERROR_CODES, JOB_OFFER_STATUSES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { DELETABLE } from "@job-offer/oracle";

const KEPT = JOB_OFFER_STATUSES.filter((status) => !DELETABLE.includes(status));

test(
  "OFR-003 delete in DRAFT removes the offer",
  { tag: ["@offers", "@happy-path", "@smoke"] },
  async ({ company, offers }) => {
    const offer = await offers.create();
    await new DeleteJobOffer(company).delete(offer.id);
    await new GetJobOffer(company).get(offer.id, 404);
  },
);

for (const status of KEPT) {
  test(
    `OFR-003 delete in ${status} is refused and keeps the offer`,
    { tag: ["@offers", "@error-case"] },
    async ({ company, offers }) => {
      const offer = await offers.createIn(status);
      const error = await new DeleteJobOffer(company).delete<ErrorResponse>(offer.id, 409);
      expect(error).toMatchObject({
        code: ERROR_CODES.invalidState,
        details: { allowedStatuses: DELETABLE },
      });
      const kept = await new GetJobOffer(company).get(offer.id);
      expect(kept.status).toBe(status);
    },
  );
}
