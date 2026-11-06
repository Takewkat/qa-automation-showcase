import { test } from "@e2e/fixtures/test";
import { articleDraft } from "@e2e/test-data/factories";

test(
  "ART-002 I can edit my article and see the new title and body",
  { tag: ["@articles", "@happy-path", "@sanity"] },
  async ({ articles, editorPage, articlePage, track }) => {
    const { slug } = await articles.seed();
    const edited = articleDraft();
    await editorPage.openEdit(slug);
    await editorPage.write(edited);
    await editorPage.update();
    track(edited.title);
    await editorPage.assertOnArticlePage();
    await articlePage.assertTitle(edited.title);
    await articlePage.assertBody(edited.body);
  },
);
