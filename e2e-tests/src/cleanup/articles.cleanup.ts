import { DeleteArticle, ListArticles, type Session } from "@e2e/api";
import type { Leftovers } from "@shared/cleanup/leftovers";

const GONE = 404;
/** The author's newest articles searched for a tracked title: a test's own are at the top. */
const NEWEST = 10;

/** Deletes one article; a 404 means it is gone already. */
async function removeArticle(session: Session, slug: string): Promise<void> {
  const remove = new DeleteArticle(session);
  await remove.request({ pathParams: { slug } });
  if (remove.getStatusCode() === GONE) return;
  remove.checkStatusCode();
}

/** The slugs of the author's own articles that carry a tracked title. */
async function trackedSlugs(session: Session, author: string, titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];
  const { articles } = await new ListArticles(session).list({ author, limit: NEWEST });
  return articles.filter((article) => titles.includes(article.title)).map(({ slug }) => slug);
}

/** Deletes every seeded slug and every tracked title found among the author's own; nothing is thrown. */
export async function cleanupArticles(
  session: Session,
  author: string,
  slugs: string[],
  titles: string[],
): Promise<Leftovers> {
  const leftovers: Leftovers = { kept: [], failed: [] };
  const found = await trackedSlugs(session, author, titles).catch((error: Error) => {
    leftovers.failed.push(`${titles.join(", ")}: ${error.message}`);
    return [];
  });
  for (const slug of [...slugs, ...found])
    await removeArticle(session, slug).catch((error: Error) => {
      leftovers.failed.push(`${slug}: ${error.message}`);
    });
  return leftovers;
}
