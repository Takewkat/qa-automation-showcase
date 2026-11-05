import { randomUUID } from "node:crypto";

import type { JobOfferApi } from "@api/client";
import { test } from "@api/fixtures";
import { completeOffer } from "@api/payloads";

type Caller = "anonApi" | "badHeaderApi";
/** One call per row without a usable company: refused before any lookup. */
const ROWS: { name: string; caller: Caller; call: (api: JobOfferApi) => Promise<unknown> }[] = [
  {
    name: "list without a header",
    caller: "anonApi",
    call: (a) => a.listJobOffers({}, { expect: 401 }),
  },
  {
    name: "create without a header",
    caller: "anonApi",
    call: (a) => a.createJobOffer(completeOffer(), { expect: 401 }),
  },
  {
    name: "get without a header",
    caller: "anonApi",
    call: (a) => a.getJobOffer(randomUUID(), { expect: 401 }),
  },
  {
    name: "list with a malformed header",
    caller: "badHeaderApi",
    call: (a) => a.listJobOffers({}, { expect: 400 }),
  },
];

for (const row of ROWS) {
  test(`TEN-001 ${row.name} is refused`, async ({ anonApi, badHeaderApi }) => {
    await row.call({ anonApi, badHeaderApi }[row.caller]);
  });
}
