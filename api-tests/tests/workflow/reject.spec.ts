import {
  type ErrorResponse,
  GetAvailableTransitions,
  GetJobOffer,
  GetJobOfferHistory,
  TransitionJobOffer,
} from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";

const REASON = { reason: "Budget constraints", comment: "Revise the salary range" };

test(
  "WFL-005 reject without a reason is refused and keeps TO_APPROVE",
  { tag: ["@workflow", "@validation-error", "@p2"] },
  async ({ company, offers }) => {
    const offer = await offers.createIn("TO_APPROVE");
    const error = await new TransitionJobOffer(company).transition<ErrorResponse>(
      offer.id,
      "reject",
      {},
      422,
    );
    expect(error).toMatchObject({
      code: ERROR_CODES.validation,
      details: { missingFields: ["reason"] },
    });
    const untouched = await new GetJobOffer(company).get(offer.id);
    expect(untouched.status).toBe("TO_APPROVE");
  },
);

test(
  "WFL-005 reject is listed as needing a reason and with one returns to DRAFT, recorded",
  { tag: ["@workflow", "@happy-path", "@p2"] },
  async ({ company, offers }) => {
    const offer = await offers.createIn("TO_APPROVE");
    const { transitions } = await new GetAvailableTransitions(company).get(offer.id);
    expect(transitions).toContainEqual({
      action: "reject",
      targetStatus: "DRAFT",
      requiresReason: true,
    });
    const rejected = await new TransitionJobOffer(company).transition(offer.id, "reject", REASON);
    expect(rejected).toMatchObject({ status: "DRAFT", availableTransitions: ["submit"] });
    const history = await new GetJobOfferHistory(company).get(offer.id);
    expect(history.at(-1)).toMatchObject({ action: "reject", ...REASON });
  },
);
