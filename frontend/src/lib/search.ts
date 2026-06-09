import type { Game, GameSignal, SearchIntent } from "../types";

const defaultIntent: SearchIntent = {
  maxPrice: 70,
  minRating: 0,
  hasReviews: false,
  tags: [],
  mode: "player",
};

export function parseSearchIntent(query: string, availableTags: string[]): SearchIntent {
  const text = query.toLowerCase();
  const intent: SearchIntent = { ...defaultIntent, tags: [] };

  const explicitPrice = text.match(/(?:under|below|less than)\s+\$?(\d+)/);
  if (explicitPrice) {
    intent.maxPrice = Number(explicitPrice[1]);
  } else if (text.includes("cheap") || text.includes("deal")) {
    intent.maxPrice = 35;
  }

  if (text.includes("highly rated") || text.includes("top rated")) {
    intent.minRating = 4.4;
    intent.hasReviews = true;
  } else if (text.includes("good reviews")) {
    intent.minRating = 0;
    intent.hasReviews = true;
  } else if (text.includes("review") || text.includes("rated")) {
    intent.hasReviews = true;
  }

  if (text.includes("developer") || text.includes("catalog") || text.includes("revenue")) {
    intent.mode = "developer";
  }

  const tags = new Set<string>();
  for (const tag of availableTags) {
    const normalized = tag.toLowerCase();
    const singleWord = !normalized.includes(" ");
    if (text.includes(normalized) || (singleWord && text.includes(normalized.split(" ")[0]))) {
      tags.add(tag);
    }
  }

  if (text.includes("story")) tags.add("Story Rich");
  if (text.includes("horror")) tags.add("Survival Horror");
  if (text.includes("multiplayer")) tags.add("Multiplayer");

  intent.tags = prioritizeTags([...tags], text);
  return intent;
}

export function filterGames(games: Game[], intent: SearchIntent): Game[] {
  return games.filter((game) => {
    const priceMatch = game.price <= intent.maxPrice;
    const ratingMatch = game.rating >= intent.minRating;
    const reviewMatch = !intent.hasReviews || game.reviewCount > 0;
    const tagMatch = intent.tags.length === 0 || intent.tags.every((tag) => game.tags.includes(tag));
    return priceMatch && ratingMatch && reviewMatch && tagMatch;
  });
}

export function getSignal(game: Game): GameSignal {
  if (game.rating >= 4.6 && game.reviewCount >= 150) return "Strong";
  if (game.rating >= 4.1) return "Watch";
  return "Risk";
}

function prioritizeTags(tags: string[], text: string): string[] {
  const priority: string[] = [];
  const push = (tag: string) => {
    if (tags.includes(tag) && !priority.includes(tag)) priority.push(tag);
  };

  if (text.includes("multiplayer")) push("Multiplayer");
  if (text.includes("survival")) push("Survival");
  if (text.includes("story")) push("Story Rich");
  if (text.includes("exploration")) push("Exploration");
  if (text.includes("puzzle")) push("Puzzle");

  for (const tag of tags) push(tag);
  return priority.slice(0, 3);
}
