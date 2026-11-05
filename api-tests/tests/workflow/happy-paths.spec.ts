import type { Action, Status } from "@api/expected-paths";
import { FORWARD, HAPPY_PATHS, VALID_ACTIONS, flags } from "@api/expected-paths";
import { expect, test, type Fixtures } from "@api/fixtures";

type Row = (typeof HAPPY_PATHS)[number];
const [DEFAULT, ...OPTIONAL] = HAPPY_PATHS;
const label = (row: Row) =>
  `${row.path.join(" -> ")} when the flags are ${row.flags.map(Number).join("")}`;

/** Walks the oracle's chain with the forward action of each status, then closes. */
const publishes =
  (row: Row) =>
  async ({ api, configure, offers }: Fixtures) => {
    await configure(flags(row.flags));
    let offer = await offers.create();
    for (const expected of [...row.path, "CLOSED" as Status]) {
      offer = await api.transitionJobOffer(offer.id, FORWARD[offer.status] as Action);
      expect(offer.status).toBe(expected);
      expect(offer.availableTransitions).toEqual(VALID_ACTIONS[expected]);
      const { transitions } = await api.getAvailableTransitions(offer.id);
      expect(transitions.map((t) => t.action)).toEqual(VALID_ACTIONS[expected]);
    }
    expect(offer.publishedAt).not.toBeNull();
    expect(offer.closedAt).not.toBeNull();
  };

test(`WFL-001 ${label(DEFAULT)}`, { tag: "@smoke" }, publishes(DEFAULT));
for (const row of OPTIONAL) test(`WFL-001 ${label(row)}`, publishes(row));
