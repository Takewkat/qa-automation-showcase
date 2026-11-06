import { HTTPMethod } from "@shared/api/api";
import { JobOfferApi } from "../job-offer-api";
import type { TransitionHistoryEntry } from "../types";

/** GET /job-offers/{jobOfferId}/history: every transition, in order. */
export class GetJobOfferHistory extends JobOfferApi {
  readonly path = "/job-offers/{jobOfferId}/history";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  get<T = TransitionHistoryEntry[]>(jobOfferId: string, expected?: number) {
    return this.send<T>({ pathParams: { jobOfferId } }, expected);
  }
}
