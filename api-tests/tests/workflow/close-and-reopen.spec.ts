import { expect, test } from "@api/fixtures";

test("WFL-007 close then reopen", async ({ api, offers }) => {
  const offer = await offers.createIn("PUBLISHED");
  const closed = await api.transitionJobOffer(offer.id, "close");
  expect(closed).toMatchObject({ status: "CLOSED", availableTransitions: ["reopen"] });
  expect(closed.closedAt).not.toBeNull();
  const reopened = await api.transitionJobOffer(offer.id, "reopen");
  expect(reopened).toMatchObject({ status: "PUBLISHED", availableTransitions: ["close"] });
});
