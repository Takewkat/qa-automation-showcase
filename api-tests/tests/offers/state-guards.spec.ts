import { DELETABLE, EDITABLE, STATUSES } from "@api/expected-paths";
import { expect, test } from "@api/fixtures";

const LOCKED = STATUSES.filter((status) => !EDITABLE.includes(status));
const KEPT = STATUSES.filter((status) => !DELETABLE.includes(status));

for (const status of EDITABLE) {
  test(`OFR-002 update in ${status} is allowed`, async ({ api, offers }) => {
    const offer = await offers.createIn(status);
    expect((await api.updateJobOffer(offer.id, { title: "Renamed" })).title).toBe("Renamed");
  });
}

for (const status of LOCKED) {
  test(`OFR-002 update in ${status} is refused and changes nothing`, async ({ api, offers }) => {
    const offer = await offers.createIn(status);
    const error = await api.updateJobOffer(offer.id, { title: "Renamed" }, { expect: 409 });
    expect(error).toMatchObject({
      code: "INVALID_STATE",
      details: { currentStatus: status, allowedStatuses: EDITABLE },
    });
    expect((await api.getJobOffer(offer.id)).title).toBe(offer.title);
  });
}

test("OFR-003 delete in DRAFT removes the offer", { tag: "@smoke" }, async ({ api, offers }) => {
  const offer = await offers.create();
  await api.deleteJobOffer(offer.id);
  await api.getJobOffer(offer.id, { expect: 404 });
});

for (const status of KEPT) {
  test(`OFR-003 delete in ${status} is refused and keeps the offer`, async ({ api, offers }) => {
    const offer = await offers.createIn(status);
    const error = await api.deleteJobOffer(offer.id, { expect: 409 });
    expect(error).toMatchObject({ code: "INVALID_STATE", details: { allowedStatuses: DELETABLE } });
    expect((await api.getJobOffer(offer.id)).status).toBe(status);
  });
}
