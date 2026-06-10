import { games } from "../data/games";
import { filterGames, getSignal, parseSearchIntent } from "../lib/search";
import type { Game, GameInsights, SearchResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export async function getCatalog(): Promise<Game[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/games`);
    if (!response.ok) {
      throw new Error(`Catalog API returned ${response.status}`);
    }
    return (await response.json()) as Game[];
  } catch (error) {
    console.warn("Using local mock catalog because the backend API is unavailable.", error);
    return games;
  }
}

export function getMockCatalog(): Game[] {
  return games;
}

export async function getGameDetail(gameId: number, catalog: Game[]): Promise<Game | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    if (!response.ok) {
      throw new Error(`Game detail API returned ${response.status}`);
    }
    return (await response.json()) as Game;
  } catch (error) {
    console.warn("Using local mock game detail because the backend API is unavailable.", error);
    return catalog.find((game) => game.id === gameId) ?? games.find((game) => game.id === gameId) ?? null;
  }
}

export async function getGameInsights(game: Game): Promise<GameInsights> {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${game.id}/insights`);
    if (!response.ok) {
      throw new Error(`Game insights API returned ${response.status}`);
    }
    return (await response.json()) as GameInsights;
  } catch (error) {
    console.warn("Using local mock game insights because the backend API is unavailable.", error);
    return buildMockInsights(game);
  }
}

export async function searchCatalog(query: string, availableTags: string[], catalog: Game[]): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Search API returned ${response.status}`);
    }

    return (await response.json()) as SearchResponse;
  } catch (error) {
    console.warn("Using local mock search because the backend API is unavailable.", error);
    const intent = parseSearchIntent(query, availableTags);
    return {
      intent,
      games: filterGames(catalog, intent),
      source: "mock",
    };
  }
}

function buildMockInsights(game: Game): GameInsights {
  const signal = getSignal(game);
  const primaryTag = game.tags[0] ?? "genre";
  const secondaryTags = game.tags.slice(1, 3);
  const tagPhrase = secondaryTags.length > 0 ? secondaryTags.join(" and ") : primaryTag;

  return {
    gameId: game.id,
    signal,
    reviewIntelligence: {
      title: "Review Intelligence",
      caption: "Mock fallback",
      body: `${game.name} is showing ${game.rating >= 4.5 ? "very strong" : "steady"} review sentiment. The strongest positioning comes from ${primaryTag} identity and ${tagPhrase} demand.`,
      bullets: [
        `Common praise: ${primaryTag} identity and clear audience fit.`,
        `Review volume: ${game.reviewCount} player reviews available for summarization.`,
        `Recommendation: surface to players who prefer ${tagPhrase}.`,
      ],
    },
    developerOpportunity: {
      title: "Developer Copilot",
      caption: "Mock fallback",
      body: `${game.developer} can use this title as a ${signal.toLowerCase()} catalog signal with ${formatCompact(game.ownership)} owners and $${formatCompact(game.revenue)} visible revenue.`,
      bullets: [
        `Market signal: ${primaryTag} demand is visible in the local catalog.`,
        `Price signal: ${game.price <= 25 ? "accessible" : "premium"} positioning.`,
        "Next step: connect this panel to real ownership, purchase, and review tables.",
      ],
    },
    playerRecommendation: {
      title: "Player Recommendation",
      caption: "Mock fallback",
      body: `This is a good match for players who want ${primaryTag} and ${tagPhrase} with a ${game.price <= 25 ? "friendly" : "premium"} price point.`,
      bullets: [
        `Signal: ${signal} based on rating and review volume.`,
        `Price: ${game.price === 0 ? "Free" : `$${game.price.toFixed(2)}`}.`,
        `Bundle opportunity: pair with adjacent ${primaryTag.toLowerCase()} games.`,
      ],
    },
    source: "mock",
  };
}

function formatCompact(value: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
