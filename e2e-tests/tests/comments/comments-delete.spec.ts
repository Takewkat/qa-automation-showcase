import { test } from "@e2e/fixtures/test";

test(
  "CMT-002 I can delete my comment",
  { tag: ["@comments", "@happy-path", "@p2", "@sanity"] },
  async ({ articles, articlePage, commentsPage }) => {
    const { slug } = await articles.seed();
    const { body } = await articles.comment(slug);
    await articlePage.open(slug);
    await commentsPage.delete(body);
    await commentsPage.assertNoComment(body);
  },
);
