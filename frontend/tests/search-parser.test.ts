import { describe, expect, it } from "vitest";
import { games } from "../src/data/games";
import { filterGames, parseSearchIntent } from "../src/lib/search";
import contract from "../../tests/fixtures/search-contract.json";

const tags = [...new Set(games.flatMap((game) => game.tags))];

describe("literal title search", () => {
  it("finds Celeste instead of returning an unrelated catalog", () => {
    const intent = parseSearchIntent("Celeste", tags);
    expect(intent).toMatchObject({ titleQuery: "celeste", maxPrice: null });
    expect(filterGames(games, intent).map((game) => game.name)).toEqual(["Celeste"]);
  });

  it("keeps decimal budgets when combined with a title", () => {
    expect(parseSearchIntent("Find Celeste under 20.99", tags)).toMatchObject({
      titleQuery: "celeste", maxPrice: 20.99,
    });
  });

  it("does not impose an unrequested budget on blank searches", () => {
    const premium = { ...games[0], id: 999, name: "Premium", price: 90 };
    expect(filterGames([premium], parseSearchIntent("  ", tags))).toEqual([premium]);
  });
});

describe("shared frontend and API search contract", () => {
  it.each(contract.cases)("$query", ({ query, expected, gameIds }) => {
    const intent = parseSearchIntent(query, contract.availableTags, contract.games.map((game) => game.name));
    expect(intent).toMatchObject(expected);
    expect(filterGames(contract.games, intent).map((game) => game.id)).toEqual(gameIds);
  });
});

describe("existing search examples", () => {
  it.each([
    ["找第二贵的FPS游戏", "Find the second most expensive FPS game"],
    ["找便宜且有评价的多人生存游戏", "Find cheap multiplayer survival games with good reviews"],
    ["找25美元以下的高评分剧情游戏", "Show highly rated story rich games under 25 dollars"],
    ["为开发者分析探索类游戏", "Find exploration games for developer catalog analysis"],
  ])("keeps Chinese preset semantics equivalent: %s", (chinese, english) => {
    expect(parseSearchIntent(chinese, tags)).toEqual(parseSearchIntent(english, tags));
  });

  it("retains the developer catalog and Chinese tag examples", () => {
    expect(parseSearchIntent("Find premium exploration games for developer catalog analysis", ["Exploration"])).toMatchObject({
      titleQuery: null, tags: ["Exploration"], maxPrice: null, mode: "developer",
    });
    expect(parseSearchIntent("找最便宜的多人 生存 game", ["Multiplayer", "Survival"])).toMatchObject({
      titleQuery: null, tags: ["Multiplayer", "Survival"], maxPrice: null,
      sortBy: "price", sortDirection: "asc", limit: 1,
    });
  });

  it("treats title punctuation literally", () => {
    const title = { ...games[0], name: "A_B (Test)" };
    const other = { ...games[0], name: "AXB (Test)" };
    expect(filterGames([title, other], parseSearchIntent('"A_B (Test)"', []))).toEqual([title]);
  });
});
