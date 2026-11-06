import { test } from "@e2e/fixtures/test";

test(
  "ART-003 I can delete my article and it leaves my profile",
  { tag: ["@articles", "@happy-path", "@p1", "@sanity"] },
  async ({ articles, articlePage, profilePage }) => {
    const { slug, title } = await articles.seed();
    await articlePage.open(slug);
    await articlePage.delete();
    await articlePage.assertOnHome();
    await profilePage.openOwn();
    await profilePage.assertArticleNotListed(title);
  },
);
