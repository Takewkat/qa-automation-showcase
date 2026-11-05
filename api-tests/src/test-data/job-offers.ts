import type { Address, CreateJobOfferRequest, Location, SalaryEntry } from "@job-offer/api";

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
  address: { city: "Paris", countryCode: "FR", ...address },
});

/** A complete offer: title, custom location, one salary entry. */
export const completeOffer = (
  overrides: Partial<CreateJobOfferRequest> = {},
): CreateJobOfferRequest => ({
  title: "Senior Backend Developer",
  location: customLocation(),
  compensation: { salaryEntries: [salary()] },
  ...overrides,
});

/** An offer without compensation: valid to create, incomplete to publish. */
export const incompleteOffer = (
  overrides: Partial<CreateJobOfferRequest> = {},
): CreateJobOfferRequest => ({
  title: "Backend Developer",
  location: { type: "COMPANY_ADDRESS" },
  ...overrides,
});
