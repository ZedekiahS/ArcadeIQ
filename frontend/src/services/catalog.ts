import { games } from "../data/games";
import { filterGames, getSignal, parseSearchIntent } from "../lib/search";
import type { Game, GameCollection, GameInsights, SavedGame, SearchResponse, ShortlistInsights } from "../types";
import { requestApi } from "./http";
import { DATA_MODE } from "./runtime";
import { requireAuthHeaders } from "./users";

const DEFAULT_COLLECTION_ID = 1;
const DEFAULT_COLLECTION_NAME = "Default Shortlist";
const COLLECTION_STORAGE_KEY = "arcadeiq.demo.collections";
const SAVED_COLLECTION_STORAGE_KEY = "arcadeiq.demo.savedCollectionGameIds";

export async function getCatalog(): Promise<Game[]> {
  if (DATA_MODE === "demo") return games;
  return requestApi<Game[]>("/games");
}

export async function getCollections(userId: string): Promise<GameCollection[]> {
  if (DATA_MODE === "demo") return getLocalCollections(userId);
  return requestApi<GameCollection[]>("/collections", { headers: requireAuthHeaders() });
}

export async function createCollection(name: string, userId: string): Promise<GameCollection> {
  if (DATA_MODE === "demo") return createLocalCollection(name, userId);
  return requestApi<GameCollection>("/collections", {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({ name }),
  });
}

export async function updateCollection(collectionId: number, name: string, userId: string): Promise<GameCollection> {
  if (DATA_MODE === "demo") return updateLocalCollection(collectionId, name, userId);
  return requestApi<GameCollection>(`/collections/${collectionId}`, {
    method: "PATCH",
    headers: buildJsonHeaders(),
    body: JSON.stringify({ name }),
  });
}

export async function deleteCollection(collectionId: number, userId: string): Promise<void> {
  if (DATA_MODE === "demo") return deleteLocalCollection(collectionId, userId);
  return requestApi<void>(`/collections/${collectionId}`, {
    method: "DELETE",
    headers: requireAuthHeaders(),
  });
}

export async function getSavedGames(catalog: Game[], userId: string, collectionId?: number): Promise<SavedGame[]> {
  if (DATA_MODE === "demo") return getLocalSavedGames(catalog, userId, collectionId);
  return requestApi<SavedGame[]>(`/saved-games${buildCollectionQuery(collectionId)}`, {
    headers: requireAuthHeaders(),
  });
}

export async function getShortlistInsights(savedGames: SavedGame[], userId: string, collectionId?: number): Promise<ShortlistInsights> {
  if (DATA_MODE === "demo") return buildMockShortlistInsights(savedGames, userId);
  return requestApi<ShortlistInsights>(`/saved-games/insights${buildCollectionQuery(collectionId)}`, {
    headers: requireAuthHeaders(),
  });
}

export async function saveGame(game: Game, catalog: Game[], userId: string, collectionId?: number): Promise<SavedGame> {
  if (DATA_MODE === "demo") {
    const savedIds = new Set(readLocalSavedIds(userId, collectionId));
    savedIds.add(game.id);
    writeLocalSavedIds(userId, collectionId, [...savedIds]);
    return buildMockSavedGame(game, catalog, userId, getCollectionId(collectionId));
  }
  return requestApi<SavedGame>("/saved-games", {
    method: "POST",
    headers: buildJsonHeaders(),
    body: JSON.stringify({ gameId: game.id, collectionId }),
  });
}

export async function removeSavedGame(gameId: number, userId: string, collectionId?: number): Promise<void> {
  if (DATA_MODE === "demo") {
    writeLocalSavedIds(
      userId,
      collectionId,
      readLocalSavedIds(userId, collectionId).filter((id) => id !== gameId),
    );
    return;
  }
  return requestApi<void>(`/saved-games/${gameId}${buildCollectionQuery(collectionId)}`, {
    method: "DELETE",
    headers: requireAuthHeaders(),
  });
}

export async function clearSavedGames(userId: string, collectionId?: number): Promise<void> {
  if (DATA_MODE === "demo") return writeLocalSavedIds(userId, collectionId, []);
  return requestApi<void>(`/saved-games${buildCollectionQuery(collectionId)}`, {
    method: "DELETE",
    headers: requireAuthHeaders(),
  });
}

export async function getGameDetail(gameId: number, catalog: Game[]): Promise<Game | null> {
  if (DATA_MODE === "demo") {
    return catalog.find((game) => game.id === gameId) ?? games.find((game) => game.id === gameId) ?? null;
  }
  return requestApi<Game>(`/games/${gameId}`);
}

export async function getGameInsights(game: Game): Promise<GameInsights> {
  if (DATA_MODE === "demo") return buildMockInsights(game);
  return requestApi<GameInsights>(`/games/${game.id}/insights`);
}

