import { HTTPMethod } from "../http-method";
import { JobOfferApi } from "../job-offer-api";

/** DELETE /job-offers/{jobOfferId}: allowed in DRAFT only. */
export class DeleteJobOffer extends JobOfferApi {
  readonly path = "/job-offers/{jobOfferId}";
  readonly method = HTTPMethod.DELETE;
  readonly correctStatusCode = 204;

  delete<T = void>(jobOfferId: string, expected?: number) {
    return this.send<T>({ pathParams: { jobOfferId } }, expected);
  }
}
