import { HTTPMethod } from "@shared/api/api";
import { JobOfferApi } from "../job-offer-api";
import type { JobOffer, TransitionAction, TransitionRequest } from "../types";

/** POST /job-offers/{jobOfferId}/transitions/{action}: one step of the workflow. */
export class TransitionJobOffer extends JobOfferApi {
  readonly path = "/job-offers/{jobOfferId}/transitions/{action}";
  readonly method = HTTPMethod.POST;
  readonly correctStatusCode = 200;

  transition<T = JobOffer>(
    jobOfferId: string,
    action: TransitionAction,
    body: TransitionRequest = {},
    expected?: number,
  ) {
    return this.send<T>({ pathParams: { jobOfferId, action }, data: body }, expected);
  }
}
