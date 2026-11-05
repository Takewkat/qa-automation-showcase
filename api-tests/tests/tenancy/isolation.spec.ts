import { randomUUID } from "node:crypto";

import type { JobOfferApi } from "@api/client";
import { expect, test, type Fixtures } from "@api/fixtures";

type OnOffer = (api: JobOfferApi, id: string) => Promise<unknown>;
type Read = (w: Pick<Fixtures, "api" | "otherApi"> & { id: string }) => Promise<object>;

/** Not yours and not there look the same. */
const NOT_FOUND: { name: string; read: Read }[] = [
  {
    name: "another company's offer",
    read: ({ otherApi, id }) => otherApi.getJobOffer(id, { expect: 404 }),
  },
  { name: "an unknown id", read: ({ api }) => api.getJobOffer(randomUUID(), { expect: 404 }) },
];

for (const row of NOT_FOUND) {
  test(
    `TEN-002 ${row.name} reads as not found`,
    { tag: "@smoke" },
    async ({ api, offers, otherApi }) => {
      const error = await row.read({ api, otherApi, id: (await offers.create()).id });
      expect(error).not.toHaveProperty("title");
    },
  );
}

/** Every mutation and read of A's offer, tried as B. */
const AS_OTHER: { name: string; call: OnOffer }[] = [
  { name: "update", call: (b, id) => b.updateJobOffer(id, { title: "hijacked" }, { expect: 404 }) },
  { name: "delete", call: (b, id) => b.deleteJobOffer(id, { expect: 404 }) },
  { name: "submit", call: (b, id) => b.transitionJobOffer(id, "submit", {}, { expect: 404 }) },
  { name: "history", call: (b, id) => b.getJobOfferHistory(id, { expect: 404 }) },
];

for (const row of AS_OTHER) {
  test(`TEN-003 ${row.name} of another company's offer is not found and has no effect`, async ({
    api,
    offers,
    otherApi,
  }) => {
    const offer = await offers.create();
    await row.call(otherApi, offer.id);
    expect(await api.getJobOffer(offer.id)).toMatchObject({ status: "DRAFT", title: offer.title });
  });
}

test(
  "TEN-004 lists are scoped to the caller's company",
  { tag: "@smoke" },
  async ({ api, offers, otherApi, otherOffers }) => {
    const mine = [await offers.create(), await offers.create()].map((offer) => offer.id).sort();
    await otherOffers.create();
    const page = await api.listJobOffers();
    expect(page.totalElements).toBe(2);
    expect(page.content.map((item) => item.id).sort()).toEqual(mine);
    expect((await otherApi.listJobOffers()).totalElements).toBe(1);
    expect((await api.listJobOffers({ status: "DRAFT" })).totalElements).toBe(2);
  },
);
