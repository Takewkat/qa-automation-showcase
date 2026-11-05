import { ListJobOffers, type Query } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";

const TOTAL = 5;
const PAGE_SIZE = 2;
/** The pages of TOTAL offers by PAGE_SIZE; the last one is empty. */
const PAGES = [
  { page: 0, items: 2 },
  { page: 1, items: 2 },
  { page: 2, items: 1 },
  { page: 3, items: 0 },
];
const INVALID: Query[] = [
  { page: -1 },
  { size: 0 },
  { size: 101 },
  { size: "abc" },
  { status: "BOGUS" },
  { sort: "bogus" },
];

test("LST-001 the default page lists newest first and a page size paginates to the last empty page", async ({
  company,
  offers,
}) => {
  const ids: string[] = [];
  for (let n = 0; n < TOTAL; n += 1) {
    const offer = await offers.create();
    ids.push(offer.id);
  }
  const page = await new ListJobOffers(company).list();
  expect(page).toMatchObject({ page: 0, size: 20, totalElements: TOTAL, totalPages: 1 });
  const created = page.content.map((item) => Date.parse(item.createdAt));
  expect(created).toEqual([...created].sort((a, b) => b - a));
  const pages = await Promise.all(
    PAGES.map((row) => new ListJobOffers(company).list({ page: row.page, size: PAGE_SIZE })),
  );
  expect(pages.map((p) => p.content.length)).toEqual(PAGES.map((row) => row.items));
  expect(pages.map((p) => p.totalPages)).toEqual(PAGES.map(() => Math.ceil(TOTAL / PAGE_SIZE)));
  expect(pages.flatMap((p) => p.content.map((item) => item.id)).sort()).toEqual([...ids].sort());
});

for (const query of INVALID) {
  test(`LST-002 ${JSON.stringify(query)} is a bad request`, async ({ company }) => {
    await new ListJobOffers(company).list(query, 400);
  });
}
