import type { Game } from "../types";

// Catalog recommendations are repeatable editorial browsing, not personalized AI output.
export function recommendGames(catalog: readonly Game[]): Game[] {
  return [...catalog].sort((left, right) =>
    right.rating - left.rating ||
    right.reviewCount - left.reviewCount ||
    left.name.localeCompare(right.name, "en") ||
    left.id - right.id,
  ).slice(0, 6);
}
