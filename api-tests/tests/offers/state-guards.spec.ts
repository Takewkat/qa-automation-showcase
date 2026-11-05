import { DeleteJobOffer, type ErrorResponse, GetJobOffer, UpdateJobOffer } from "@job-offer/api";
import { ERROR_CODES, JOB_OFFER_STATUSES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { DELETABLE, EDITABLE } from "@job-offer/oracle";

const LOCKED = JOB_OFFER_STATUSES.filter((status) => !EDITABLE.includes(status));
const KEPT = JOB_OFFER_STATUSES.filter((status) => !DELETABLE.includes(status));

for (const status of EDITABLE) {
  test(`OFR-002 update in ${status} is allowed`, async ({ company, offers }) => {
    const offer = await offers.createIn(status);
    const renamed = await new UpdateJobOffer(company).update(offer.id, { title: "Renamed" });
    expect(renamed.title).toBe("Renamed");
  });
}

for (const status of LOCKED) {
  test(`OFR-002 update in ${status} is refused and changes nothing`, async ({
    company,
    offers,
  }) => {
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
  });
}

test(
  "OFR-003 delete in DRAFT removes the offer",
  { tag: "@smoke" },
  async ({ company, offers }) => {
    const offer = await offers.create();
    await new DeleteJobOffer(company).delete(offer.id);
    await new GetJobOffer(company).get(offer.id, 404);
  },
);

for (const status of KEPT) {
  test(`OFR-003 delete in ${status} is refused and keeps the offer`, async ({
    company,
    offers,
  }) => {
    const offer = await offers.createIn(status);
    const error = await new DeleteJobOffer(company).delete<ErrorResponse>(offer.id, 409);
    expect(error).toMatchObject({
      code: ERROR_CODES.invalidState,
      details: { allowedStatuses: DELETABLE },
    });
    const kept = await new GetJobOffer(company).get(offer.id);
    expect(kept.status).toBe(status);
  });
}
