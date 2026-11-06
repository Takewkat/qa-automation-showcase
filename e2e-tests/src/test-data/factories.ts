import { faker } from "@faker-js/faker/locale/fr";

import type { NewArticle, NewUser } from "@e2e/api";

const BASE36 = 36;
const PASSWORD_LENGTH = 12;
const TITLE_WORDS = 3;

/** One id per worker, carried by every username, title and comment it creates: qa-<base36 time>-<worker index>. */
export const RUN_ID = `qa-${Date.now().toString(BASE36)}-${process.env.TEST_WORKER_INDEX ?? "0"}`;

let users = 0;

/** A user that exists nowhere else: the run id and a counter as username and email; the demo checks the email only. */
export const uniqueUser = (): NewUser => {
  users += 1;
  const username = `${RUN_ID}-${users}`;
  return {
    username,
    email: `${username}@example.com`,
    password: faker.internet.password({ length: PASSWORD_LENGTH }),
  };
};

/** An article whose title carries the run id and is slug-safe: letters, digits and spaces only; no tag, the demo keeps them forever. */
export const articleDraft = (overrides: Partial<NewArticle> = {}): NewArticle => ({
  title: `${RUN_ID} ${faker.lorem.words(TITLE_WORDS)}`,
  description: faker.lorem.sentence(),
  body: faker.lorem.paragraph(),
  tagList: [],
  ...overrides,
});

/** A comment body that carries the run id. */
export const commentText = (): string => `${RUN_ID} ${faker.lorem.sentence()}`;
