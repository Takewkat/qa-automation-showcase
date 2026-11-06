import { type ErrorResponse, GetJobOffer } from "@job-offer/api";
import { expect, type Fixtures, test } from "@job-offer/fixtures/fixtures";
import { generateJobOfferId } from "@job-offer/test-data/factories";

type Reader = (f: Pick<Fixtures, "company" | "otherCompany" | "offers">) => Promise<object>;

/** Not yours and not there look the same; each row creates only what it reads. */
const NOT_FOUND: { name: string; read: Reader }[] = [
  {
    name: "another company's offer",
    read: async ({ otherCompany, offers }) => {
      const offer = await offers.create();
      return new GetJobOffer(otherCompany).get<ErrorResponse>(offer.id, 404);
    },
  },
  {
    name: "an unknown id",
    read: ({ company }) => new GetJobOffer(company).get<ErrorResponse>(generateJobOfferId(), 404),
  },
];

for (const row of NOT_FOUND) {
  test(
    `TEN-002 ${row.name} reads as not found`,
    { tag: ["@tenancy", "@error-case", "@p1"] },
    async ({ company, offers, otherCompany }) => {
      const error = await row.read({ company, otherCompany, offers });
      expect(error).not.toHaveProperty("title");
    },
  );
}
