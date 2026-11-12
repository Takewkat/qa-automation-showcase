/** The home page of a logged-in user: the feed tabs and the previews of the open feed, found by title. */
export const HOME_SELECTORS = {
  FEED: {
    yourFeed: '.home-page .feed-toggle button.nav-link:has-text("Your Feed")',
    previewByTitle: (title: string) => `.home-page .article-preview:has(h1:text-is("${title}"))`,
  },
} as const;
