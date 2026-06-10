import { games } from "../data/games";
import { filterGames, getSignal, parseSearchIntent } from "../lib/search";
import type { Game, GameInsights, SavedGame, SearchResponse, ShortlistInsights } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const DEMO_USER_ID = "demo-user";
const SAVED_STORAGE_KEY = "arcadeiq.savedGameIds";

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

export async function getSavedGames(catalog: Game[]): Promise<SavedGame[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games?userId=${encodeURIComponent(DEMO_USER_ID)}`);
    if (!response.ok) {
      throw new Error(`Saved games API returned ${response.status}`);
    }
    return (await response.json()) as SavedGame[];
  } catch (error) {
    console.warn("Using local mock saved games because the backend API is unavailable.", error);
    return getLocalSavedGames(catalog);
  }
}

export async function getShortlistInsights(savedGames: SavedGame[]): Promise<ShortlistInsights> {
  if (savedGames.length === 0) {
    return buildMockShortlistInsights(savedGames, "rules");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/saved-games/insights?userId=${encodeURIComponent(DEMO_USER_ID)}`);
    if (!response.ok) {
      throw new Error(`Shortlist insights API returned ${response.status}`);
    }
    return (await response.json()) as ShortlistInsights;
  } catch (error) {
    console.warn("Using local mock shortlist insights because the backend API is unavailable.", error);
    return buildMockShortlistInsights(savedGames, "mock");
  }
}

export async function saveGame(game: Game, catalog: Game[]): Promise<SavedGame> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId: game.id, userId: DEMO_USER_ID }),
    });

    if (!response.ok) {
      throw new Error(`Save game API returned ${response.status}`);
    }

    return (await response.json()) as SavedGame;
  } catch (error) {
    console.warn("Using local mock save because the backend API is unavailable.", error);
    const savedIds = new Set(readLocalSavedIds());
    savedIds.add(game.id);
    writeLocalSavedIds([...savedIds]);
    return buildMockSavedGame(game, catalog);
  }
}

export async function removeSavedGame(gameId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games/${gameId}?userId=${encodeURIComponent(DEMO_USER_ID)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Remove saved game API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock unsave because the backend API is unavailable.", error);
    writeLocalSavedIds(readLocalSavedIds().filter((id) => id !== gameId));
  }
}

export async function clearSavedGames(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games?userId=${encodeURIComponent(DEMO_USER_ID)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Clear saved games API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock clear shortlist because the backend API is unavailable.", error);
    writeLocalSavedIds([]);
  }
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

function getLocalSavedGames(catalog: Game[]): SavedGame[] {
  return readLocalSavedIds()
    .map((gameId) => catalog.find((game) => game.id === gameId) ?? games.find((game) => game.id === gameId))
    .filter((game): game is Game => Boolean(game))
    .map((game) => buildMockSavedGame(game, catalog));
}

function buildMockSavedGame(game: Game, catalog: Game[]): SavedGame {
  const existingIndex = catalog.findIndex((candidate) => candidate.id === game.id);
  return {
    id: existingIndex >= 0 ? existingIndex + 1 : game.id,
    userId: DEMO_USER_ID,
    gameId: game.id,
    createdAt: new Date().toISOString(),
    game,
  };
}

function readLocalSavedIds(): number[] {
  try {
    const rawValue = window.localStorage.getItem(SAVED_STORAGE_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((value): value is number => Number.isInteger(value)) : [];
  } catch {
    return [];
  }
}

function writeLocalSavedIds(gameIds: number[]) {
  window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify([...new Set(gameIds)]));
}

function buildMockShortlistInsights(savedGames: SavedGame[], source: "rules" | "mock"): ShortlistInsights {
  const savedCount = savedGames.length;
  if (savedCount === 0) {
    return {
      userId: DEMO_USER_ID,
      savedCount: 0,
      averagePrice: 0,
      averageRating: 0,
      totalVisibleRevenue: 0,
      topTags: [],
      strategy: {
        title: "Shortlist Intelligence",
        caption: "Mock fallback",
        body: "Save games to build a market shortlist and compare pricing, sentiment, and genre concentration.",
        bullets: [
          "Start with two or three games from different tags.",
          "Use the shortlist to compare player fit and developer opportunity.",
          "Future AI summaries can use this endpoint as their context source.",
        ],
      },
      source,
    };
  }

  const selectedGames = savedGames.map((savedGame) => savedGame.game);
  const averagePrice = selectedGames.reduce((sum, game) => sum + game.price, 0) / savedCount;
  const averageRating = selectedGames.reduce((sum, game) => sum + game.rating, 0) / savedCount;
  const totalVisibleRevenue = selectedGames.reduce((sum, game) => sum + game.revenue, 0);
  const tagCounts = new Map<string, number>();
  for (const game of selectedGames) {
    for (const tag of game.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);
  const strongestGame = selectedGames.reduce((best, game) => (game.rating > best.rating ? game : best), selectedGames[0]);
  const tagPhrase = topTags.slice(0, 3).join(", ") || "mixed genres";

  return {
    userId: DEMO_USER_ID,
    savedCount,
    averagePrice: Number(averagePrice.toFixed(2)),
    averageRating: Number(averageRating.toFixed(2)),
    totalVisibleRevenue,
    topTags,
    strategy: {
      title: "Shortlist Intelligence",
      caption: "Mock fallback",
      body: `This shortlist leans ${averagePrice <= 25 ? "accessible" : "premium"} with ${tagPhrase} demand. ${strongestGame.name} is the strongest sentiment anchor at ${strongestGame.rating.toFixed(1)} rating.`,
      bullets: [
        `Saved games: ${savedCount}.`,
        `Average price: ${formatAveragePrice(averagePrice)}.`,
        `Visible revenue represented: $${formatCompact(totalVisibleRevenue)}.`,
        `Top tags: ${tagPhrase}.`,
      ],
    },
    source,
  };
}

function formatAveragePrice(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}
