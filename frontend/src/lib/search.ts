import type { Game, GameSignal, SearchIntent } from "../types";

const defaultIntent: SearchIntent = {
  maxPrice: 70,
  minRating: 0,
  hasReviews: false,
  tags: [],
  mode: "player",
  sortBy: null,
  sortDirection: "asc",
  limit: null,
  offset: 0,
};

const tagAliases: Record<string, string[]> = {
  Action: ["动作"],
  Adventure: ["冒险"],
  Atmospheric: ["氛围", "沉浸"],
  "Card Battler": ["卡牌"],
  "Co-op": ["合作", "协作"],
  Crafting: ["制作", "建造"],
  Exploration: ["探索"],
  FPS: ["第一人称射击"],
  Management: ["管理"],
  Multiplayer: ["多人", "联机"],
  "Open World": ["开放世界"],
  Puzzle: ["解谜", "谜题"],
  RPG: ["角色扮演"],
  Roguelike: ["肉鸽"],
  Shooter: ["射击", "枪战"],
  Simulation: ["模拟"],
  Singleplayer: ["单人"],
  Space: ["太空"],
  "Story Rich": ["剧情", "故事"],
  Strategy: ["策略"],
  Survival: ["生存"],
  "Survival Horror": ["恐怖", "生存恐怖"],
};

