import type { Request } from "@api/client";
import { expect, test } from "@api/fixtures";
import { completeOffer, customLocation, salary } from "@api/payloads";

type Body = Request<"createJobOffer">;

/** Each row: a body the spec refuses and the last segment of the field it names. */
const REJECTED: { name: string; body: Body; field: string }[] = [
  { name: "an empty body", body: {} as Body, field: "title" },
  { name: "a blank title", body: completeOffer({ title: "" }), field: "title" },
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
    body: completeOffer({ compensation: { salaryEntries: [salary({ amount: -1 })] } }),
    field: "amount",
  },
  {
    name: "a lowercase currency",
    body: completeOffer({ compensation: { salaryEntries: [salary({ currency: "eur" })] } }),
    field: "currency",
  },
];

for (const row of REJECTED) {
  test(`VAL-001 ${row.name} is refused and names the field`, async ({ api }) => {
    const error = await api.createJobOffer(row.body, { expect: 422 });
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fieldErrors.map((e) => e.field)).toContainEqual(
      expect.stringMatching(`${row.field}$`),
    );
  });
}

test("VAL-001 a 200-char title is accepted", async ({ offers }) => {
  const offer = await offers.create(completeOffer({ title: "a".repeat(200) }));
  expect(offer.title).toHaveLength(200);
});
