import { HTTPMethod } from "../http-method";
import { JobOfferApi } from "../job-offer-api";
import type { JobOffer, UpdateJobOfferRequest } from "../types";

/** PUT /job-offers/{jobOfferId}: allowed in DRAFT and TO_FINALIZE only. */
export class UpdateJobOffer extends JobOfferApi {
  readonly path = "/job-offers/{jobOfferId}";
  readonly method = HTTPMethod.PUT;
  readonly correctStatusCode = 200;

  update<T = JobOffer>(jobOfferId: string, body: UpdateJobOfferRequest, expected?: number) {
    return this.send<T>({ pathParams: { jobOfferId }, data: body }, expected);
  }
}
