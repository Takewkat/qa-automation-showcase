import { HTTPMethod } from "../http-method";
import { JobOfferApi } from "../job-offer-api";
import type { CompanyConfiguration, UpdateCompanyConfigurationRequest } from "../types";

/** PUT /companies/{companyId}/configuration: replaces the flags; the caller's company by default. */
export class UpdateCompanyConfiguration extends JobOfferApi {
  readonly path = "/companies/{companyId}/configuration";
  readonly method = HTTPMethod.PUT;
  readonly correctStatusCode = 200;

  update<T = CompanyConfiguration>(
    body: UpdateCompanyConfigurationRequest,
    companyId = this.company.id,
    expected?: number,
  ) {
    return this.send<T>({ pathParams: { companyId }, data: body }, expected);
  }
}
