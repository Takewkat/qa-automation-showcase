import { TransitionJobOffer, UpdateJobOffer } from "@job-offer/api";
import { expect, test } from "@job-offer/fixtures/fixtures";
import { WITHDRAWABLE } from "@job-offer/oracle";

for (const status of WITHDRAWABLE) {
  test(
    `WFL-006 withdraw from ${status} returns to DRAFT and reopens editing`,
    { tag: ["@workflow", "@happy-path"] },
    async ({ company, offers }) => {
      const offer = await offers.createIn(status);
      const withdrawn = await new TransitionJobOffer(company).transition(offer.id, "withdraw");
      expect(withdrawn.status).toBe("DRAFT");
      const edited = await new UpdateJobOffer(company).update(offer.id, { title: "Edited" });
      expect(edited.title).toBe("Edited");
    },
  );
}
