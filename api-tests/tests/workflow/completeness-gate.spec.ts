import {
  type ErrorResponse,
  GetJobOffer,
  TransitionJobOffer,
  UpdateJobOffer,
} from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { incompleteOffer, salary } from "@job-offer/test-data/job-offers";

test("WFL-003 submit of an incomplete offer is refused and stays in DRAFT", async ({
  company,
  offers,
}) => {
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
});

test("WFL-004 partial save holds an incomplete offer in TO_FINALIZE until it is complete", async ({
  company,
  configure,
  offers,
}) => {
  await configure({ partialSaveEnabled: true });
  const offer = await offers.create(incompleteOffer());
  const transition = new TransitionJobOffer(company);
  const submitted = await transition.transition(offer.id, "submit");
  expect(submitted.status).toBe("TO_FINALIZE");
  const gate = await transition.transition<ErrorResponse>(offer.id, "finalize", {}, 422);
  expect(gate).toMatchObject({ code: ERROR_CODES.incompleteOffer });
  const completed = await new UpdateJobOffer(company).update(offer.id, {
    compensation: { salaryEntries: [salary()] },
  });
  expect(completed.isComplete).toBe(true);
  const published = await transition.transition(offer.id, "finalize");
  expect(published.status).toBe("PUBLISHED");
});
