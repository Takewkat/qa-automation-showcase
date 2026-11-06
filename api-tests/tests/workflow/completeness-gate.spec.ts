import { type ErrorResponse, GetJobOffer, TransitionJobOffer } from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { incompleteOffer } from "@job-offer/test-data/job-offers";

test(
  "WFL-003 submit of an incomplete offer is refused and stays in DRAFT",
  { tag: ["@workflow", "@validation-error", "@p1"] },
  async ({ company, offers }) => {
    const offer = await offers.create(incompleteOffer());
    expect(offer.isComplete).toBe(false);
    const error = await new TransitionJobOffer(company).transition<ErrorResponse>(
      offer.id,
      "submit",
      {},
      422,
    );
    expect(error).toMatchObject({ code: ERROR_CODES.incompleteOffer });
    expect(error.details?.missingFields).toContain("compensation.salaryEntries");
    const untouched = await new GetJobOffer(company).get(offer.id);
    expect(untouched.status).toBe("DRAFT");
  },
);