export async function searchCatalog(query: string, availableTags: string[], catalog: Game[]): Promise<SearchResponse> {
  if (DATA_MODE === "demo") {
    const intent = parseSearchIntent(query, availableTags);
    return { intent, games: filterGames(catalog, intent), source: "mock" };
  }
  return requestApi<SearchResponse>("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
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
      caption: "Demo rules",
      body: `${game.name} is showing ${game.rating >= 4.5 ? "very strong" : "steady"} review sentiment. The strongest positioning comes from ${primaryTag} identity and ${tagPhrase} demand.`,
      bullets: [
        `Common praise: ${primaryTag} identity and clear audience fit.`,
        `Review volume: ${game.reviewCount} player reviews available for summarization.`,
        `Recommendation: surface to players who prefer ${tagPhrase}.`,
      ],
    },
    developerOpportunity: {
      title: "Developer Copilot",
      caption: "Demo rules",
      body: `${game.developer} can use this title as a ${signal.toLowerCase()} catalog signal with ${formatCompact(game.ownership)} owners and $${formatCompact(game.revenue)} visible revenue.`,
      bullets: [
        `Market signal: ${primaryTag} demand is visible in the local catalog.`,
        `Price signal: ${game.price <= 25 ? "accessible" : "premium"} positioning.`,
        "Next step: connect this panel to real ownership, purchase, and review tables.",
      ],
    },
    playerRecommendation: {
      title: "Player Recommendation",
      caption: "Demo rules",
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

function buildJsonHeaders() {
  return requireAuthHeaders({ "Content-Type": "application/json" });
}

function buildCollectionQuery(collectionId?: number) {
  return collectionId === undefined ? "" : `?${new URLSearchParams({ collectionId: collectionId.toString() })}`;
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
  const rawValue = window.localStorage.getItem(getUserStorageKey(COLLECTION_STORAGE_KEY, userId));
  if (rawValue === null) return [defaultCollection];
  const parsed = JSON.parse(rawValue);
  if (!Array.isArray(parsed)) throw new Error("Saved demo collections are not a valid list.");
  const collections = parsed.filter(isGameCollection);
  if (collections.some((collection) => collection.id === DEFAULT_COLLECTION_ID)) {
    return collections;
  }
  return [defaultCollection, ...collections];
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

  // Read both records before changing either one so failed reads cannot erase data.
  const savedMap = readLocalSavedMap(userId);
  window.localStorage.setItem(
    getUserStorageKey(COLLECTION_STORAGE_KEY, userId),
    JSON.stringify(collections.filter((item) => item.id !== collectionId)),
  );

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
  return readLocalSavedMap(userId)[getCollectionId(collectionId).toString()] ?? [];
}

function writeLocalSavedIds(userId: string, collectionId: number | undefined, gameIds: number[]) {
  const savedMap = readLocalSavedMap(userId);
  savedMap[getCollectionId(collectionId).toString()] = [...new Set(gameIds)];
  window.localStorage.setItem(getUserStorageKey(SAVED_COLLECTION_STORAGE_KEY, userId), JSON.stringify(savedMap));
}

function readLocalSavedMap(userId: string): Record<string, number[]> {
  const rawValue = window.localStorage.getItem(getUserStorageKey(SAVED_COLLECTION_STORAGE_KEY, userId));
  if (rawValue === null) return {};
  const parsed = JSON.parse(rawValue);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Saved demo games are not a valid collection map.");
  }
  const savedMap: Record<string, number[]> = {};
  for (const [collectionId, values] of Object.entries(parsed as Record<string, unknown>)) {
    savedMap[collectionId] = Array.isArray(values) ? values.filter((value): value is number => Number.isInteger(value)) : [];
  }
  return savedMap;
}

function getUserStorageKey(baseKey: string, userId: string) {
  return `${baseKey}.${userId}`;
}

function buildMockShortlistInsights(savedGames: SavedGame[], userId: string): ShortlistInsights {
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
        caption: "Demo rules",
        body: "Save games to this collection to compare pricing, sentiment, and genre concentration.",
        bullets: [
          "Start with two or three games from different tags.",
          "Use collections to separate player wishlists from developer research.",
          "Future AI summaries can use this endpoint as their context source.",
        ],
      },
      source: "mock",
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
      caption: "Demo rules",
      body: `This collection leans ${averagePrice <= 25 ? "accessible" : "premium"} with ${tagPhrase} demand. ${strongestGame.name} is the strongest sentiment anchor at ${strongestGame.rating.toFixed(1)} rating.`,
      bullets: [
        `Saved games: ${savedCount}.`,
        `Average price: ${formatAveragePrice(averagePrice)}.`,
        `Visible revenue represented: $${formatCompact(totalVisibleRevenue)}.`,
        `Top tags: ${tagPhrase}.`,
      ],
    },
    source: "mock",
  };
}

function formatAveragePrice(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}
