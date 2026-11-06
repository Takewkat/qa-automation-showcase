import { HTTPMethod } from "../common/api";
import { JobOfferApi } from "../job-offer-api";
import type { CreateJobOfferRequest, JobOffer } from "../types";

/** POST /job-offers: a DRAFT with the company's flags snapshotted on it. */
export class CreateJobOffer extends JobOfferApi {
  readonly path = "/job-offers";
  readonly method = HTTPMethod.POST;
  readonly correctStatusCode = 201;

  create<T = JobOffer>(body: CreateJobOfferRequest, expected?: number) {
    return this.send<T>({ data: body }, expected);
  }
}
