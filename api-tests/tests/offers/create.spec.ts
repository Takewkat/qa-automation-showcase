import { GetJobOffer } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";

test(
  "OFR-001 creates a complete offer in DRAFT and reads it back",
  { tag: ["@offers", "@happy-path", "@smoke"] },
  async ({ company, offers }) => {
    const created = await offers.create();
    expect(created).toMatchObject({
      companyId: company.id,
      status: "DRAFT",
      isComplete: true,
      availableTransitions: ["submit"],
      publishedAt: null,
      closedAt: null,
    });
    const fetched = await new GetJobOffer(company).get(created.id);
    expect(fetched).toEqual(created);
  },
);
