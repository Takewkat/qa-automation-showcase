import {
  GetJobOffer,
  UpdateJobOffer,
  type UpdateJobOfferRequest,
  type ValidationError,
} from "@job-offer/api";
import { ERROR_CODES } from "@job-offer/enum/job-offer.enum";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { compensation, malformed, salary } from "@job-offer/test-data/job-offers";

type Body = UpdateJobOfferRequest;

/** Each row: an update the spec refuses and the last segment of the field it names. */
const REJECTED: { name: string; body: Body; field: string }[] = [
  { name: "a blank title", body: { title: "" }, field: "title" },
  { name: "a null title", body: malformed<Body>({ title: null }), field: "title" },
  { name: "a 201-char title", body: { title: "a".repeat(201) }, field: "title" },
  {
    name: "a negative salary",
    body: { compensation: compensation(salary({ amount: -1 })) },
    field: "amount",
  },
];

for (const row of REJECTED) {
  test(
    `VAL-002 ${row.name} is refused on update and changes nothing`,
    { tag: ["@offers", "@validation-error"] },
    async ({ company, offers }) => {
      const offer = await offers.create();
      const error = await new UpdateJobOffer(company).update<ValidationError>(
        offer.id,
        row.body,
        422,
      );
      expect(error.code).toBe(ERROR_CODES.validation);
      const fields = error.fieldErrors.map((fieldError) => fieldError.field);
      expect(fields).toContainEqual(expect.stringMatching(`${row.field}$`));
      const untouched = await new GetJobOffer(company).get(offer.id);
      expect(untouched.title).toBe(offer.title);
    },
  );
}
