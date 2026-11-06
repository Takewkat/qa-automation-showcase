import { test } from "@e2e/fixtures/test";
import { commentText } from "@e2e/test-data/factories";

test(
  "CMT-001 I can comment on an article and see my comment",
  { tag: ["@comments", "@happy-path", "@p1", "@sanity"] },
  async ({ apiUser, articles, articlePage, commentsPage }) => {
    const { slug } = await articles.seed();
    const text = commentText();
    await articlePage.open(slug);
    await commentsPage.post(text);
    await commentsPage.assertCommentVisible(text, apiUser.username);
  },
);
