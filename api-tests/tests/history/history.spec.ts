import { GetJobOfferHistory, TransitionJobOffer } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { ALL_FLAGS } from "@job-offer/oracle";

const ACTIONS = ["submit", "finalize", "approve", "post", "close"] as const;

test("HIS-001 history is empty at creation and follows every transition in order", async ({
  company,
  configure,
  offers,
}) => {
  await configure(ALL_FLAGS);
  const offer = await offers.create();
  const history = new GetJobOfferHistory(company);
  expect(await history.get(offer.id)).toEqual([]);
  for (const action of ACTIONS) await new TransitionJobOffer(company).transition(offer.id, action);
  const entries = await history.get(offer.id);
  expect(entries.map((entry) => entry.action)).toEqual([...ACTIONS]);
  const from = entries.map((entry) => entry.fromStatus).slice(1);
  const to = entries.map((entry) => entry.toStatus).slice(0, -1);
  expect(from).toEqual(to);
  const times = entries.map((entry) => Date.parse(entry.performedAt));
  expect(times).toEqual([...times].sort((a, b) => a - b));
});
