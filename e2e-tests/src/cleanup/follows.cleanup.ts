import { type Session, UnfollowProfile } from "@e2e/api";
import type { Leftovers } from "@shared/cleanup/leftovers";
import { log } from "@shared/log";

/** Unfollows an author as the run's user, followed or not, so the next run starts from Follow; nothing is thrown. */
export async function cleanupFollow(session: Session, username: string): Promise<Leftovers> {
  const leftovers: Leftovers = { kept: [], failed: [] };
  await new UnfollowProfile(session)
    .unfollow(username)
    .then(() => log("cleanup", `unfollowed ${username}`))
    .catch((error: Error) => {
      leftovers.failed.push(`unfollow ${username}: ${error.message}`);
    });
  return leftovers;
}
