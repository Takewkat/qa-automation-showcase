import {
  type Company,
  CreateJobOffer,
  DeleteJobOffer,
  GetAvailableTransitions,
  GetCompanyConfiguration,
  GetJobOffer,
  GetJobOfferHistory,
  ListJobOffers,
  TransitionJobOffer,
  UpdateCompanyConfiguration,
  UpdateJobOffer,
} from "@job-offer/api";
import { test } from "@job-offer/fixtures/fixtures";
import { generateCompanyId, generateJobOfferId } from "@job-offer/test-data/factories";
import { completeOffer } from "@job-offer/test-data/job-offers";

type Ids = { offer: string; company: string };

/** Every operation of the spec by operationId, called without a company: refused before any lookup. */
const OPERATIONS: Record<string, (caller: Company, ids: Ids) => Promise<unknown>> = {
  listJobOffers: (caller) => new ListJobOffers(caller).list({}, 401),
  createJobOffer: (caller) => new CreateJobOffer(caller).create(completeOffer(), 401),
  getJobOffer: (caller, { offer }) => new GetJobOffer(caller).get(offer, 401),
  updateJobOffer: (caller, { offer }) => new UpdateJobOffer(caller).update(offer, {}, 401),
  deleteJobOffer: (caller, { offer }) => new DeleteJobOffer(caller).delete(offer, 401),
  getAvailableTransitions: (caller, { offer }) =>
    new GetAvailableTransitions(caller).get(offer, 401),
  transitionJobOffer: (caller, { offer }) =>
    new TransitionJobOffer(caller).transition(offer, "submit", {}, 401),
  getJobOfferHistory: (caller, { offer }) => new GetJobOfferHistory(caller).get(offer, 401),
  getCompanyConfiguration: (caller, { company }) =>
    new GetCompanyConfiguration(caller).get(company, 401),
  updateCompanyConfiguration: (caller, { company }) =>
    new UpdateCompanyConfiguration(caller).update({}, company, 401),
};

for (const [name, call] of Object.entries(OPERATIONS)) {
  test(
    `TEN-001 ${name} without a header is unauthorized`,
    { tag: ["@tenancy", "@error-case"] },
    async ({ anonymous }) => {
      await call(anonymous, { offer: generateJobOfferId(), company: generateCompanyId() });
    },
  );
}

test(
  "TEN-001 a header that is not a UUID is a bad request",
  { tag: ["@tenancy", "@validation-error"] },
  async ({ malformedHeader }) => {
    await new ListJobOffers(malformedHeader).list({}, 400);
  },
);
