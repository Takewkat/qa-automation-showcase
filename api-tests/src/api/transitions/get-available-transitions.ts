import { HTTPMethod } from "@shared/api/api";
import { JobOfferApi } from "../job-offer-api";
import type { AvailableTransitions } from "../types";

/** GET /job-offers/{jobOfferId}/transitions: the actions open from the current status. */
export class GetAvailableTransitions extends JobOfferApi {
  readonly path = "/job-offers/{jobOfferId}/transitions";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  get<T = AvailableTransitions>(jobOfferId: string, expected?: number) {
    return this.send<T>({ pathParams: { jobOfferId } }, expected);
  }
}
