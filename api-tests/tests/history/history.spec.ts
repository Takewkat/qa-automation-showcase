import { flags } from "@api/expected-paths";
import { expect, test } from "@api/fixtures";

const ACTIONS = ["submit", "finalize", "approve", "post", "close"] as const;

test("HIS-001 history is empty at creation and follows every transition in order", async ({
  api,
  configure,
  offers,
}) => {
  await configure(flags([true, true, true]));
  const offer = await offers.create();
  expect(await api.getJobOfferHistory(offer.id)).toEqual([]);
  for (const action of ACTIONS) await api.transitionJobOffer(offer.id, action);
  const history = await api.getJobOfferHistory(offer.id);
  expect(history.map((entry) => entry.action)).toEqual([...ACTIONS]);
  expect(history.map((entry) => entry.fromStatus).slice(1)).toEqual(
    history.map((entry) => entry.toStatus).slice(0, -1),
  );
  const times = history.map((entry) => Date.parse(entry.performedAt));
  expect(times).toEqual([...times].sort((a, b) => a - b));
});
