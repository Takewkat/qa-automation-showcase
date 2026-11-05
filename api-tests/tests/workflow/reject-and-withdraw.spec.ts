import { STATUSES, VALID_ACTIONS } from "@api/expected-paths";
import { expect, test } from "@api/fixtures";

const REASON = { reason: "Budget constraints", comment: "Revise the salary range" };

test("WFL-005 reject needs a reason and sends the offer back to DRAFT", async ({ api, offers }) => {
  const offer = await offers.createIn("TO_APPROVE");
  const { transitions } = await api.getAvailableTransitions(offer.id);
  expect(transitions).toContainEqual({
    action: "reject",
    targetStatus: "DRAFT",
    requiresReason: true,
  });
  const error = await api.transitionJobOffer(offer.id, "reject", {}, { expect: 422 });
  expect(error).toMatchObject({ code: "VALIDATION_ERROR", details: { missingFields: ["reason"] } });
  expect((await api.getJobOffer(offer.id)).status).toBe("TO_APPROVE");
  const rejected = await api.transitionJobOffer(offer.id, "reject", REASON);
  expect(rejected).toMatchObject({ status: "DRAFT", availableTransitions: ["submit"] });
  expect((await api.getJobOfferHistory(offer.id)).at(-1)).toMatchObject({
    action: "reject",
    ...REASON,
  });
});

for (const status of STATUSES.filter((s) => VALID_ACTIONS[s].includes("withdraw"))) {
  test(`WFL-006 withdraw from ${status} returns to DRAFT and reopens editing`, async ({
    api,
    offers,
  }) => {
    const offer = await offers.createIn(status);
    expect((await api.transitionJobOffer(offer.id, "withdraw")).status).toBe("DRAFT");
    expect((await api.updateJobOffer(offer.id, { title: "Edited" })).title).toBe("Edited");
  });
}
