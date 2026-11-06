import { CreateJobOffer, GetJobOffer, ListJobOffers } from "@job-offer/api";
import { type Fixtures, test } from "@job-offer/fixtures/fixtures";
import { generateJobOfferId } from "@job-offer/test-data/factories";
import { completeOffer } from "@job-offer/test-data/job-offers";

type Callers = Pick<Fixtures, "anonymous" | "malformedHeader">;

/** One call per row without a usable company: refused before any lookup. */
const REFUSED: { name: string; call: (callers: Callers) => Promise<unknown> }[] = [
  {
    name: "list without a header",
    call: ({ anonymous }) => new ListJobOffers(anonymous).list({}, 401),
  },
  {
    name: "create without a header",
    call: ({ anonymous }) => new CreateJobOffer(anonymous).create(completeOffer(), 401),
  },
  {
    name: "get without a header",
    call: ({ anonymous }) => new GetJobOffer(anonymous).get(generateJobOfferId(), 401),
  },
  {
    name: "list with a malformed header",
    call: ({ malformedHeader }) => new ListJobOffers(malformedHeader).list({}, 400),
  },
];

for (const row of REFUSED) {
  test(`TEN-001 ${row.name} is refused`, async ({ anonymous, malformedHeader }) => {
    await row.call({ anonymous, malformedHeader });
  });
}
