import { faker } from "@faker-js/faker/locale/fr";

/** A company that exists nowhere else: the tenant of one test. */
export const generateCompanyId = (): string => faker.string.uuid();

/** An id no offer has. */
export const generateJobOfferId = (): string => faker.string.uuid();

export const generateJobTitle = (): string => faker.person.jobTitle();

export const generateCity = (): string => faker.location.city();
