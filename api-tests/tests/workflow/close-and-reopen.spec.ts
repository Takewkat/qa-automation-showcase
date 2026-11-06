import { TransitionJobOffer } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";

test(
  "WFL-007 close then reopen",
  { tag: ["@workflow", "@happy-path"] },
  async ({ company, offers }) => {
    const offer = await offers.createIn("PUBLISHED");
    const transition = new TransitionJobOffer(company);
    const closed = await transition.transition(offer.id, "close");
    expect(closed).toMatchObject({ status: "CLOSED", availableTransitions: ["reopen"] });
    expect(closed.closedAt).not.toBeNull();
    const reopened = await transition.transition(offer.id, "reopen");
    expect(reopened).toMatchObject({ status: "PUBLISHED", availableTransitions: ["close"] });
  },
);
