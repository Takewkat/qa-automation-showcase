import {
  type Company,
  GetCompanyConfiguration,
  GetJobOffer,
  type JobOffer,
  type JobOfferStatus,
  TransitionJobOffer,
  UpdateCompanyConfiguration,
} from "@job-offer/api";
import { JOB_OFFER_STATUSES, type WorkflowFlags } from "@job-offer/enum/job-offer.enum";
import { forward } from "@job-offer/oracle";

/** The three flags of a configuration response, nothing else. */
const flagsOf = ({
  approvalRequired,
  partialSaveEnabled,
  manualPostingRequired,
}: WorkflowFlags) => ({
  approvalRequired,
  partialSaveEnabled,
  manualPostingRequired,
});

/** Sets the given flags on the company and keeps the others as they are. */
export async function configure(company: Company, flags: Partial<WorkflowFlags>) {
  const current = await new GetCompanyConfiguration(company).get();
  return new UpdateCompanyConfiguration(company).update({ ...flagsOf(current), ...flags });
}

/** Where a status sits in the workflow. */
const rank = (status: JobOfferStatus) => JOB_OFFER_STATUSES.indexOf(status);

/** Moves an offer forward until it reaches the target status; throws when the flags skip past it. */
export async function advance(
  company: Company,
  id: string,
  target: JobOfferStatus,
): Promise<JobOffer> {
  let offer = await new GetJobOffer(company).get(id);
  while (offer.status !== target) {
    if (rank(offer.status) > rank(target))
      throw new Error(`${id}: ${offer.status} cannot reach ${target}`);
    offer = await new TransitionJobOffer(company).transition(id, forward(offer.status));
  }
  return offer;
}
