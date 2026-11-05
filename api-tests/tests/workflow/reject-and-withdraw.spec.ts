import {
  GetAvailableTransitions,
  GetJobOffer,
  GetJobOfferHistory,
  TransitionJobOffer,
  UpdateJobOffer,
  type ErrorResponse,
} from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { WITHDRAWABLE } from "@job-offer/oracle";

const REASON = { reason: "Budget constraints", comment: "Revise the salary range" };

test("WFL-005 reject needs a reason and sends the offer back to DRAFT", async ({
  company,
  offers,
}) => {
  const offer = await offers.createIn("TO_APPROVE");
  const { transitions } = await new GetAvailableTransitions(company).get(offer.id);
  expect(transitions).toContainEqual({
    action: "reject",
    targetStatus: "DRAFT",
    requiresReason: true,
  });
  const transition = new TransitionJobOffer(company);
  const error = await transition.transition<ErrorResponse>(offer.id, "reject", {}, 422);
  expect(error).toMatchObject({
    code: ERROR_CODES.validation,
    details: { missingFields: ["reason"] },
  });
  const untouched = await new GetJobOffer(company).get(offer.id);
  expect(untouched.status).toBe("TO_APPROVE");
  const rejected = await transition.transition(offer.id, "reject", REASON);
  expect(rejected).toMatchObject({ status: "DRAFT", availableTransitions: ["submit"] });
  const history = await new GetJobOfferHistory(company).get(offer.id);
  expect(history.at(-1)).toMatchObject({ action: "reject", ...REASON });
});

for (const status of WITHDRAWABLE) {
  test(`WFL-006 withdraw from ${status} returns to DRAFT and reopens editing`, async ({
    company,
    offers,
  }) => {
    const offer = await offers.createIn(status);
    const withdrawn = await new TransitionJobOffer(company).transition(offer.id, "withdraw");
    expect(withdrawn.status).toBe("DRAFT");
    const edited = await new UpdateJobOffer(company).update(offer.id, { title: "Edited" });
    expect(edited.title).toBe("Edited");
  });
}
