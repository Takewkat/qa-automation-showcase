import { type ErrorResponse, GetJobOffer, UpdateJobOffer } from "@job-offer/api";
import { ERROR_CODES, JOB_OFFER_STATUSES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { EDITABLE } from "@job-offer/oracle";

const LOCKED = JOB_OFFER_STATUSES.filter((status) => !EDITABLE.includes(status));

for (const status of EDITABLE) {
  test(
    `OFR-002 update in ${status} is allowed`,
    { tag: ["@offers", "@happy-path", "@p1"] },
    async ({ company, offers }) => {
      const offer = await offers.createIn(status);
      const renamed = await new UpdateJobOffer(company).update(offer.id, { title: "Renamed" });
      expect(renamed.title).toBe("Renamed");
    },
  );
}

for (const status of LOCKED) {
  test(
    `OFR-002 update in ${status} is refused and changes nothing`,
    { tag: ["@offers", "@error-case", "@p1"] },
    async ({ company, offers }) => {
      const offer = await offers.createIn(status);
      const error = await new UpdateJobOffer(company).update<ErrorResponse>(
        offer.id,
        { title: "Renamed" },
        409,
      );
      expect(error).toMatchObject({
        code: ERROR_CODES.invalidState,
        details: { currentStatus: status, allowedStatuses: EDITABLE },
      });
      const untouched = await new GetJobOffer(company).get(offer.id);
      expect(untouched.title).toBe(offer.title);
    },
  );
}
