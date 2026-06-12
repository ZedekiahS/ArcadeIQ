import {
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Brain,
  Check,
  CircleDollarSign,
  Folder,
  Gamepad2,
  KeyRound,
  LineChart,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  clearSavedGames,
  createCollection,
  deleteCollection,
  getCatalog,
  getCollections,
  getGameDetail,
  getGameInsights,
  getSavedGames,
  getShortlistInsights,
  removeSavedGame,
  saveGame,
  searchCatalog,
  updateCollection,
} from "./services/catalog";
import { createSessionUserId, getActiveSessionUserId, getKnownSessionUserIds, setActiveSessionUserId as persistSessionUserId } from "./services/session";
import {
  clearStoredAuthToken,
  ensureSessionUser,
  formatRoleLabel,
  getAuthenticatedUser,
  getStoredAuthToken,
  getUsers,
  loginUser,
} from "./services/users";
import type { Game, GameCollection, GameInsights, SavedGame, SearchIntent, ShortlistInsights, UserProfile, UserRole } from "./types";
import { filterGames, getSignal } from "./lib/search";

const exampleQueries = [
  "Find cheap multiplayer survival games with good reviews",
  "Show highly rated story rich games under 25 dollars",
  "Find premium exploration games for developer catalog analysis",
];

const initialIntent: SearchIntent = {
  maxPrice: 35,
  minRating: 0,
  hasReviews: true,
  tags: ["Multiplayer", "Survival"],
  mode: "player",
};

const DEFAULT_COLLECTION_NAME = "Default Shortlist";

