/** The article editor, new or by slug: fields found by name, the submit button reads Publish or Update. */
export const EDITOR_SELECTORS = {
  PATHS: { new: "/#/editor", edit: (slug: string) => `/#/editor/${slug}` },
  FORM: {
    title: '.editor-page input[name="title"]',
    description: '.editor-page input[name="description"]',
    body: '.editor-page textarea[name="body"]',
    publish: '.editor-page button[type="submit"]:has-text("Publish Article")',
    update: '.editor-page button[type="submit"]:has-text("Update Article")',
  },
} as const;
