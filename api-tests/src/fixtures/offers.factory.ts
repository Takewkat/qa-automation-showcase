import {
  type Company,
  CreateJobOffer,
  type CreateJobOfferRequest,
  type JobOffer,
  type JobOfferStatus,
} from "@job-offer/api";
import { cleanupJobOffers, type Leftovers } from "@job-offer/cleanup/job-offers.cleanup";
import type { WorkflowFlags } from "@job-offer/enum/job-offer.enum";
import { REACHED_WITH } from "@job-offer/oracle";
import { completeOffer } from "@job-offer/test-data/job-offers";
import { advance, configure } from "@job-offer/utils/workflow";

/** Creates offers for one company and remembers them for the cleanup. */
export class OffersFactory {
  private readonly ids: string[] = [];

  constructor(private readonly company: Company) {}

  /** Creates an offer, tracked for cleanup; a complete one by default. */
  async create(body: CreateJobOfferRequest = completeOffer()): Promise<JobOffer> {
    const offer = await new CreateJobOffer(this.company).create(body);
    this.ids.push(offer.id);
    return offer;
  }

  /** Creates an offer (a complete one by default), sets the flags the status needs or the given ones, and moves it there. */
  async createIn(
    status: JobOfferStatus,
    body: CreateJobOfferRequest = completeOffer(),
    flags = REACHED_WITH[status] ?? {},
  ): Promise<JobOffer> {
    if (Object.keys(flags).length) await configure(this.company, flags as Partial<WorkflowFlags>);
    const offer = await this.create(body);
    return advance(this.company, offer.id, status);
  }

  /** Removes everything created; see cleanupJobOffers. */
  teardown(): Promise<Leftovers> {
    return cleanupJobOffers(this.company, this.ids);
  }
}
