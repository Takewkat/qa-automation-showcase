import {
  type ErrorResponse,
  GetJobOffer,
  TransitionJobOffer,
  UpdateJobOffer,
} from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { compensation, incompleteOffer } from "@job-offer/test-data/job-offers";

test(
  "WFL-004 finalize of an incomplete offer is refused and stays in TO_FINALIZE",
  { tag: ["@workflow", "@validation-error"] },
  async ({ company, offers }) => {
    const offer = await offers.createIn("TO_FINALIZE", incompleteOffer());
    expect(offer.isComplete).toBe(false);
    const gate = await new TransitionJobOffer(company).transition<ErrorResponse>(
      offer.id,
      "finalize",
      {},
      422,
    );
    expect(gate).toMatchObject({ code: ERROR_CODES.incompleteOffer });
    const untouched = await new GetJobOffer(company).get(offer.id);
    expect(untouched.status).toBe("TO_FINALIZE");
  },
);

test(
  "WFL-004 partial save: an offer completed in TO_FINALIZE is published by finalize",
  { tag: ["@workflow", "@happy-path"] },
  async ({ company, offers }) => {
    const offer = await offers.createIn("TO_FINALIZE", incompleteOffer());
    const completed = await new UpdateJobOffer(company).update(offer.id, {
      compensation: compensation(),
    });
    expect(completed.isComplete).toBe(true);
    const published = await new TransitionJobOffer(company).transition(offer.id, "finalize");
    expect(published.status).toBe("PUBLISHED");
  },
);
