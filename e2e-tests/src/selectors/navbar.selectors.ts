/** The navbar: the Login link of a visitor, the user menu of a logged-in user (a div toggles it, Logout is an item of it). */
export const NAVBAR_SELECTORS = {
  PATHS: { home: "/#/", homeUrl: /\/#\/$/ },
  LINKS: { login: 'nav.navbar a.nav-link[href="#/login"]' },
  USER_MENU: {
    toggle: "nav.navbar li.dropdown div.dropdown-toggle",
    toggleByName: (username: string) =>
      `nav.navbar li.dropdown div.dropdown-toggle:has-text("${username}")`,
    logout: 'nav.navbar .dropdown-menu a.dropdown-item:has-text("Logout")',
  },
} as const;
