import { HTTPMethod } from "@shared/api/api";
import { JobOfferApi } from "../job-offer-api";
import type { CompanyConfiguration } from "../types";

/** GET /companies/{companyId}/configuration: the three workflow flags; the caller's company by default. */
export class GetCompanyConfiguration extends JobOfferApi {
  readonly path = "/companies/{companyId}/configuration";
  readonly method = HTTPMethod.GET;
  readonly correctStatusCode = 200;

  get<T = CompanyConfiguration>(companyId = this.company.id, expected?: number) {
    return this.send<T>({ pathParams: { companyId } }, expected);
  }
}
