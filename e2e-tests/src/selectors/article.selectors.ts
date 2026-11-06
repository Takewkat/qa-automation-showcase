/** The article page: banner, meta (rendered twice, banner and bottom), body, and the comments below it. */
export const ARTICLE_SELECTORS = {
  PATHS: { article: (slug: string) => `/#/article/${slug}`, articleUrl: /\/#\/article\/.+/ },
  BANNER: { title: ".article-page .banner h1" },
  META: {
    author: ".article-page .article-meta a.author",
    edit: '.article-page .article-meta a.nav-link:has-text("Edit Article")',
    delete: '.article-page .article-meta button:has-text("Delete Article")',
  },
  BODY: { content: ".article-page .article-content" },
  COMMENTS: {
    FORM: {
      body: '.article-page form.comment-form textarea[placeholder="Write a comment..."]',
      post: '.article-page form.comment-form button:has-text("Post Comment")',
    },
    LIST: {
      cardByText: (text: string) => `.article-page div.card:has(p.card-text:has-text("${text}"))`,
      authorByName: (username: string) => `.card-footer a.comment-author:text-is("${username}")`,
      delete: ".card-footer button.btn-outline-secondary",
    },
  },
} as const;
