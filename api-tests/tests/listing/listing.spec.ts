import type { Query } from "@api/client";
import { expect, test } from "@api/fixtures";

const PAGES = [0, 1, 2, 3];
const SIZES = [2, 2, 1, 0];
const INVALID: Query[] = [
  { page: -1 },
  { size: 0 },
  { size: 101 },
  { size: "abc" },
  { status: "BOGUS" },
  { sort: "bogus" },
];

test("LST-001 the default page lists newest first; a page size paginates to the last empty page", async ({
  api,
  offers,
}) => {
  const ids: string[] = [];
  for (let n = 0; n < 5; n += 1) ids.push((await offers.create()).id);
  const page = await api.listJobOffers();
  expect(page).toMatchObject({ page: 0, size: 20, totalElements: 5, totalPages: 1 });
  const created = page.content.map((item) => Date.parse(item.createdAt));
  expect(created).toEqual([...created].sort((a, b) => b - a));
  const pages = await Promise.all(PAGES.map((n) => api.listJobOffers({ page: n, size: 2 })));
  expect(pages.map((p) => p.content.length)).toEqual(SIZES);
  expect(pages.map((p) => p.totalPages)).toEqual([3, 3, 3, 3]);
  expect(pages.flatMap((p) => p.content.map((item) => item.id)).sort()).toEqual([...ids].sort());
});

for (const query of INVALID) {
  test(`LST-002 ${JSON.stringify(query)} is a bad request`, async ({ api }) => {
    await api.listJobOffers(query, { expect: 400 });
  });
}
