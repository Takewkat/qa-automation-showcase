import {
  type Company,
  DeleteJobOffer,
  GetJobOffer,
  type JobOffer,
  type JobOfferStatus,
  TransitionJobOffer,
} from "@job-offer/api";

const BEYOND_WITHDRAW: JobOfferStatus[] = ["PUBLISHED", "CLOSED"];

/** What the teardown leaves behind, by design (kept) or by failure (failed). */
export type Leftovers = { kept: string[]; failed: string[] };

/** Removes one offer the way the spec allows; returns a note when it has to keep it. */
async function removeJobOffer(company: Company, id: string): Promise<string | undefined> {
  const get = new GetJobOffer(company);
  await get.request({ pathParams: { jobOfferId: id } });
  if (get.getStatusCode() === 404) return undefined;
  get.checkStatusCode();
  const { status } = get.getResponseBody<JobOffer>();
  if (status === "PUBLISHED") await new TransitionJobOffer(company).transition(id, "close");
  if (BEYOND_WITHDRAW.includes(status)) return `${id} was ${status}, closed and kept`;
  if (status !== "DRAFT") await new TransitionJobOffer(company).transition(id, "withdraw");
  await new DeleteJobOffer(company).delete(id);
  return undefined;
}

/** Removes every offer the company created: withdraw, delete, close what is live; nothing is thrown. */
export async function cleanupJobOffers(company: Company, ids: string[]): Promise<Leftovers> {
  const leftovers: Leftovers = { kept: [], failed: [] };
  for (const id of ids) {
    const note = await removeJobOffer(company, id).catch((error: Error) => {
      leftovers.failed.push(`${id}: ${error.message}`);
      return undefined;
    });
    if (note) leftovers.kept.push(note);
  }
  return leftovers;
}
