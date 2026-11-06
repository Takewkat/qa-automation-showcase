import { randomUUID } from "node:crypto";

import {
  DEFAULT_FLAGS,
  cityOf,
  type Flags,
  type HistoryEntry,
  type Offer,
} from "../domain/state-machine.ts";
import type { ListQuery } from "../domain/schemas.ts";

/** A company configuration as stored and returned. */
export type Configuration = Flags & { companyId: string; updatedAt: string };
type Row = { offer: Offer; seq: number };
type SortKey = "createdAt" | "updatedAt" | "title" | "publishedAt";
type Filter = (offer: Offer, query: ListQuery) => boolean;

const offers = new Map<string, Offer>();
const flags = new Map<string, Flags>();
const configurations = new Map<string, Configuration>();
const history = new Map<string, HistoryEntry[]>();

const contains = (haystack: string | null, needle?: string): boolean =>
  needle === undefined || (haystack ?? "").toLowerCase().includes(needle.toLowerCase());
const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const FILTERS: Filter[] = [
  (offer, query) => !query.status || query.status.includes(offer.status),
  (offer, query) => contains(offer.title, query.titleContains),
  (offer, query) => contains(cityOf(offer.location), query.locationCity),
  (offer, query) =>
    !query.createdAfter || Date.parse(offer.createdAt) >= Date.parse(query.createdAfter),
  (offer, query) =>
    !query.createdBefore || Date.parse(offer.createdAt) < Date.parse(query.createdBefore),
];

/** Orders by the sort key, descending with a - prefix; ties keep creation order in the same direction. */
function comparator(sort: ListQuery["sort"]): (a: Row, b: Row) => number {
  const direction = sort.startsWith("-") ? -1 : 1;
  const key = sort.replace("-", "") as SortKey;
  return (a, b) => direction * (compare(a.offer[key] ?? "", b.offer[key] ?? "") || a.seq - b.seq);
}

/** The company's offer by id; an unknown id and another company's offer look the same. */
export function findOffer(companyId: string, id: string): Offer | undefined {
  const offer = offers.get(id);
  return offer?.companyId === companyId ? offer : undefined;
}

/** Inserts the offer under a fresh id, with the flags it will follow from now on. */
export function createOffer(draft: Omit<Offer, "id">, snapshot: Flags): Offer {
  const offer = { id: randomUUID(), ...draft };
  offers.set(offer.id, offer);
  flags.set(offer.id, snapshot);
  return offer;
}

/** Replaces a stored offer and returns it. */
export function saveOffer(offer: Offer): Offer {
  offers.set(offer.id, offer);
  return offer;
}

/** The flags snapshotted when the offer was created. */
export const flagsOf = (id: string): Flags => flags.get(id) ?? DEFAULT_FLAGS;

/** Removes the offer, its snapshot and its history. */
export function deleteOffer(id: string): void {
  offers.delete(id);
  flags.delete(id);
  history.delete(id);
}

/** One page of the company's offers matching the query, plus the total before paging. */
export function listOffers(
  companyId: string,
  query: ListQuery,
): { content: Offer[]; total: number } {
  const rows = [...offers.values()]
    .filter((offer) => offer.companyId === companyId && FILTERS.every((keep) => keep(offer, query)))
    .map((offer, seq) => ({ offer, seq }))
    .sort(comparator(query.sort));
  const start = query.page * query.size;
  return {
    content: rows.slice(start, start + query.size).map((row) => row.offer),
    total: rows.length,
  };
}

/** The company's configuration; a company never configured gets the defaults, stored on first read. */
export function getConfiguration(companyId: string, now: string): Configuration {
  const existing = configurations.get(companyId);
  if (existing) return existing;
  return saveConfiguration({ ...DEFAULT_FLAGS, companyId, updatedAt: now });
}

/** Replaces the company's configuration and returns it. */
export function saveConfiguration(configuration: Configuration): Configuration {
  configurations.set(configuration.companyId, configuration);
  return configuration;
}

/** The offer's transitions in the order they happened. */
export const getHistory = (id: string): HistoryEntry[] => history.get(id) ?? [];

/** Appends a transition to the offer's history under a fresh id. */
export function appendHistory(id: string, entry: Omit<HistoryEntry, "id">): void {
  history.set(id, [...getHistory(id), { id: randomUUID(), ...entry }]);
}
