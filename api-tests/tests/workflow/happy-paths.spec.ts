import { GetAvailableTransitions, type JobOfferStatus, TransitionJobOffer } from "@job-offer/api";
import { expect, type Fixtures, test } from "@job-offer/fixtures/fixtures";
import { HAPPY_PATHS, VALID_ACTIONS, flagsOf, forward } from "@job-offer/oracle";

type Row = (typeof HAPPY_PATHS)[number];
const SMOKE = HAPPY_PATHS.filter((row) => row.on.length === 0);
const OPTIONAL = HAPPY_PATHS.filter((row) => row.on.length > 0);
const label = (row: Row) => `${row.path.join(" -> ")} with ${row.on.join(" and ") || "no flag"}`;

/** Walks the oracle's chain with the forward action of each status, then closes. */
const publishes =
  (row: Row) =>
  async ({ company, configure, offers }: Fixtures) => {
    await configure(flagsOf(row));
    let offer = await offers.create();
    const chain: JobOfferStatus[] = [...row.path, "CLOSED"];
    for (const expected of chain) {
      offer = await new TransitionJobOffer(company).transition(offer.id, forward(offer.status));
      expect(offer.status).toBe(expected);
      expect(offer.availableTransitions).toEqual(VALID_ACTIONS[expected]);
      const { transitions } = await new GetAvailableTransitions(company).get(offer.id);
      expect(transitions.map((transition) => transition.action)).toEqual(VALID_ACTIONS[expected]);
    }
    expect(offer.publishedAt).not.toBeNull();
    expect(offer.closedAt).not.toBeNull();
  };

for (const row of SMOKE) test(`WFL-001 ${label(row)}`, { tag: "@smoke" }, publishes(row));
for (const row of OPTIONAL) test(`WFL-001 ${label(row)}`, publishes(row));
