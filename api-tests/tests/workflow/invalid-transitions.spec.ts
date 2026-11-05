import { INVALID_TRANSITIONS, VALID_ACTIONS } from "@api/expected-paths";
import { expect, test } from "@api/fixtures";

for (const { status, action } of INVALID_TRANSITIONS) {
  test(`WFL-002 ${action} from ${status} is refused without side effect`, async ({
    api,
    offers,
  }) => {
    const offer = await offers.createIn(status);
    const before = await api.getJobOfferHistory(offer.id);
    const error = await api.transitionJobOffer(offer.id, action, {}, { expect: 400 });
    expect(error).toMatchObject({
      code: "INVALID_TRANSITION",
      details: {
        currentStatus: status,
        requestedAction: action,
        validActions: VALID_ACTIONS[status],
      },
    });
    expect((await api.getJobOffer(offer.id)).status).toBe(status);
    expect(await api.getJobOfferHistory(offer.id)).toEqual(before);
  });
}
