import { games } from "../data/games";
import { filterGames, getSignal, parseSearchIntent } from "../lib/search";
import type { Game, GameCollection, GameInsights, SavedGame, SearchResponse, ShortlistInsights } from "../types";
import { getStoredAuthToken } from "./users";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
const DEFAULT_COLLECTION_ID = 1;
const DEFAULT_COLLECTION_NAME = "Default Shortlist";
const COLLECTION_STORAGE_KEY = "arcadeiq.collections";
const SAVED_COLLECTION_STORAGE_KEY = "arcadeiq.savedCollectionGameIds";
const LEGACY_SAVED_STORAGE_KEY = "arcadeiq.savedGameIds";

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

export async function getCollections(userId: string): Promise<GameCollection[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections?userId=${encodeURIComponent(userId)}`, {
      headers: buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Collections API returned ${response.status}`);
    }
    return (await response.json()) as GameCollection[];
  } catch (error) {
    console.warn("Using local mock collections because the backend API is unavailable.", error);
    return getLocalCollections(userId);
  }
}

export async function createCollection(name: string, userId: string): Promise<GameCollection> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ name, userId }),
    });

    if (!response.ok) {
      throw new Error(`Create collection API returned ${response.status}`);
    }

    return (await response.json()) as GameCollection;
  } catch (error) {
    console.warn("Using local mock collection create because the backend API is unavailable.", error);
    return createLocalCollection(name, userId);
  }
}

export async function updateCollection(collectionId: number, name: string, userId: string): Promise<GameCollection> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "PATCH",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ name, userId }),
    });

    if (!response.ok) {
      throw new Error(`Update collection API returned ${response.status}`);
    }

    return (await response.json()) as GameCollection;
  } catch (error) {
    console.warn("Using local mock collection update because the backend API is unavailable.", error);
    return updateLocalCollection(collectionId, name, userId);
  }
}

export async function deleteCollection(collectionId: number, userId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Delete collection API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock collection delete because the backend API is unavailable.", error);
    deleteLocalCollection(collectionId, userId);
  }
}

export async function getSavedGames(catalog: Game[], userId: string, collectionId?: number): Promise<SavedGame[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games?${buildCollectionParams(userId, collectionId)}`, {
      headers: buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Saved games API returned ${response.status}`);
    }
    return (await response.json()) as SavedGame[];
  } catch (error) {
    console.warn("Using local mock saved games because the backend API is unavailable.", error);
    return getLocalSavedGames(catalog, userId, collectionId);
  }
}

export async function getShortlistInsights(savedGames: SavedGame[], userId: string, collectionId?: number): Promise<ShortlistInsights> {
  if (savedGames.length === 0) {
    return buildMockShortlistInsights(savedGames, userId, "rules");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/saved-games/insights?${buildCollectionParams(userId, collectionId)}`, {
      headers: buildAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Shortlist insights API returned ${response.status}`);
    }
    return (await response.json()) as ShortlistInsights;
  } catch (error) {
    console.warn("Using local mock shortlist insights because the backend API is unavailable.", error);
    return buildMockShortlistInsights(savedGames, userId, "mock");
  }
}

export async function saveGame(game: Game, catalog: Game[], userId: string, collectionId?: number): Promise<SavedGame> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games`, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: JSON.stringify({ gameId: game.id, userId, collectionId }),
    });

    if (!response.ok) {
      throw new Error(`Save game API returned ${response.status}`);
    }

    return (await response.json()) as SavedGame;
  } catch (error) {
    console.warn("Using local mock save because the backend API is unavailable.", error);
    const savedIds = new Set(readLocalSavedIds(userId, collectionId));
    savedIds.add(game.id);
    writeLocalSavedIds(userId, collectionId, [...savedIds]);
    return buildMockSavedGame(game, catalog, userId, getCollectionId(collectionId));
  }
}

export async function removeSavedGame(gameId: number, userId: string, collectionId?: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games/${gameId}?${buildCollectionParams(userId, collectionId)}`, {
      method: "DELETE",
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Remove saved game API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock unsave because the backend API is unavailable.", error);
    writeLocalSavedIds(
      userId,
      collectionId,
      readLocalSavedIds(userId, collectionId).filter((id) => id !== gameId),
    );
  }
}

