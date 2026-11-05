import { expect, test } from "@api/fixtures";

test(
  "OFR-001 creates a complete offer in DRAFT and reads it back",
  { tag: "@smoke" },
  async ({ api, companyId, offers }) => {
    const created = await offers.create();
    expect(created).toMatchObject({
      companyId,
      status: "DRAFT",
      isComplete: true,
      availableTransitions: ["submit"],
      publishedAt: null,
      closedAt: null,
    });
    expect(await api.getJobOffer(created.id)).toEqual(created);
  },
);
