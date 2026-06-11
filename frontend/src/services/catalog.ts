import { games } from "../data/games";
import { filterGames, getSignal, parseSearchIntent } from "../lib/search";
import type { Game, GameCollection, GameInsights, SavedGame, SearchResponse, ShortlistInsights } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const DEMO_USER_ID = "demo-user";
const DEFAULT_COLLECTION_ID = 1;
const DEFAULT_COLLECTION_NAME = "Default Shortlist";
const COLLECTION_STORAGE_KEY = "arcadeiq.collections";
const SAVED_COLLECTION_STORAGE_KEY = "arcadeiq.savedCollectionGameIds";
const LEGACY_SAVED_STORAGE_KEY = "arcadeiq.savedGameIds";
const DEFAULT_COLLECTION: GameCollection = {
  id: DEFAULT_COLLECTION_ID,
  userId: DEMO_USER_ID,
  name: DEFAULT_COLLECTION_NAME,
  description: "Games saved for quick comparison.",
  createdAt: "2026-06-11T00:00:00.000Z",
};

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

export async function getCollections(): Promise<GameCollection[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections?userId=${encodeURIComponent(DEMO_USER_ID)}`);
    if (!response.ok) {
      throw new Error(`Collections API returned ${response.status}`);
    }
    return (await response.json()) as GameCollection[];
  } catch (error) {
    console.warn("Using local mock collections because the backend API is unavailable.", error);
    return getLocalCollections();
  }
}

export async function createCollection(name: string): Promise<GameCollection> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, userId: DEMO_USER_ID }),
    });

    if (!response.ok) {
      throw new Error(`Create collection API returned ${response.status}`);
    }

    return (await response.json()) as GameCollection;
  } catch (error) {
    console.warn("Using local mock collection create because the backend API is unavailable.", error);
    return createLocalCollection(name);
  }
}

export async function getSavedGames(catalog: Game[], collectionId?: number): Promise<SavedGame[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games?${buildCollectionParams(collectionId)}`);
    if (!response.ok) {
      throw new Error(`Saved games API returned ${response.status}`);
    }
    return (await response.json()) as SavedGame[];
  } catch (error) {
    console.warn("Using local mock saved games because the backend API is unavailable.", error);
    return getLocalSavedGames(catalog, collectionId);
  }
}

