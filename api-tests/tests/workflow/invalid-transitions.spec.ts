import {
  type ErrorResponse,
  GetJobOffer,
  GetJobOfferHistory,
  TransitionJobOffer,
} from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { INVALID_TRANSITIONS, VALID_ACTIONS } from "@job-offer/oracle";

for (const { status, action } of INVALID_TRANSITIONS) {
  test(
    `WFL-002 ${action} from ${status} is refused without side effect`,
    { tag: ["@workflow", "@error-case", "@p1"] },
    async ({ company, offers }) => {
      const offer = await offers.createIn(status);
      const historyBefore = await new GetJobOfferHistory(company).get(offer.id);
      const error = await new TransitionJobOffer(company).transition<ErrorResponse>(
        offer.id,
        action,
        {},
        400,
      );
      expect(error).toMatchObject({
        code: ERROR_CODES.invalidTransition,
        details: {
          currentStatus: status,
          requestedAction: action,
          validActions: VALID_ACTIONS[status],
        },
      });
      const untouched = await new GetJobOffer(company).get(offer.id);
      expect(untouched.status).toBe(status);
      const historyAfter = await new GetJobOfferHistory(company).get(offer.id);
      expect(historyAfter).toEqual(historyBefore);
    },
  );
}
