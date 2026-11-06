import { CreateJobOffer, type CreateJobOfferRequest, type ValidationError } from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import {
  compensation,
  completeOffer,
  customLocation,
  malformed,
  malformedOffer,
  salary,
} from "@job-offer/test-data/job-offers";

type Body = CreateJobOfferRequest;

/** Each row: a body the spec refuses and the last segment of the field it names. */
const REJECTED: { name: string; body: Body; field: string }[] = [
  { name: "an empty body", body: malformed<Body>({}), field: "title" },
  { name: "a blank title", body: completeOffer({ title: "" }), field: "title" },
  { name: "a null title", body: malformedOffer({ title: null }), field: "title" },
  { name: "a 201-char title", body: completeOffer({ title: "a".repeat(201) }), field: "title" },
  {
    name: "a custom location without city",
    body: completeOffer({ location: customLocation({ city: undefined }) }),
    field: "city",
  },
  {
    name: "a lowercase country code",
    body: completeOffer({ location: customLocation({ countryCode: "fr" }) }),
    field: "countryCode",
  },
  {
    name: "a negative salary",
    body: completeOffer({ compensation: compensation(salary({ amount: -1 })) }),
    field: "amount",
  },
  {
    name: "a lowercase currency",
    body: completeOffer({ compensation: compensation(salary({ currency: "eur" })) }),
    field: "currency",
  },
];

for (const row of REJECTED) {
  test(
    `VAL-001 ${row.name} is refused and names the field`,
    { tag: ["@offers", "@validation-error"] },
    async ({ company }) => {
      const error = await new CreateJobOffer(company).create<ValidationError>(row.body, 422);
      expect(error.code).toBe(ERROR_CODES.validation);
      const fields = error.fieldErrors.map((fieldError) => fieldError.field);
      expect(fields).toContainEqual(expect.stringMatching(`${row.field}$`));
    },
  );
}
