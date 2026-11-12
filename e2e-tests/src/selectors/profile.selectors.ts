/** The profile page: the follow button of another author (its icon tells Follow from Unfollow, whose text contains Follow), the list of own articles; a preview without an em is a loaded one, not the placeholder. */
export const PROFILE_SELECTORS = {
  PATHS: { profile: (username: string) => `/#/profile/${username}` },
  USER_INFO: {
    follow: (username: string) =>
      `.profile-page .user-info:has(h4:text-is("${username}")) button.action-btn:has(i.ion-plus-round)`,
    unfollow: (username: string) =>
      `.profile-page .user-info:has(h4:text-is("${username}")) button.action-btn:has(i.ion-minus-round)`,
  },
  ARTICLES: {
    loaded: ".profile-page .article-preview:not(:has(em))",
    previewByTitle: (title: string) => `.profile-page .article-preview:has(h1:text-is("${title}"))`,
  },
} as const;
