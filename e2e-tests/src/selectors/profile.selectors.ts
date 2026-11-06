/** The profile page: the list of own articles; a preview without an em is a loaded one, not the placeholder. */
export const PROFILE_SELECTORS = {
  PATHS: { profile: (username: string) => `/#/profile/${username}` },
  ARTICLES: {
    loaded: ".profile-page .article-preview:not(:has(em))",
    previewByTitle: (title: string) => `.profile-page .article-preview:has(h1:text-is("${title}"))`,
  },
} as const;