export async function getShortlistInsights(savedGames: SavedGame[], collectionId?: number): Promise<ShortlistInsights> {
  if (savedGames.length === 0) {
    return buildMockShortlistInsights(savedGames, "rules");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/saved-games/insights?${buildCollectionParams(collectionId)}`);
    if (!response.ok) {
      throw new Error(`Shortlist insights API returned ${response.status}`);
    }
    return (await response.json()) as ShortlistInsights;
  } catch (error) {
    console.warn("Using local mock shortlist insights because the backend API is unavailable.", error);
    return buildMockShortlistInsights(savedGames, "mock");
  }
}

export async function saveGame(game: Game, catalog: Game[], collectionId?: number): Promise<SavedGame> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId: game.id, userId: DEMO_USER_ID, collectionId }),
    });

    if (!response.ok) {
      throw new Error(`Save game API returned ${response.status}`);
    }

    return (await response.json()) as SavedGame;
  } catch (error) {
    console.warn("Using local mock save because the backend API is unavailable.", error);
    const savedIds = new Set(readLocalSavedIds(collectionId));
    savedIds.add(game.id);
    writeLocalSavedIds(collectionId, [...savedIds]);
    return buildMockSavedGame(game, catalog, getCollectionId(collectionId));
  }
}

export async function removeSavedGame(gameId: number, collectionId?: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games/${gameId}?${buildCollectionParams(collectionId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Remove saved game API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock unsave because the backend API is unavailable.", error);
    writeLocalSavedIds(
      collectionId,
      readLocalSavedIds(collectionId).filter((id) => id !== gameId),
    );
  }
}

export async function clearSavedGames(collectionId?: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games?${buildCollectionParams(collectionId)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Clear saved games API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock clear shortlist because the backend API is unavailable.", error);
    writeLocalSavedIds(collectionId, []);
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

function buildCollectionParams(collectionId?: number) {
  const params = new URLSearchParams({ userId: DEMO_USER_ID });
  if (collectionId !== undefined) {
    params.set("collectionId", collectionId.toString());
  }
  return params.toString();
}

function getCollectionId(collectionId?: number) {
  return collectionId ?? DEFAULT_COLLECTION_ID;
}

function getLocalSavedGames(catalog: Game[], collectionId?: number): SavedGame[] {
  return readLocalSavedIds(collectionId)
    .map((gameId) => catalog.find((game) => game.id === gameId) ?? games.find((game) => game.id === gameId))
    .filter((game): game is Game => Boolean(game))
    .map((game) => buildMockSavedGame(game, catalog, getCollectionId(collectionId)));
}

function buildMockSavedGame(game: Game, catalog: Game[], collectionId: number): SavedGame {
  const existingIndex = catalog.findIndex((candidate) => candidate.id === game.id);
  return {
    id: collectionId * 1000 + (existingIndex >= 0 ? existingIndex + 1 : game.id),
    userId: DEMO_USER_ID,
    collectionId,
    gameId: game.id,
    createdAt: new Date().toISOString(),
    game,
  };
}

function getLocalCollections(): GameCollection[] {
  try {
    const rawValue = window.localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (!rawValue) return [DEFAULT_COLLECTION];
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [DEFAULT_COLLECTION];
    const collections = parsed.filter(isGameCollection);
    if (collections.some((collection) => collection.id === DEFAULT_COLLECTION_ID)) {
      return collections;
    }
    return [DEFAULT_COLLECTION, ...collections];
  } catch {
    return [DEFAULT_COLLECTION];
  }
}

function createLocalCollection(name: string): GameCollection {
  const collections = getLocalCollections();
  const existing = collections.find((collection) => collection.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;

  const collection: GameCollection = {
    id: Math.max(...collections.map((item) => item.id), DEFAULT_COLLECTION_ID) + 1,
    userId: DEMO_USER_ID,
    name,
    description: "",
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(COLLECTION_STORAGE_KEY, JSON.stringify([...collections, collection]));
  return collection;
}

function isGameCollection(value: unknown): value is GameCollection {
  if (!value || typeof value !== "object") return false;
  const collection = value as Partial<GameCollection>;
  return (
    typeof collection.id === "number" &&
    typeof collection.userId === "string" &&
    typeof collection.name === "string" &&
    typeof collection.description === "string" &&
    typeof collection.createdAt === "string"
  );
}

function readLocalSavedIds(collectionId?: number): number[] {
  try {
    const rawValue = window.localStorage.getItem(SAVED_COLLECTION_STORAGE_KEY);
    if (!rawValue) {
      return collectionId === undefined || collectionId === DEFAULT_COLLECTION_ID ? readLegacySavedIds() : [];
    }
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const savedIds = (parsed as Record<string, unknown>)[getCollectionId(collectionId).toString()];
    return Array.isArray(savedIds) ? savedIds.filter((value): value is number => Number.isInteger(value)) : [];
  } catch {
    return [];
  }
}

function readLegacySavedIds(): number[] {
  try {
    const rawValue = window.localStorage.getItem(LEGACY_SAVED_STORAGE_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((value): value is number => Number.isInteger(value)) : [];
  } catch {
    return [];
  }
}

function writeLocalSavedIds(collectionId: number | undefined, gameIds: number[]) {
  const savedMap = readLocalSavedMap();
  savedMap[getCollectionId(collectionId).toString()] = [...new Set(gameIds)];
  window.localStorage.setItem(SAVED_COLLECTION_STORAGE_KEY, JSON.stringify(savedMap));
  window.localStorage.removeItem(LEGACY_SAVED_STORAGE_KEY);
}

function readLocalSavedMap(): Record<string, number[]> {
  try {
    const rawValue = window.localStorage.getItem(SAVED_COLLECTION_STORAGE_KEY);
    if (!rawValue) {
      const legacyIds = readLegacySavedIds();
      return legacyIds.length > 0 ? { [DEFAULT_COLLECTION_ID.toString()]: legacyIds } : {};
    }
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const savedMap: Record<string, number[]> = {};
    for (const [collectionId, values] of Object.entries(parsed as Record<string, unknown>)) {
      savedMap[collectionId] = Array.isArray(values) ? values.filter((value): value is number => Number.isInteger(value)) : [];
    }
    return savedMap;
  } catch {
    return {};
  }
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
        title: "Collection Intelligence",
        caption: "Mock fallback",
        body: "Save games to this collection to compare pricing, sentiment, and genre concentration.",
        bullets: [
          "Start with two or three games from different tags.",
          "Use collections to separate player wishlists from developer research.",
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
      title: "Collection Intelligence",
      caption: "Mock fallback",
      body: `This collection leans ${averagePrice <= 25 ? "accessible" : "premium"} with ${tagPhrase} demand. ${strongestGame.name} is the strongest sentiment anchor at ${strongestGame.rating.toFixed(1)} rating.`,
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
