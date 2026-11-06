import type { Address, CreateJobOfferRequest, Location, SalaryEntry } from "@job-offer/api";

import { generateCity, generateJobTitle } from "./factories";

/** A yearly salary entry. */
export const salary = (overrides: Partial<SalaryEntry> = {}): SalaryEntry => ({
  type: "YEARLY",
  amount: 65000,
  currency: "EUR",
  ...overrides,
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
  compensation: { salaryEntries: [salary()] },
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