export async function clearSavedGames(userId: string, collectionId?: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/saved-games?${buildCollectionParams(userId, collectionId)}`, {
      method: "DELETE",
      headers: buildAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Clear saved games API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Using local mock clear shortlist because the backend API is unavailable.", error);
    writeLocalSavedIds(userId, collectionId, []);
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

function buildAuthHeaders(headers: Record<string, string> = {}) {
  const token = getStoredAuthToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

function buildJsonHeaders() {
  return buildAuthHeaders({ "Content-Type": "application/json" });
}

function buildCollectionParams(userId: string, collectionId?: number) {
  const params = new URLSearchParams({ userId });
  if (collectionId !== undefined) {
    params.set("collectionId", collectionId.toString());
  }
  return params.toString();
}

function getCollectionId(collectionId?: number) {
  return collectionId ?? DEFAULT_COLLECTION_ID;
}

function getLocalSavedGames(catalog: Game[], userId: string, collectionId?: number): SavedGame[] {
  return readLocalSavedIds(userId, collectionId)
    .map((gameId) => catalog.find((game) => game.id === gameId) ?? games.find((game) => game.id === gameId))
    .filter((game): game is Game => Boolean(game))
    .map((game) => buildMockSavedGame(game, catalog, userId, getCollectionId(collectionId)));
}

function buildMockSavedGame(game: Game, catalog: Game[], userId: string, collectionId: number): SavedGame {
  const existingIndex = catalog.findIndex((candidate) => candidate.id === game.id);
  return {
    id: collectionId * 1000 + (existingIndex >= 0 ? existingIndex + 1 : game.id),
    userId,
    collectionId,
    gameId: game.id,
    createdAt: new Date().toISOString(),
    game,
  };
}

function buildDefaultCollection(userId: string): GameCollection {
  return {
    id: DEFAULT_COLLECTION_ID,
    userId,
    name: DEFAULT_COLLECTION_NAME,
    description: "Games saved for quick comparison.",
    createdAt: "2026-06-11T00:00:00.000Z",
  };
}

function getLocalCollections(userId: string): GameCollection[] {
  const defaultCollection = buildDefaultCollection(userId);
  try {
    const rawValue = window.localStorage.getItem(getUserStorageKey(COLLECTION_STORAGE_KEY, userId));
    if (!rawValue) return [defaultCollection];
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [defaultCollection];
    const collections = parsed.filter(isGameCollection);
    if (collections.some((collection) => collection.id === DEFAULT_COLLECTION_ID)) {
      return collections;
    }
    return [defaultCollection, ...collections];
  } catch {
    return [defaultCollection];
  }
}

function createLocalCollection(name: string, userId: string): GameCollection {
  const collections = getLocalCollections(userId);
  const existing = collections.find((collection) => collection.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;

  const collection: GameCollection = {
    id: Math.max(...collections.map((item) => item.id), DEFAULT_COLLECTION_ID) + 1,
    userId,
    name,
    description: "",
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(getUserStorageKey(COLLECTION_STORAGE_KEY, userId), JSON.stringify([...collections, collection]));
  return collection;
}

function updateLocalCollection(collectionId: number, name: string, userId: string): GameCollection {
  const collections = getLocalCollections(userId);
  const collection = collections.find((item) => item.id === collectionId);
  if (!collection) {
    throw new Error("Collection not found");
  }
  if (collection.name === DEFAULT_COLLECTION_NAME) {
    throw new Error("Default collection cannot be renamed");
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    throw new Error("Collection name is required");
  }

  const duplicate = collections.find(
    (item) => item.id !== collectionId && item.name.toLowerCase() === normalizedName.toLowerCase(),
  );
  if (duplicate) {
    throw new Error("Collection name already exists");
  }

  const updated = { ...collection, name: normalizedName };
  window.localStorage.setItem(
    getUserStorageKey(COLLECTION_STORAGE_KEY, userId),
    JSON.stringify(collections.map((item) => (item.id === collectionId ? updated : item))),
  );
  return updated;
}

function deleteLocalCollection(collectionId: number, userId: string) {
  const collections = getLocalCollections(userId);
  const collection = collections.find((item) => item.id === collectionId);
  if (!collection) return;
  if (collection.name === DEFAULT_COLLECTION_NAME) {
    throw new Error("Default collection cannot be deleted");
  }

  window.localStorage.setItem(
    getUserStorageKey(COLLECTION_STORAGE_KEY, userId),
    JSON.stringify(collections.filter((item) => item.id !== collectionId)),
  );

  const savedMap = readLocalSavedMap(userId);
  delete savedMap[collectionId.toString()];
  window.localStorage.setItem(getUserStorageKey(SAVED_COLLECTION_STORAGE_KEY, userId), JSON.stringify(savedMap));
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

function readLocalSavedIds(userId: string, collectionId?: number): number[] {
  try {
    const rawValue = window.localStorage.getItem(getUserStorageKey(SAVED_COLLECTION_STORAGE_KEY, userId));
    if (!rawValue) {
      return collectionId === undefined || collectionId === DEFAULT_COLLECTION_ID ? readLegacySavedIds(userId) : [];
    }
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
    const savedIds = (parsed as Record<string, unknown>)[getCollectionId(collectionId).toString()];
    return Array.isArray(savedIds) ? savedIds.filter((value): value is number => Number.isInteger(value)) : [];
  } catch {
    return [];
  }
}

function readLegacySavedIds(userId: string): number[] {
  try {
    if (userId !== "demo-user") return [];
    const rawValue = window.localStorage.getItem(LEGACY_SAVED_STORAGE_KEY);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter((value): value is number => Number.isInteger(value)) : [];
  } catch {
    return [];
  }
}

function writeLocalSavedIds(userId: string, collectionId: number | undefined, gameIds: number[]) {
  const savedMap = readLocalSavedMap(userId);
  savedMap[getCollectionId(collectionId).toString()] = [...new Set(gameIds)];
  window.localStorage.setItem(getUserStorageKey(SAVED_COLLECTION_STORAGE_KEY, userId), JSON.stringify(savedMap));
  window.localStorage.removeItem(LEGACY_SAVED_STORAGE_KEY);
}

function readLocalSavedMap(userId: string): Record<string, number[]> {
  try {
    const rawValue = window.localStorage.getItem(getUserStorageKey(SAVED_COLLECTION_STORAGE_KEY, userId));
    if (!rawValue) {
      const legacyIds = readLegacySavedIds(userId);
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

function getUserStorageKey(baseKey: string, userId: string) {
  return `${baseKey}.${userId}`;
}

function buildMockShortlistInsights(savedGames: SavedGame[], userId: string, source: "rules" | "mock"): ShortlistInsights {
  const savedCount = savedGames.length;
  if (savedCount === 0) {
    return {
      userId,
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
    userId,
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
