import { test } from "@e2e/fixtures/test";
import { articleDraft } from "@e2e/test-data/factories";

test(
  "ART-001 I can publish an article and read it by its title",
  { tag: ["@articles", "@happy-path", "@p1", "@smoke"] },
  async ({ apiUser, editorPage, articlePage, profilePage, track }) => {
    const draft = articleDraft();
    await editorPage.openNew();
    await editorPage.write(draft);
    await editorPage.publish();
    track(draft.title);
    await editorPage.assertOnArticlePage();
    await articlePage.assertTitle(draft.title);
    await articlePage.assertBody(draft.body);
    await articlePage.assertAuthor(apiUser.username);
    await profilePage.openOwn();
    await profilePage.assertArticleListed(draft.title);
  },
);