export function parseSearchIntent(query: string, availableTags: string[]): SearchIntent {
  const text = query.toLowerCase();
  const intent: SearchIntent = { ...defaultIntent, tags: [] };

  const explicitPrice = text.match(/(?:under|below|less than)\s+\$?(\d+)/);
  if (explicitPrice) {
    intent.maxPrice = Number(explicitPrice[1]);
  } else if (isBudgetPriceQuery(text)) {
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

  applyRankingIntent(text, intent);

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

  addAliasTags(text, tags, availableTags);

  intent.tags = prioritizeTags([...tags], text);
  return intent;
}

export function filterGames(games: Game[], intent: SearchIntent): Game[] {
  const filteredGames = games.filter((game) => {
    const priceMatch = game.price <= intent.maxPrice;
    const ratingMatch = game.rating >= intent.minRating;
    const reviewMatch = !intent.hasReviews || game.reviewCount > 0;
    const tagMatch = intent.tags.length === 0 || intent.tags.every((tag) => game.tags.includes(tag));
    return priceMatch && ratingMatch && reviewMatch && tagMatch;
  });

  return rankGames(filteredGames, intent);
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

function applyRankingIntent(text: string, intent: SearchIntent) {
  if (hasAny(text, ["most expensive", "highest price", "priciest"]) || text.includes("最贵") || /第[一二三四五]\s*贵/.test(text)) {
    intent.sortBy = "price";
    intent.sortDirection = "desc";
    if (shouldLimitSuperlative(text)) intent.limit = 1;
  } else if (hasAny(text, ["cheapest", "lowest price", "least expensive"]) || text.includes("最便宜")) {
    intent.sortBy = "price";
    intent.sortDirection = "asc";
    if (shouldLimitSuperlative(text)) intent.limit = 1;
  } else if (hasAny(text, ["cheap", "deal"]) || text.includes("便宜")) {
    intent.sortBy = "price";
    intent.sortDirection = "asc";
  } else if (hasAny(text, ["highest rated", "top rated", "best rated", "highly rated"]) || /\bbest\b/.test(text)) {
    intent.sortBy = "rating";
    intent.sortDirection = "desc";
  } else if (hasAny(text, ["most reviewed", "review volume", "most reviews"])) {
    intent.sortBy = "review_count";
    intent.sortDirection = "desc";
  } else if (hasAny(text, ["newest", "latest", "most recent"])) {
    intent.sortBy = "release_year";
    intent.sortDirection = "desc";
  } else if (text.includes("oldest")) {
    intent.sortBy = "release_year";
    intent.sortDirection = "asc";
  } else if (hasAny(text, ["highest revenue", "most revenue", "top revenue"])) {
    intent.sortBy = "revenue";
    intent.sortDirection = "desc";
  } else if (hasAny(text, ["most owned", "highest ownership"])) {
    intent.sortBy = "ownership";
    intent.sortDirection = "desc";
  }

  const requestedLimit = parseRequestedLimit(text);
  if (requestedLimit !== null) {
    intent.limit = requestedLimit;
    if (intent.sortBy === null) {
      intent.sortBy = "rating";
      intent.sortDirection = "desc";
    }
  }

  const ordinalRank = parseOrdinalRank(text);
  if (ordinalRank !== null) {
    intent.offset = ordinalRank - 1;
    intent.limit = 1;
  }
}

function isBudgetPriceQuery(text: string) {
  if (hasAny(text, ["cheapest", "lowest price", "least expensive"]) || text.includes("最便宜")) return false;
  return hasAny(text, ["cheap", "deal"]) || text.includes("便宜");
}

function shouldLimitSuperlative(text: string) {
  if (parseRequestedLimit(text) !== null) return false;
  if (/\b(?:all|list)\b/.test(text)) return false;
  if (/\bgames\b/.test(text) && !/\bgame\b/.test(text)) return false;
  return true;
}

function rankGames(games: Game[], intent: SearchIntent): Game[] {
  const sortedGames = [...games].sort((first, second) => {
    const comparison = compareGames(first, second, intent);
    return comparison === 0 ? first.name.localeCompare(second.name) : comparison;
  });
  const offset = Math.max(0, intent.offset);
  const end = intent.limit === null ? undefined : offset + Math.max(1, intent.limit);
  return sortedGames.slice(offset, end);
}

function compareGames(first: Game, second: Game, intent: SearchIntent) {
  const sortBy = intent.sortBy ?? "name";
  const firstValue = getSortValue(first, sortBy);
  const secondValue = getSortValue(second, sortBy);
  const direction = intent.sortDirection === "desc" ? -1 : 1;

  if (typeof firstValue === "string" && typeof secondValue === "string") {
    return firstValue.localeCompare(secondValue) * direction;
  }
  return (Number(firstValue) - Number(secondValue)) * direction;
}

function getSortValue(game: Game, sortBy: NonNullable<SearchIntent["sortBy"]>) {
  if (sortBy === "review_count") return game.reviewCount;
  if (sortBy === "release_year") return game.releaseYear;
  return game[sortBy];
}

function parseRequestedLimit(text: string) {
  const patterns = [/\btop\s+(\d{1,2})\b/, /\b(?:show|find|give me|list)\s+(?:the\s+)?(\d{1,2})\b/];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Math.max(1, Math.min(Number(match[1]), 50));
  }
  return null;
}

function parseOrdinalRank(text: string) {
  const chineseOrdinals: Record<string, number> = {
    "第一": 1,
    "第二": 2,
    "第三": 3,
    "第四": 4,
    "第五": 5,
  };
  for (const [token, rank] of Object.entries(chineseOrdinals)) {
    if (text.includes(token)) return rank;
  }

  const ordinalWords: Record<string, number> = {
    first: 1,
    "1st": 1,
    second: 2,
    "2nd": 2,
    third: 3,
    "3rd": 3,
    fourth: 4,
    "4th": 4,
    fifth: 5,
    "5th": 5,
  };
  for (const [token, rank] of Object.entries(ordinalWords)) {
    if (new RegExp(`\\b${token}\\b`).test(text)) return rank;
  }
  return null;
}

function hasAny(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function addAliasTags(text: string, tags: Set<string>, availableTags: string[]) {
  const availableTagLookup = new Map(availableTags.map((tag) => [tag.toLowerCase(), tag]));
  for (const [canonicalTag, aliases] of Object.entries(tagAliases)) {
    const tag = availableTagLookup.get(canonicalTag.toLowerCase());
    if (tag && aliases.some((alias) => text.includes(alias))) {
      tags.add(tag);
    }
  }
}
