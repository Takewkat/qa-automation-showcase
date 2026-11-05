import { HTTPMethod } from "../http-method";
import { JobOfferApi } from "../job-offer-api";
import type { JobOffer } from "../types";

/** GET /job-offers/{jobOfferId}: one offer of the company. */
export class GetJobOffer extends JobOfferApi {
  readonly path = "/job-offers/{jobOfferId}";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  get<T = JobOffer>(jobOfferId: string, expected?: number) {
    return this.send<T>({ pathParams: { jobOfferId } }, expected);
  }
}
