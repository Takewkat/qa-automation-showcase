import { test } from "@e2e/fixtures/test";

test(
  "SOC-001 I can follow an author and see their article in my feed",
  { tag: ["@social", "@happy-path", "@p2", "@sanity"] },
  async ({ author, authorArticles, profilePage, homePage }) => {
    const { title } = await authorArticles.seed();
    await profilePage.openOf(author.username);
    await profilePage.follow(author.username);
    await homePage.openYourFeed();
    await homePage.assertArticleListed(title);
  },
);
