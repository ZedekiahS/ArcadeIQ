import { describe, expect, it } from "vitest";
import { recommendGames } from "../src/lib/recommendations";
import type { Game } from "../src/types";

function game(id: number, name: string, rating: number, reviewCount: number): Game {
  return {
    id, name, rating, reviewCount, price: 99, releaseYear: 2024,
    developer: "Example", publisher: "Example", tags: ["Puzzle"],
    summary: "Example game", revenue: 0, ownership: 0,
  };
}

describe("catalog recommendations", () => {
  it("offers six highest-rated games with review and title tie-breaks without filtering price or genre", () => {
    const catalog = [
      game(1, "Popular", 4.1, 100000),
      game(2, "Zebra", 4.8, 100),
      game(3, "Alpine", 4.8, 100),
      game(4, "Reviewed", 4.8, 500),
      game(5, "Highest rated", 4.9, 1),
      game(6, "Sixth", 4.5, 50),
      game(7, "Seventh", 4.6, 50),
    ];
    const originalOrder = catalog.map(({ id }) => id);

    expect(recommendGames(catalog).map(({ id }) => id)).toEqual([5, 4, 3, 2, 7, 6]);
    expect(recommendGames([...catalog].reverse()).map(({ id }) => id)).toEqual([5, 4, 3, 2, 7, 6]);
    expect(catalog.map(({ id }) => id)).toEqual(originalOrder);
  });

  it("uses a stable ID for duplicate titles and handles small or empty catalogs", () => {
    expect(recommendGames([game(8, "Same", 4, 10), game(4, "Same", 4, 10)]).map(({ id }) => id)).toEqual([4, 8]);
    expect(recommendGames([])).toEqual([]);
  });
});
