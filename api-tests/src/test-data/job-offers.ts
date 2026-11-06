import type {
  Address,
  Compensation,
  CreateJobOfferRequest,
  Location,
  SalaryEntry,
} from "@job-offer/api";

import { generateCity, generateJobTitle } from "./factories";

/** The keys of a request, each allowed any value: a body the type forbids, sent on purpose. */
type Malformed<T> = Partial<Record<keyof T, unknown>>;

/** A yearly salary entry. */
export const salary = (overrides: Partial<SalaryEntry> = {}): SalaryEntry => ({
  type: "YEARLY",
  amount: 65000,
  currency: "EUR",
  ...overrides,
});

/** A compensation with one salary entry. */
export const compensation = (entry: SalaryEntry = salary()): Compensation => ({
  salaryEntries: [entry],
});

/** A CUSTOM location with the two required address fields. */
export const customLocation = (address: Partial<Address> = {}): Location => ({
  type: "CUSTOM",
  address: { city: generateCity(), countryCode: "FR", ...address },
});

/** A complete offer: title, custom location, one salary entry. */
export const completeOffer = (
  overrides: Partial<CreateJobOfferRequest> = {},
): CreateJobOfferRequest => ({
  title: generateJobTitle(),
  location: customLocation(),
  compensation: compensation(),
  ...overrides,
});

/** An offer without compensation: valid to create, incomplete to publish. */
export const incompleteOffer = (
  overrides: Partial<CreateJobOfferRequest> = {},
): CreateJobOfferRequest => ({
  title: generateJobTitle(),
  location: { type: "COMPANY_ADDRESS" },
  ...overrides,
});

/** A body the request type forbids, typed as that request: null for a string, a string for a boolean. */
export const malformed = <T extends object>(body: Malformed<T>): T => body as unknown as T;

/** A complete offer with fields the contract refuses. */
export const malformedOffer = (
  overrides: Malformed<CreateJobOfferRequest>,
): CreateJobOfferRequest => malformed<CreateJobOfferRequest>({ ...completeOffer(), ...overrides });
