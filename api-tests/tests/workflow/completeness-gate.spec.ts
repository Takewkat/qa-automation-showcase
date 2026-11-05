import { expect, test } from "@api/fixtures";
import { incompleteOffer, salary } from "@api/payloads";

test("WFL-003 submit of an incomplete offer is refused and stays in DRAFT", async ({
  api,
  offers,
}) => {
  const offer = await offers.create(incompleteOffer());
  expect(offer.isComplete).toBe(false);
  const error = await api.transitionJobOffer(offer.id, "submit", {}, { expect: 422 });
  expect(error).toMatchObject({ code: "INCOMPLETE_OFFER" });
  expect(error.details?.missingFields).toContain("compensation.salaryEntries");
  expect((await api.getJobOffer(offer.id)).status).toBe("DRAFT");
});

test("WFL-004 partial save holds an incomplete offer in TO_FINALIZE until it is complete", async ({
  api,
  configure,
  offers,
}) => {
  await configure({ partialSaveEnabled: true });
  const offer = await offers.create(incompleteOffer());
  expect((await api.transitionJobOffer(offer.id, "submit")).status).toBe("TO_FINALIZE");
  const gate = await api.transitionJobOffer(offer.id, "finalize", {}, { expect: 422 });
  expect(gate).toMatchObject({ code: "INCOMPLETE_OFFER" });
  const completed = await api.updateJobOffer(offer.id, {
    compensation: { salaryEntries: [salary()] },
  });
  expect(completed.isComplete).toBe(true);
  expect((await api.transitionJobOffer(offer.id, "finalize")).status).toBe("PUBLISHED");
});
