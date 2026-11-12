# Part 2: Conduit E2E, test scenarios

12 scenarios, 7 implemented; an implemented ID is a `test()` title under `tests/`, tied both ways by `npm run traceability`. One scenario is one user action told as "I can ...", its precondition seeded through the API. Priority is a tag equal to the row, as in Part 1: P1 the user cannot do what the product is for, P2 a daily action blocked or a message missing, P3 an entry point; a P1 that does not pass fails `npm run verify`. In the grid, italics mark a scenario designed and not written (its row ends with `no`).

## Design: tier by domain

Every E2E `test()` carries four tags, checked by `npm run traceability`: its domain, the folder of the file (`@auth`, `@articles`, `@comments`, `@social`, `@navigation`); one layer as in Part 1 (`@happy-path`, `@validation-error`, `@error-case`); one priority (`@p1`, `@p2`, `@p3`); one tier, the process that runs it:

- `@smoke`: proves the product works, the first run after a deploy;
- `@sanity`: an action a user takes every day, the daily run;
- `@regression`: a fixed bug, one row per bug, added when the bug is closed;
- `@release-check`: an entry point, cheap, run before a release.

`npx playwright test -c e2e-tests --grep @sanity` runs a tier, `--grep @p1` the critical set, `tests/articles` a domain.

| Tier | auth | articles | comments | social | navigation |
|---|---|---|---|---|---|
| Smoke | | ART-001 | | | |
| Sanity | AUTH-001, _AUTH-002_ | ART-002, ART-003, _ART-004_ | CMT-001, CMT-002 | SOC-001 | |
| Regression | | | | | |
| Release check | | | _CMT-003_ | | _NAV-001_, _NAV-002_ |

## Auth (`tests/auth/`)

| ID | Scenario | Preconditions | Steps | Expected Result | Priority | Tier | Impl |
|---|---|---|---|---|---|---|---|
| AUTH-001 | I can sign up, log out and log in again | none: the one UI-driven session, on a clean browser; spends 2 of the demo's 5 auth calls per hour | open `/#/register`, sign up as `uniqueUser()`; Logout in the user menu; open `/#/login`, log in with the same credentials | the navbar shows the username; then Login and no user menu; then the username again | P1 | Sanity | yes |
| AUTH-002 | I see an error when I log in with a wrong password | the run's user | open `/#/login`, log in with its email and another password | `Wrong email/password combination` in the error list, still on `/#/login` | P2 | Sanity | no |

## Articles (`tests/articles/`)

| ID | Scenario | Preconditions | Steps | Expected Result | Priority | Tier | Impl |
|---|---|---|---|---|---|---|---|
| ART-001 | I can publish an article and read it by its title | the run's user; the title is tracked, the teardown finds it among the author's own | open `/#/editor`, write `articleDraft()`, Publish Article; open own profile | URL `/#/article/<slug>`; the title, the body and the author shown; the profile lists the title | P1 | Smoke | yes |
| ART-002 | I can edit my article and see the new title and body | article seeded | open `/#/editor/<slug>`, wait for the prefill, write a new `articleDraft()`, Update Article | URL `/#/article/<new slug>` (the slug follows the title); the new title and body shown | P1 | Sanity | yes |
| ART-003 | I can delete my article and it leaves my profile | article seeded | open `/#/article/<slug>`, Delete Article, accept the confirm; open own profile | back on `/#/`, asserted before the profile opens; the profile, once loaded, has no preview with the title | P1 | Sanity | yes |
| ART-004 | I cannot publish an article without a title | the run's user | open `/#/editor`, write a description and a body only, Publish Article | still on `/#/editor`, the title field carries the native `required` message, no request sent | P2 | Sanity | no |

## Comments (`tests/comments/`)

| ID | Scenario | Preconditions | Steps | Expected Result | Priority | Tier | Impl |
|---|---|---|---|---|---|---|---|
| CMT-001 | I can comment on an article and see my comment | article seeded | open the article, write `commentText()`, Post Comment | a card with the text, the username as its author | P1 | Sanity | yes |
| CMT-002 | I can delete my comment | article and comment seeded | open the article, the trash button of the card with the text, accept the confirm | no card with the text | P2 | Sanity | yes |
| CMT-003 | As a visitor I see "Sign in or sign up" instead of the comment form | article seeded, no session | open the article on a clean browser | `Sign in or Sign up to add comments on this article.`, no textarea | P3 | Release check | no |

## Social and navigation (`tests/social/`, `tests/navigation/`)

| ID | Scenario | Preconditions | Steps | Expected Result | Priority | Tier | Impl |
|---|---|---|---|---|---|---|---|
| SOC-001 | I can follow an author and see their article in my feed | the author, a second user cached by the setup project, and its article seeded; the teardown unfollows it | open the author's profile, Follow; open `/#/`, Your Feed | the preview with the title is listed | P2 | Sanity | yes |
| NAV-001 | I can reach the editor from the navbar "New Article" | the run's user | open `/#/`, New Article | URL `/#/editor`, an empty form | P3 | Release check | no |
| NAV-002 | I can reach the edit form from my article page | article seeded | open the article, Edit Article | URL `/#/editor/<slug>`, the title prefilled | P3 | Release check | no |

## Coverage rationale

The brief asks for 2-3 user flows; the suite implements four domains as seven one-action tests, each with its precondition seeded through the API, because a short test names what broke and a seeded precondition does not repeat the previous test. The smoke row is the one flow without which the product has no value: a user writes and reads an article. The sanity rows are what a user does every day: sign in, edit, delete, comment, follow an author; AUTH-001 is the only UI-driven session, every other spec starts from the cached user (ADR 0003). CMT-002 is P2 and in: the comment list is the second resource with its own delete and its own confirm dialog, the pattern a team extends.

Left out, and why: the wrong-password and empty-title rows (AUTH-002, ART-004) are one assertion each on top of a form the implemented tests already drive, and the demo's auth limiter makes AUTH-002 expensive; the release-check rows (NAV-001, NAV-002, CMT-003) are entry points worth one line each before a release, not before every merge. Regression is empty by honesty: this target has no bug history in this repo; a fixed bug adds its row and its test there. Tags, favorites, pagination, settings and the global feed are not tested: global lists of the shared demo cannot be asserted (every assertion is scoped to the test's own title or comment text), and the rest is low risk.

## Assumptions

1. The target is the shared public demo, with other people's data in it and two limiters per IP: 5 register or login calls per hour, about 100 requests per 15 minutes. A 429 leaves a blank page under the navbar. The suite spends about 55 requests and 2 auth calls per run, with two workers; it is run once per change.
2. One user per run: the setup project registers it or reuses the one cached under `reports/e2e/.auth/<TEST_ENV>.json` while its token answers `GET /api/user`; the JWT has no expiry. The author SOC-001 follows is a second user, cached the same way under `<TEST_ENV>.author.json`: a cold cache spends two register calls, a warm one none. Specs never register through the API.
3. The app is a `HashRouter`: every screen lives under `/#/...`, a plain path is a JSON 404. The markup has no test ids: fields are found by `name`, buttons by text, lists by the test's own title or text.
4. Users stay: the API has no delete endpoint; every username carries the run id. Tags stay as well, so seeded articles carry none.
5. The slug derives from the title and changes when the title is edited; the teardown deletes seeded slugs and tracked titles found among the author's newest articles, so an edited article is tracked by its new title.
6. `TEST_ENV=local` (a Conduit clone on `localhost:3000`, see the README) is the fallback when the demo is down or throttled; the same suite, no limiter.