function formatMoney(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

function formatCompact(value: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function formatSessionLabel(userId: string) {
  return userId.length > 18 ? `${userId.slice(0, 18)}...` : userId;
}

function buildGuestProfile(userId: string): UserProfile {
  const suffix = userId.replace(/^guest-/, "").slice(0, 8);
  return {
    id: userId,
    email: null,
    displayName: suffix ? `Guest ${suffix}` : "Guest User",
    role: "guest",
    isActive: true,
    createdAt: new Date().toISOString(),
  };
}

function mergeUserProfile(users: UserProfile[], profile: UserProfile) {
  return [profile, ...users.filter((user) => user.id !== profile.id)];
}

export default function App() {
  const [sessionUserId, setSessionUserId] = useState(getActiveSessionUserId);
  const [knownSessionUserIds, setKnownSessionUserIds] = useState(getKnownSessionUserIds);
  const [knownBackendUsers, setKnownBackendUsers] = useState<UserProfile[]>([]);
  const [activeUserProfile, setActiveUserProfile] = useState<UserProfile | null>(null);
  const [authenticatedUserProfile, setAuthenticatedUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [pendingAdminUserId, setPendingAdminUserId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [catalog, setCatalog] = useState<Game[]>([]);
  const [query, setQuery] = useState(exampleQueries[0]);
  const [intent, setIntent] = useState<SearchIntent>(initialIntent);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"player" | "developer">("player");
  const [searchResults, setSearchResults] = useState<Game[] | null>(null);
  const [searchSource, setSearchSource] = useState<"rules" | "deepseek" | "mock">("rules");
  const [selectedDetail, setSelectedDetail] = useState<Game | null>(null);
  const [insights, setInsights] = useState<GameInsights | null>(null);
  const [collections, setCollections] = useState<GameCollection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isEditingCollection, setIsEditingCollection] = useState(false);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [collectionActionError, setCollectionActionError] = useState("");
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [isCreatingSaveCollection, setIsCreatingSaveCollection] = useState(false);
  const [saveCollectionName, setSaveCollectionName] = useState("");
  const [savedGamesByCollection, setSavedGamesByCollection] = useState<Record<number, SavedGame[]>>({});
  const [shortlistInsights, setShortlistInsights] = useState<ShortlistInsights | null>(null);

  useEffect(() => {
    getCatalog().then((items) => {
      setCatalog(items);
      setSelectedId(items[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUsers().then((users) => {
      if (!cancelled) setKnownBackendUsers(users);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = getStoredAuthToken();
    if (!token) {
      setIsAuthChecked(true);
      return () => {
        cancelled = true;
      };
    }

    getAuthenticatedUser(token)
      .then((profile) => {
        if (cancelled) return;
        setAuthenticatedUserProfile(profile);
        setKnownBackendUsers((current) => mergeUserProfile(current, profile));
      })
      .catch(() => {
        clearStoredAuthToken();
        if (!cancelled) setAuthenticatedUserProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsAuthChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setActiveUserProfile(null);
    setCollections([]);
    setActiveCollectionId(null);
    setSavedGamesByCollection({});
    setShortlistInsights(null);
    setIsCreatingCollection(false);
    setNewCollectionName("");
    setIsEditingCollection(false);
    setEditingCollectionName("");
    setCollectionActionError("");
    setIsSaveMenuOpen(false);
    setIsCreatingSaveCollection(false);
    setSaveCollectionName("");

    ensureSessionUser(sessionUserId).then((profile) => {
      if (cancelled) return;
      setActiveUserProfile(profile);
      setKnownBackendUsers((current) => {
        const existing = current.filter((user) => user.id !== profile.id);
        return [profile, ...existing];
      });
    });

    getCollections(sessionUserId).then((items) => {
      if (cancelled) return;
      setCollections(items);
      setActiveCollectionId(items[0]?.id ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  const userOptions = useMemo(() => {
    const usersById = new Map<string, UserProfile>();
    for (const user of knownBackendUsers) {
      usersById.set(user.id, user);
    }
    if (activeUserProfile) {
      usersById.set(activeUserProfile.id, activeUserProfile);
    }
    for (const userId of knownSessionUserIds) {
      if (!usersById.has(userId)) {
        usersById.set(userId, buildGuestProfile(userId));
      }
    }
    if (!usersById.has(sessionUserId)) {
      usersById.set(sessionUserId, buildGuestProfile(sessionUserId));
    }

    return [...usersById.values()].sort((first, second) => {
      const roleOrder: Record<UserRole, number> = { admin: 0, developer: 1, player: 2, guest: 3 };
      return roleOrder[first.role] - roleOrder[second.role] || first.displayName.localeCompare(second.displayName);
    });
  }, [activeUserProfile, knownBackendUsers, knownSessionUserIds, sessionUserId]);

  useEffect(() => {
    if (!isAuthChecked) return;
    const currentUser = userOptions.find((user) => user.id === sessionUserId);
    if (currentUser?.role !== "admin" || authenticatedUserProfile?.id === sessionUserId) return;

    setPendingAdminUserId(sessionUserId);
    setAdminPassword("");
    setAuthError("");
    activateSession(createSessionUserId());
  }, [authenticatedUserProfile, isAuthChecked, sessionUserId, userOptions]);

  useEffect(() => {
    if (catalog.length === 0 || collections.length === 0) {
      setSavedGamesByCollection({});
      return;
    }

    let cancelled = false;
    setSavedGamesByCollection({});

    Promise.all(
      collections.map(async (collection) => {
        const items = await getSavedGames(catalog, sessionUserId, collection.id);
        return [collection.id, items] as const;
      }),
    ).then((entries) => {
      if (cancelled) return;
      setSavedGamesByCollection(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [catalog, collections, sessionUserId]);

  const savedGames = useMemo(() => {
    return activeCollectionId === null ? [] : savedGamesByCollection[activeCollectionId] ?? [];
  }, [activeCollectionId, savedGamesByCollection]);

  useEffect(() => {
    let cancelled = false;
    getShortlistInsights(savedGames, sessionUserId, activeCollectionId ?? undefined).then((nextInsights) => {
      if (!cancelled) setShortlistInsights(nextInsights);
    });

    return () => {
      cancelled = true;
    };
  }, [activeCollectionId, savedGames, sessionUserId]);

  const tags = useMemo(() => [...new Set(catalog.flatMap((game) => game.tags))].sort(), [catalog]);
  const filteredGames = useMemo(() => searchResults ?? filterGames(catalog, intent), [catalog, intent, searchResults]);
  const selectedCollection = useMemo(() => {
    return collections.find((collection) => collection.id === activeCollectionId) ?? collections[0] ?? null;
  }, [activeCollectionId, collections]);
  const isDefaultCollection = selectedCollection?.name === DEFAULT_COLLECTION_NAME;
  const selectedPreview = useMemo(() => {
    return filteredGames.find((game) => game.id === selectedId) ?? filteredGames[0] ?? catalog[0];
  }, [catalog, filteredGames, selectedId]);
  const selectedGame = selectedDetail?.id === selectedId ? selectedDetail : selectedPreview;
  const selectedSavedCollectionIds = useMemo(() => {
    const collectionIds = new Set<number>();
    if (!selectedGame) return collectionIds;

    for (const collection of collections) {
      if ((savedGamesByCollection[collection.id] ?? []).some((savedGame) => savedGame.gameId === selectedGame.id)) {
        collectionIds.add(collection.id);
      }
    }

    return collectionIds;
  }, [collections, savedGamesByCollection, selectedGame]);
  const selectedIsSaved = selectedSavedCollectionIds.size > 0;

  useEffect(() => {
    if (selectedId === null) {
      setSelectedDetail(null);
      setInsights(null);
      return;
    }

    let cancelled = false;
    setSelectedDetail(null);
    setInsights(null);

    getGameDetail(selectedId, catalog).then((game) => {
      if (cancelled) return;
      setSelectedDetail(game);
      if (!game) return;

      getGameInsights(game).then((nextInsights) => {
        if (!cancelled) setInsights(nextInsights);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [catalog, selectedId]);

  useEffect(() => {
    setIsSaveMenuOpen(false);
    setIsCreatingSaveCollection(false);
    setSaveCollectionName("");
  }, [selectedId]);

  const metrics = useMemo(() => {
    const visible = filteredGames.length || 1;
    return {
      avgPrice: filteredGames.reduce((sum, game) => sum + game.price, 0) / visible,
      avgRating: filteredGames.reduce((sum, game) => sum + game.rating, 0) / visible,
      revenue: filteredGames.reduce((sum, game) => sum + game.revenue, 0),
      ownership: filteredGames.reduce((sum, game) => sum + game.ownership, 0),
    };
  }, [filteredGames]);

  async function runSearch(nextQuery = query) {
    const response = await searchCatalog(nextQuery, tags, catalog);
    setIntent(response.intent);
    setView(response.intent.mode);
    setSearchResults(response.games);
    setSearchSource(response.source);
    setSelectedId(response.games[0]?.id ?? null);
  }

  function updateIntent(partial: Partial<SearchIntent>) {
    setIntent((current) => ({ ...current, ...partial }));
    setSearchResults(null);
    setSearchSource("rules");
  }

  function updateCollectionSavedGames(collectionId: number, updater: (items: SavedGame[]) => SavedGame[]) {
    setSavedGamesByCollection((current) => ({
      ...current,
      [collectionId]: updater(current[collectionId] ?? []),
    }));
  }

  async function toggleSavedGameForCollection(game: Game, collection: GameCollection) {
    const isSaved = selectedSavedCollectionIds.has(collection.id);
    if (isSaved) {
      await removeSavedGame(game.id, sessionUserId, collection.id);
      updateCollectionSavedGames(collection.id, (items) => items.filter((savedGame) => savedGame.gameId !== game.id));
      return;
    }

    const savedGame = await saveGame(game, catalog, sessionUserId, collection.id);
    updateCollectionSavedGames(collection.id, (items) => {
      if (items.some((item) => item.gameId === savedGame.gameId)) return items;
      return [savedGame, ...items];
    });
    setActiveCollectionId(collection.id);
  }

  async function clearShortlist() {
    const collectionId = selectedCollection?.id ?? activeCollectionId;
    if (collectionId === null) return;

    await clearSavedGames(sessionUserId, collectionId);
    updateCollectionSavedGames(collectionId, () => []);
  }

  async function addCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;

    setCollectionActionError("");
    const collection = await createCollection(name, sessionUserId);
    setCollections((current) => {
      if (current.some((item) => item.id === collection.id)) return current;
      return [...current, collection];
    });
    setActiveCollectionId(collection.id);
    setNewCollectionName("");
    setIsCreatingCollection(false);
  }

  function selectCollection(collectionId: number) {
    setActiveCollectionId(collectionId);
    setIsEditingCollection(false);
    setEditingCollectionName("");
    setCollectionActionError("");
  }

  function startEditingCollection() {
    if (!selectedCollection || isDefaultCollection) return;
    setIsCreatingCollection(false);
    setIsEditingCollection(true);
    setEditingCollectionName(selectedCollection.name);
    setCollectionActionError("");
  }

  async function renameCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCollection || isDefaultCollection) return;

    const name = editingCollectionName.trim();
    if (!name) return;

    try {
      setCollectionActionError("");
      const updated = await updateCollection(selectedCollection.id, name, sessionUserId);
      setCollections((current) => current.map((collection) => (collection.id === updated.id ? updated : collection)));
      setIsEditingCollection(false);
      setEditingCollectionName("");
    } catch (error) {
      console.error(error);
      setCollectionActionError("Collection name is already used or invalid.");
    }
  }

  async function removeCollection() {
    if (!selectedCollection || isDefaultCollection) return;

    try {
      setCollectionActionError("");
      await deleteCollection(selectedCollection.id, sessionUserId);
      const nextCollections = collections.filter((collection) => collection.id !== selectedCollection.id);
      setCollections(nextCollections);
      setSavedGamesByCollection((current) => {
        const nextSavedGames = { ...current };
        delete nextSavedGames[selectedCollection.id];
        return nextSavedGames;
      });
      setActiveCollectionId(nextCollections[0]?.id ?? null);
      setIsEditingCollection(false);
      setEditingCollectionName("");
    } catch (error) {
      console.error(error);
      setCollectionActionError("This collection could not be deleted.");
    }
  }

  async function createCollectionAndSave(event: React.FormEvent<HTMLFormElement>, game: Game) {
    event.preventDefault();
    const name = saveCollectionName.trim();
    if (!name) return;

    const collection = await createCollection(name, sessionUserId);
    const savedGame = await saveGame(game, catalog, sessionUserId, collection.id);
    setCollections((current) => {
      if (current.some((item) => item.id === collection.id)) return current;
      return [...current, collection];
    });
    updateCollectionSavedGames(collection.id, (items) => {
      if (items.some((item) => item.gameId === savedGame.gameId)) return items;
      return [savedGame, ...items];
    });
    setActiveCollectionId(collection.id);
    setSaveCollectionName("");
    setIsCreatingSaveCollection(false);
  }

  function activateSession(userId: string) {
    persistSessionUserId(userId);
    setSessionUserId(userId);
    setKnownSessionUserIds(getKnownSessionUserIds());
  }

  function requestSessionActivation(userId: string) {
    const user = userOptions.find((option) => option.id === userId);
    if (user?.role === "admin" && authenticatedUserProfile?.id !== userId) {
      setPendingAdminUserId(userId);
      setAdminPassword("");
      setAuthError("");
      return;
    }

    setPendingAdminUserId(null);
    setAuthError("");
    activateSession(userId);
  }

  function startNewSession() {
    setPendingAdminUserId(null);
    setAuthError("");
    activateSession(createSessionUserId());
  }

  async function loginAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const userId = pendingAdminUserId ?? "local-admin";
    const password = adminPassword.trim();
    if (!password) return;

    try {
      setIsLoggingIn(true);
      setAuthError("");
      const session = await loginUser(userId, password);
      setAuthenticatedUserProfile(session.user);
      setKnownBackendUsers((current) => mergeUserProfile(current, session.user));
      setPendingAdminUserId(null);
      setAdminPassword("");
      activateSession(session.user.id);
    } catch (error) {
      setAuthError("Admin password is incorrect.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function logoutAdmin() {
    clearStoredAuthToken();
    setAuthenticatedUserProfile(null);
    setPendingAdminUserId(null);
    setAdminPassword("");
    setAuthError("");
    if (activeUserProfile?.role === "admin") {
      activateSession(createSessionUserId());
    }
  }

  const signal = insights?.signal ?? (selectedGame ? getSignal(selectedGame) : "Watch");
  const signalClass = `signal ${signal.toLowerCase()}`;
  const reviewInsight = insights?.reviewIntelligence;
  const selectedRecommendation = view === "developer" ? insights?.developerOpportunity : insights?.playerRecommendation;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Gamepad2 size={22} aria-hidden="true" />
          </div>
          <div>
            <h1>ArcadeIQ</h1>
            <p>AI game intelligence</p>
          </div>
        </div>

        <section className="tool-panel session-panel">
          <div className="section-heading">
            <h2>
              <UserRound size={16} aria-hidden="true" />
              Session
            </h2>
            <span>{activeUserProfile ? formatRoleLabel(activeUserProfile.role) : "Loading"}</span>
          </div>
          <div className="session-controls">
            <select value={sessionUserId} onChange={(event) => requestSessionActivation(event.target.value)} aria-label="Session user">
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName} ({formatRoleLabel(user.role)})
                </option>
              ))}
            </select>
            <button className="icon-button" type="button" onClick={startNewSession} title="New session" aria-label="New session">
              <RefreshCcw size={15} aria-hidden="true" />
            </button>
          </div>
          <div className="session-meta">
            <p className="session-id">{formatSessionLabel(sessionUserId)}</p>
            {activeUserProfile?.role === "admin" && (
              <span className="role-pill admin">
                <ShieldCheck size={12} aria-hidden="true" />
                Admin
              </span>
            )}
          </div>
          {pendingAdminUserId && (
            <form className="admin-login" onSubmit={(event) => void loginAdmin(event)}>
              <label className="field compact">
                <span>Admin Password</span>
                <input
                  className="text-input"
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  placeholder="Local admin password"
                  aria-label="Admin password"
                />
              </label>
              <div className="admin-login-actions">
                <button className="small-button" type="submit" disabled={isLoggingIn || !adminPassword.trim()}>
                  <KeyRound size={13} aria-hidden="true" />
                  {isLoggingIn ? "Signing in" : "Sign In"}
                </button>
                <button className="ghost-button" type="button" onClick={() => setPendingAdminUserId(null)}>
                  Cancel
                </button>
              </div>
              {authError && <div className="form-error">{authError}</div>}
            </form>
          )}
          {authenticatedUserProfile && (
            <button className="ghost-button session-logout" type="button" onClick={logoutAdmin}>
              <LogOut size={13} aria-hidden="true" />
              Sign Out Admin
            </button>
          )}
        </section>

        <section className="tool-panel">
          <div className="section-heading">
            <h2>
              <Search size={16} aria-hidden="true" />
              Natural Search
            </h2>
            <span>{searchSource === "deepseek" ? "DeepSeek parser" : searchSource === "mock" ? "Mock fallback" : "Rules parser"}</span>
          </div>
          <textarea value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} />
          <div className="scenario-grid">
            {exampleQueries.map((example) => (
              <button
                key={example}
                className="scenario-button"
                type="button"
                title={example}
                onClick={() => {
                  setQuery(example);
                  void runSearch(example);
                }}
              >
                {example.includes("story") ? "Story picks" : example.includes("developer") ? "Dev lens" : "Survival deal"}
              </button>
            ))}
          </div>
          <button className="primary-button" type="button" onClick={() => void runSearch()} title="Parse query and update results">
            <Sparkles size={16} aria-hidden="true" />
            Run Search
          </button>
          <pre className="intent-box">{JSON.stringify(intent, null, 2)}</pre>
        </section>

        <section className="tool-panel">
          <div className="section-heading">
            <h2>
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filters
            </h2>
            <span>Live controls</span>
          </div>
          <label className="field">
            <span>Max Price</span>
            <input
              type="range"
              min="0"
              max="70"
              value={intent.maxPrice}
              onChange={(event) => updateIntent({ maxPrice: Number(event.target.value) })}
            />
            <strong>{formatMoney(intent.maxPrice)}</strong>
          </label>
          <label className="field">
            <span>Tag Focus</span>
            <select
              value={intent.tags[0] ?? ""}
              onChange={(event) => updateIntent({ tags: event.target.value ? [event.target.value] : [] })}
            >
              <option value="">Any tag</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={intent.hasReviews}
              onChange={(event) => updateIntent({ hasReviews: event.target.checked })}
            />
            Has player reviews
          </label>
        </section>

        <section className="metric-panel">
          <Metric label="Visible Games" value={filteredGames.length.toString()} />
          <Metric label="Saved" value={savedGames.length.toString()} />
          <Metric label="Visible Revenue" value={`$${formatCompact(metrics.revenue)}`} />
          <Metric label="Visible Avg Rating" value={metrics.avgRating.toFixed(1)} />
        </section>

        <section className="tool-panel shortlist-panel">
          <div className="section-heading">
            <h2>
              <Folder size={16} aria-hidden="true" />
              Collections
            </h2>
            <div className="section-actions">
              <span>{savedGames.length} saved</span>
              {savedGames.length > 0 && (
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => void clearShortlist()}
                  title="Clear shortlist"
                  aria-label="Clear shortlist"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="collection-controls">
            <label className="field compact">
              <span>Collection</span>
              <select
                value={activeCollectionId ?? ""}
                onChange={(event) => selectCollection(Number(event.target.value))}
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="icon-button"
              type="button"
              onClick={() => setIsCreatingCollection((current) => !current)}
              title="New collection"
              aria-label="New collection"
            >
              <Plus size={15} aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={startEditingCollection}
              title="Rename collection"
              aria-label="Rename collection"
              disabled={!selectedCollection || isDefaultCollection}
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => void removeCollection()}
              title="Delete collection"
              aria-label="Delete collection"
              disabled={!selectedCollection || isDefaultCollection}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
          {isCreatingCollection && (
            <form className="collection-create" onSubmit={(event) => void addCollection(event)}>
              <input
                className="text-input"
                aria-label="Collection name"
                placeholder="Wishlist"
                value={newCollectionName}
                onChange={(event) => setNewCollectionName(event.target.value)}
              />
              <button className="small-button" type="submit">
                Create
              </button>
            </form>
          )}
          {isEditingCollection && selectedCollection && (
            <form className="collection-edit" onSubmit={(event) => void renameCollection(event)}>
              <input
                className="text-input"
                aria-label="Rename collection"
                value={editingCollectionName}
                onChange={(event) => setEditingCollectionName(event.target.value)}
              />
              <button className="small-button" type="submit">
                Save
              </button>
            </form>
          )}
          {collectionActionError && <div className="form-error">{collectionActionError}</div>}
          <div className="shortlist-list">
            {savedGames.map((savedGame) => (
              <button
                key={`${savedGame.collectionId}-${savedGame.gameId}`}
                className={`shortlist-item ${selectedId === savedGame.gameId ? "active" : ""}`}
                type="button"
                onClick={() => setSelectedId(savedGame.gameId)}
              >
                <span>{savedGame.game.name}</span>
                <strong>{formatMoney(savedGame.game.price)}</strong>
              </button>
            ))}
            {savedGames.length === 0 && <div className="empty-state compact">No saved games in this collection.</div>}
          </div>
        </section>

        {shortlistInsights && (
          <section className="tool-panel shortlist-insight-panel">
            <div className="section-heading">
              <h2>
                <LineChart size={16} aria-hidden="true" />
                Collection Intelligence
              </h2>
              <span>{shortlistInsights.source === "mock" ? "Mock fallback" : selectedCollection?.name ?? "Rules preview"}</span>
            </div>
            <div className="shortlist-insight-metrics">
              <Metric label="Avg Price" value={`$${shortlistInsights.averagePrice.toFixed(2)}`} />
              <Metric label="Avg Rating" value={shortlistInsights.averageRating.toFixed(1)} />
              <Metric label="Revenue" value={`$${formatCompact(shortlistInsights.totalVisibleRevenue)}`} />
            </div>
            <p className="shortlist-summary">{shortlistInsights.strategy.body}</p>
            {shortlistInsights.topTags.length > 0 && (
              <div className="tag-row shortlist-tags">
                {shortlistInsights.topTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}
          </section>
        )}
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Web app prototype</p>
            <h2>AI-assisted game discovery and developer analytics</h2>
          </div>
          <div className="segmented-control" role="tablist" aria-label="View mode">
            <button className={view === "player" ? "active" : ""} type="button" onClick={() => setView("player")}>
              Player
            </button>
            <button className={view === "developer" ? "active" : ""} type="button" onClick={() => setView("developer")}>
              Developer
            </button>
          </div>
        </header>

        {selectedGame && (
          <section className="feature-band">
            <div className="feature-copy">
              <p>{selectedGame.tags.slice(0, 3).join(" / ")}</p>
              <h2>{selectedGame.name}</h2>
              <span>{selectedGame.summary}</span>
            </div>
            <div className="feature-stats">
              <Stat icon={<Star size={16} />} label="Rating" value={selectedGame.rating.toFixed(1)} />
              <Stat icon={<CircleDollarSign size={16} />} label="Price" value={formatMoney(selectedGame.price)} />
              <Stat icon={<LineChart size={16} />} label="Signal" value={signal} className={signalClass} />
              <div className="save-picker">
                <button
                  className={`save-button ${selectedIsSaved ? "active" : ""}`}
                  type="button"
                  onClick={() => setIsSaveMenuOpen((current) => !current)}
                  title={selectedIsSaved ? "Manage saved collections" : "Choose a collection"}
                  aria-expanded={isSaveMenuOpen}
                >
                  {selectedIsSaved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                  {selectedIsSaved ? `Saved (${selectedSavedCollectionIds.size})` : "Save"}
                </button>
                {isSaveMenuOpen && (
                  <div className="save-menu">
                    <div className="save-menu-header">
                      <strong>Choose Collection</strong>
                      <span>{selectedSavedCollectionIds.size} saved</span>
                    </div>
                    <div className="save-menu-list">
                      {collections.map((collection) => {
                        const isSaved = selectedSavedCollectionIds.has(collection.id);
                        return (
                          <button
                            key={collection.id}
                            className={`save-menu-option ${isSaved ? "active" : ""}`}
                            type="button"
                            onClick={() => void toggleSavedGameForCollection(selectedGame, collection)}
                          >
                            <span className="save-menu-check">{isSaved && <Check size={14} aria-hidden="true" />}</span>
                            <span>{collection.name}</span>
                            <strong>{isSaved ? "Remove" : "Save"}</strong>
                          </button>
                        );
                      })}
                    </div>
                    {isCreatingSaveCollection ? (
                      <form className="save-menu-create" onSubmit={(event) => void createCollectionAndSave(event, selectedGame)}>
                        <input
                          className="text-input"
                          aria-label="New collection name"
                          placeholder="Research picks"
                          value={saveCollectionName}
                          onChange={(event) => setSaveCollectionName(event.target.value)}
                        />
                        <button className="small-button" type="submit">
                          Create & Save
                        </button>
                      </form>
                    ) : (
                      <button className="save-menu-create-button" type="button" onClick={() => setIsCreatingSaveCollection(true)}>
                        <Plus size={14} aria-hidden="true" />
                        New Collection
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="content-grid">
          <div className="catalog-panel">
            <div className="section-heading">
              <h2>
                <Tags size={16} aria-hidden="true" />
                Matching Games
              </h2>
              <span>
                {filteredGames.length} {filteredGames.length === 1 ? "result" : "results"}
              </span>
            </div>
            <div className="game-list">
              {filteredGames.map((game) => (
                <button
                  key={game.id}
                  className={`game-card ${selectedGame?.id === game.id ? "selected" : ""}`}
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                >
                  <div>
                    <h3>{game.name}</h3>
                    <div className="tag-row">
                      {game.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="game-meta">
                    <strong>{formatMoney(game.price)}</strong>
                    <span>{game.rating.toFixed(1)} rating</span>
                  </div>
                </button>
              ))}
              {filteredGames.length === 0 && <div className="empty-state">No games match these filters.</div>}
            </div>
          </div>

          <div className="insight-stack">
            <InsightPanel
              title={reviewInsight?.title ?? "Review Intelligence"}
              caption={reviewInsight?.caption ?? "Loading"}
              icon={<Brain size={16} />}
              body={reviewInsight?.body ?? "Select a game to inspect review intelligence."}
              bullets={reviewInsight?.bullets ?? []}
            />
            <InsightPanel
              title={selectedRecommendation?.title ?? (view === "developer" ? "Developer Copilot" : "Player Recommendation")}
              caption={selectedRecommendation?.caption ?? (view === "developer" ? "Revenue lens" : "Discovery lens")}
              icon={<BarChart3 size={16} />}
              body={selectedRecommendation?.body ?? "Select a game to inspect recommendation signals."}
              bullets={selectedRecommendation?.bullets ?? []}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Stat({ icon, label, value, className = "" }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className="stat-tile">
      <span>
        {icon}
        {label}
      </span>
      <strong className={className}>{value}</strong>
    </div>
  );
}

function InsightPanel({
  title,
  caption,
  icon,
  body,
  bullets,
}: {
  title: string;
  caption: string;
  icon: React.ReactNode;
  body: string;
  bullets: string[];
}) {
  return (
    <section className="insight-panel">
      <div className="section-heading">
        <h2>
          {icon}
          {title}
        </h2>
        <span>{caption}</span>
      </div>
      <p>{body}</p>
      {bullets.length > 0 && (
        <ul>
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
