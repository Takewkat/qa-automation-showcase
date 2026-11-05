import type { JobOfferApi, Request, Schema } from "@api/client";
import { FORWARD, NO_FLAGS, REACHED_WITH, type Flags, type Status } from "@api/expected-paths";
import { completeOffer } from "@api/payloads";

type Offer = Schema<"JobOffer">;
const UNDELETABLE: Status[] = ["PUBLISHED", "CLOSED"];

/** The three flags of a configuration response, nothing else. */
const flagsOf = ({
  approvalRequired,
  partialSaveEnabled,
  manualPostingRequired,
}: Flags): Flags => ({
  approvalRequired,
  partialSaveEnabled,
  manualPostingRequired,
});

/** Replaces the company's configuration; absent flags are false. */
export const configure = (api: JobOfferApi, flags: Partial<Flags>) =>
  api.updateCompanyConfiguration({ ...NO_FLAGS, ...flags });

/** Moves an offer forward until it reaches the target status; throws when it cannot. */
export async function advance(api: JobOfferApi, id: string, target: Status): Promise<Offer> {
  let offer = await api.getJobOffer(id);
  while (offer.status !== target) {
    const action = FORWARD[offer.status];
    if (!action) throw new Error(`${offer.status} cannot reach ${target}`);
    offer = await api.transitionJobOffer(id, action);
  }
  return offer;
}

/** Creates offers for one company and removes them afterwards; what stays behind is reported, never thrown. */
export class Offers {
  private readonly ids: string[] = [];

  constructor(private readonly api: JobOfferApi) {}

  /** Creates an offer, tracked for teardown; a complete one by default. */
  async create(body: Request<"createJobOffer"> = completeOffer()): Promise<Offer> {
    const offer = await this.api.createJobOffer(body);
    this.ids.push(offer.id);
    return offer;
  }

  async createIn(
    status: Status,
    flags: Partial<Flags> = REACHED_WITH[status] ?? {},
  ): Promise<Offer> {
    await configure(this.api, { ...flagsOf(await this.api.getCompanyConfiguration()), ...flags });
    const offer = await this.create();
    return advance(this.api, offer.id, status);
  }

  /** One note per offer that could not be removed. */
  async teardown(): Promise<string[]> {
    const notes: string[] = [];
    for (const id of this.ids) {
      const note = await this.remove(id).catch((error: Error) => `${id}: ${error.message}`);
      if (note) notes.push(note);
    }
    return notes;
  }

  /** Deletes what the spec allows: withdraw first when needed; a live offer is closed, then kept. */
  private async remove(id: string): Promise<string | undefined> {
    const { status, body } = await this.api.send("getJobOffer", { jobOfferId: id });
    if (status === 404) return undefined;
    const current = (body as Offer).status;
    if (current === "PUBLISHED") await this.api.transitionJobOffer(id, "close");
    if (UNDELETABLE.includes(current)) return `${id} was ${current}, closed and kept`;
    if (current !== "DRAFT") await this.api.transitionJobOffer(id, "withdraw");
    await this.api.deleteJobOffer(id);
    return undefined;
  }
}
