import { join } from "node:path";

import type { APIRequestContext } from "@playwright/test";

import { Api } from "@shared/api/api";
import { Contract } from "@shared/api/contract";

/** The caller: a request context and the company it acts as; an empty id sends no header. */
export type Company = { request: APIRequestContext; id: string };

/** The spec as received, and its checker; compiled once per worker. */
const CONTRACT = new Contract(join(__dirname, "..", "..", "spec", "job-offer-swagger.yml"));

/** One endpoint of the Job Offer service, called as a company: the header is the only credential. */
export abstract class JobOfferApi extends Api {
  protected override readonly contract = CONTRACT;

  constructor(protected readonly company: Company) {
    super(company.request, company.id ? { "X-Company-Id": company.id } : {});
  }
}
