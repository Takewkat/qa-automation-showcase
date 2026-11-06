import { HTTPMethod } from "../common/api";
import { JobOfferApi } from "../job-offer-api";
import type { Query } from "../common/api";
import type { JobOfferPage } from "../types";

/** GET /job-offers: the company's offers, filtered, sorted and paged. */
export class ListJobOffers extends JobOfferApi {
  readonly path = "/job-offers";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  list<T = JobOfferPage>(query: Query = {}, expected?: number) {
    return this.send<T>({ query }, expected);
  }
}
