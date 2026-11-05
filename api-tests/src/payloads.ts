import type { Request, Schema } from "@api/client";

type Overrides<T> = Partial<T>;

/** A yearly salary entry. */
export const salary = (
  overrides: Overrides<Schema<"SalaryEntry">> = {},
): Schema<"SalaryEntry"> => ({
  type: "YEARLY",
  amount: 65000,
  currency: "EUR",
  ...overrides,
});

/** A CUSTOM location with the two required address fields. */
export const customLocation = (address: Overrides<Schema<"Address">> = {}): Schema<"Location"> => ({
  type: "CUSTOM",
  address: { city: "Paris", countryCode: "FR", ...address },
});

/** A complete offer: title, custom location, one salary entry. */
export const completeOffer = (
  overrides: Overrides<Request<"createJobOffer">> = {},
): Request<"createJobOffer"> => ({
  title: "Senior Backend Developer",
  location: customLocation(),
  compensation: { salaryEntries: [salary()] },
  ...overrides,
});

/** An offer without compensation: valid to create, incomplete to publish. */
export const incompleteOffer = (
  overrides: Overrides<Request<"createJobOffer">> = {},
): Request<"createJobOffer"> => ({
  title: "Backend Developer",
  location: { type: "COMPANY_ADDRESS" },
  ...overrides,
});
