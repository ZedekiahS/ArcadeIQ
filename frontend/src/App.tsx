import {
  BarChart3, Bookmark, BookmarkCheck, Brain, Check, CircleDollarSign, Folder,
  Gamepad2, KeyRound, LineChart, LogOut, Pencil, Plus, RefreshCcw, Search,
  ShieldCheck, SlidersHorizontal, Sparkles, Star, Tags, Trash2, UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCatalog, getGameDetail, getGameInsights, searchCatalog } from "./services/catalog";
import { DATA_MODE } from "./services/runtime";
import { formatRoleLabel } from "./services/users";
import { useAccount } from "./hooks/useAccount";
import { useCollections } from "./hooks/useCollections";
import type { Game, GameCollection, GameInsights, SearchIntent } from "./types";
import { filterGames, getSignal } from "./lib/search";

const exampleQueries = [
  "Find the second most expensive FPS game",
  "Find cheap multiplayer survival games with good reviews",
  "Show highly rated story rich games under 25 dollars",
  "Find premium exploration games for developer catalog analysis",
];

const initialIntent: SearchIntent = {
  maxPrice: 70, minRating: 0, hasReviews: false, tags: ["FPS"], mode: "player",
  sortBy: "price", sortDirection: "desc", limit: 1, offset: 1,
};
const DEFAULT_COLLECTION_NAME = "Default Shortlist";

function formatMoney(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}
function formatCompact(value: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function App() {
  const account = useAccount();
  const sessionUserId = DATA_MODE === "demo" ? "demo-user" : account.user?.id ?? null;
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const isLoggingIn = account.status === "checking";
  const [catalog, setCatalog] = useState<Game[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const collectionState = useCollections(catalog, sessionUserId, account.revision);
  const { collections, activeCollectionId, savedGamesByCollection, shortlistInsights } = collectionState;
  const collectionDisabled = sessionUserId === null || collectionState.loading || collectionState.busy
    || (collections.length === 0 && Boolean(collectionState.error));
  const [query, setQuery] = useState(exampleQueries[0]);
  const [intent, setIntent] = useState<SearchIntent>(initialIntent);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"player" | "developer">("player");
  const [searchResults, setSearchResults] = useState<Game[] | null>(null);
  const [searchSource, setSearchSource] = useState<"rules" | "deepseek" | "mock">(DATA_MODE === "demo" ? "mock" : "rules");
  const [searchError, setSearchError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const searchSequence = useRef(0);
  const searchInFlight = useRef(false);
  const [selectedDetail, setSelectedDetail] = useState<Game | null>(null);
  const [insights, setInsights] = useState<GameInsights | null>(null);
  const [detailError, setDetailError] = useState("");
  const [insightsError, setInsightsError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRevision, setDetailRevision] = useState(0);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isEditingCollection, setIsEditingCollection] = useState(false);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [isCreatingSaveCollection, setIsCreatingSaveCollection] = useState(false);
  const [saveCollectionName, setSaveCollectionName] = useState("");

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError("");
    getCatalog().then((items) => {
      if (cancelled) return;
      setCatalog(items);
      setSelectedId((current) => items.some((game) => game.id === current) ? current : filterGames(items, initialIntent)[0]?.id ?? items[0]?.id ?? null);
    }).catch((error) => {
      if (!cancelled) setCatalogError(errorMessage(error, "Unable to load the catalog."));
    }).finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [catalogRevision]);

  useEffect(() => {
    setIsCreatingCollection(false);
    setNewCollectionName("");
    setIsEditingCollection(false);
    setEditingCollectionName("");
    setIsSaveMenuOpen(false);
    setIsCreatingSaveCollection(false);
    setSaveCollectionName("");
  }, [sessionUserId, account.revision]);

  const savedGames = useMemo(() => activeCollectionId === null ? [] : savedGamesByCollection[activeCollectionId] ?? [], [activeCollectionId, savedGamesByCollection]);
  const tags = useMemo(() => [...new Set(catalog.flatMap((game) => game.tags))].sort(), [catalog]);
  const filteredGames = useMemo(() => searchResults ?? filterGames(catalog, intent), [catalog, intent, searchResults]);
  const selectedCollection = collections.find((collection) => collection.id === activeCollectionId) ?? null;
  const isDefaultCollection = selectedCollection?.name === DEFAULT_COLLECTION_NAME;
  const selectedPreview = catalog.find((game) => game.id === selectedId) ?? searchResults?.find((game) => game.id === selectedId);
  const selectedGame = selectedDetail?.id === selectedId ? selectedDetail : selectedPreview;
  const visibleInsights = insights?.gameId === selectedGame?.id ? insights : null;
  const selectedSavedCollectionIds = useMemo(() => {
    const ids = new Set<number>();
    if (selectedGame) {
      for (const collection of collections) {
        if ((savedGamesByCollection[collection.id] ?? []).some((saved) => saved.gameId === selectedGame.id)) ids.add(collection.id);
      }
    }
    return ids;
  }, [collections, savedGamesByCollection, selectedGame]);
  const selectedIsSaved = selectedSavedCollectionIds.size > 0;

  useEffect(() => {
    let cancelled = false;
    setSelectedDetail(null);
    setInsights(null);
    setDetailError("");
    setInsightsError("");
    setDetailLoading(selectedId !== null);
    if (selectedId === null) return;
    async function loadDetail() {
      let game: Game | null;
      try {
        game = await getGameDetail(selectedId!, catalog);
        if (cancelled) return;
        setSelectedDetail(game);
        if (!game) {
          setDetailError("This game is unavailable.");
          setDetailLoading(false);
          return;
        }
      } catch (error) {
        if (!cancelled) {
          setDetailError(errorMessage(error, "Unable to load game details."));
          setDetailLoading(false);
        }
        return;
      }
      try {
        const result = await getGameInsights(game);
        if (!cancelled) setInsights(result);
      } catch (error) {
        if (!cancelled) setInsightsError(errorMessage(error, "Unable to load game intelligence."));
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    void loadDetail();
    return () => { cancelled = true; };
  }, [catalog, selectedId, detailRevision]);

  useEffect(() => {
    setIsSaveMenuOpen(false);
    setIsCreatingSaveCollection(false);
    setSaveCollectionName("");
  }, [selectedId]);

  useEffect(() => () => { ++searchSequence.current; }, []);

  const metrics = useMemo(() => ({
    avgRating: filteredGames.reduce((sum, game) => sum + game.rating, 0) / (filteredGames.length || 1),
    revenue: filteredGames.reduce((sum, game) => sum + game.revenue, 0),
  }), [filteredGames]);

  async function runSearch(nextQuery = query) {
    if (searchInFlight.current || catalogLoading) return;
    const request = ++searchSequence.current;
    searchInFlight.current = true;
    setSearchLoading(true);
    setSearchError("");
    try {
      const response = await searchCatalog(nextQuery, tags, catalog);
      if (request !== searchSequence.current) return;
      setIntent(response.intent);
      setView(response.intent.mode);
      setSearchResults(response.games);
      setSearchSource(response.source);
      setSelectedId(response.games[0]?.id ?? null);
    } catch (error) {
      if (request === searchSequence.current) setSearchError(errorMessage(error, "Unable to run search."));
    } finally {
      if (request === searchSequence.current) {
        searchInFlight.current = false;
        setSearchLoading(false);
      }
    }
  }

  function updateIntent(partial: Partial<SearchIntent>) {
    ++searchSequence.current;
    searchInFlight.current = false;
    setSearchLoading(false);
    setSearchError("");
    setIntent((current) => ({ ...current, ...partial }));
    setSearchResults(null);
    setSearchSource(DATA_MODE === "demo" ? "mock" : "rules");
  }

  async function toggleSavedGameForCollection(game: Game, collection: GameCollection) {
    if (selectedSavedCollectionIds.has(collection.id)) await collectionState.remove(game.id, collection.id);
    else await collectionState.save(game, collection);
  }
  async function clearShortlist() {
    if (activeCollectionId !== null) await collectionState.clear(activeCollectionId);
  }
  async function addCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newCollectionName.trim()) return;
    if (await collectionState.create(newCollectionName)) {
      setNewCollectionName("");
      setIsCreatingCollection(false);
    }
  }
  function selectCollection(collectionId: number) {
    collectionState.setActiveCollectionId(collectionId);
    setIsEditingCollection(false);
    setEditingCollectionName("");
  }
  function startEditingCollection() {
    if (!selectedCollection || isDefaultCollection) return;
    setIsCreatingCollection(false);
    setIsEditingCollection(true);
    setEditingCollectionName(selectedCollection.name);
  }
  async function renameCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCollection || isDefaultCollection || !editingCollectionName.trim()) return;
    if (await collectionState.rename(selectedCollection.id, editingCollectionName)) {
      setIsEditingCollection(false);
      setEditingCollectionName("");
    }
  }
  async function removeCollection() {
    if (!selectedCollection || isDefaultCollection) return;
    if (await collectionState.deleteCollection(selectedCollection.id)) {
      setIsEditingCollection(false);
      setEditingCollectionName("");
    }
  }
  async function createCollectionAndSave(event: React.FormEvent<HTMLFormElement>, game: Game) {
    event.preventDefault();
    if (!saveCollectionName.trim()) return;
    if (await collectionState.createAndSave(saveCollectionName, game)) {
      setSaveCollectionName("");
      setIsCreatingSaveCollection(false);
    }
  }
  function resetAuthForm() {
    setAuthMode(null);
    setLoginIdentifier("");
    setAccountPassword("");
    setRegisterEmail("");
    setRegisterDisplayName("");
  }
  function openLoginForm() { resetAuthForm(); setAuthMode("login"); }
  function openRegisterForm() { resetAuthForm(); setAuthMode("register"); }
  async function loginAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginIdentifier.trim() || !accountPassword) return;
    if (await account.login(loginIdentifier.trim(), accountPassword)) resetAuthForm();
  }
  async function registerAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registerEmail.trim() || !registerDisplayName.trim() || accountPassword.length < 8) return;
    if (await account.register(registerEmail.trim(), registerDisplayName.trim(), accountPassword)) resetAuthForm();
  }
  function logoutAccount() { account.logout(); resetAuthForm(); }

  const signal = visibleInsights?.signal ?? (selectedGame ? getSignal(selectedGame) : "Watch");
  const signalClass = `signal ${signal.toLowerCase()}`;
  const reviewInsight = visibleInsights?.reviewIntelligence;
  const selectedRecommendation = view === "developer" ? visibleInsights?.developerOpportunity : visibleInsights?.playerRecommendation;

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

        <section className="tool-panel data-mode-panel">
          <div className="section-heading"><h2>Data mode</h2><span>{DATA_MODE === "demo" ? "Local samples" : "API mode"}</span></div>
          <nav className="data-mode-links" aria-label="Data mode">
            <a href="?mode=demo" aria-current={DATA_MODE === "demo" ? "page" : undefined}>Sample demo</a>
            <a href="?mode=api" aria-current={DATA_MODE === "api" ? "page" : undefined}>API mode</a>
          </nav>
          <p className="mode-description">{DATA_MODE === "demo"
            ? "Fixed sample games and rule-based insights. Collections stay in this browser; no account or API is used."
            : "Games and AI insights come from the API. Signed-in collections are saved in the backend database."}</p>
        </section>

        {DATA_MODE === "api" && (
          <section className="tool-panel session-panel">
            <div className="section-heading">
              <h2><UserRound size={16} aria-hidden="true" />Account</h2>
              <span>{account.user ? formatRoleLabel(account.user.role) : "Sign-in required to save"}</span>
            </div>
            {account.user && (
              <div className="session-meta">
                <p className="session-id">{account.user.displayName}</p>
                <span className={`role-pill ${account.user.role}`}><ShieldCheck size={12} aria-hidden="true" />{formatRoleLabel(account.user.role)}</span>
              </div>
            )}
            {account.status === "checking" && <p role="status" className="mode-description">Checking account…</p>}
            {account.error && <div className="form-error" role="alert">{account.error}</div>}
            {account.status === "error" && <button className="small-button" type="button" onClick={() => void account.retry()}><RefreshCcw size={13} aria-hidden="true" />Retry account</button>}
            {!account.user && authMode === null && (
              <div className="account-actions">
                <button className="small-button" type="button" onClick={openLoginForm} disabled={isLoggingIn}><KeyRound size={13} aria-hidden="true" />Sign In</button>
                <button className="ghost-button" type="button" onClick={openRegisterForm} disabled={isLoggingIn}>Create Account</button>
              </div>
            )}
            {authMode !== null && !account.user && (
              <form className="account-form" onSubmit={(event) => void (authMode === "login" ? loginAccount(event) : registerAccount(event))}>
                {authMode === "login" ? (
                  <label className="field compact"><span>User ID or Email</span>
                    <input className="text-input" type="text" autoComplete="username" value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} placeholder="player@example.com" aria-label="User ID or email" disabled={isLoggingIn} />
                  </label>
                ) : (
                  <>
                    <label className="field compact"><span>Email</span>
                      <input className="text-input" type="email" autoComplete="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} placeholder="player@example.com" aria-label="Register email" disabled={isLoggingIn} />
                    </label>
                    <label className="field compact"><span>Display Name</span>
                      <input className="text-input" type="text" autoComplete="nickname" value={registerDisplayName} onChange={(event) => setRegisterDisplayName(event.target.value)} placeholder="Player name" aria-label="Register display name" disabled={isLoggingIn} />
                    </label>
                  </>
                )}
                <label className="field compact"><span>Password</span>
                  <input className="text-input" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder={authMode === "login" ? "Password" : "8+ characters"} aria-label={authMode === "login" ? "Account password" : "Register password"} disabled={isLoggingIn} />
                </label>
                <div className="account-form-actions">
                  <button className="small-button" type="submit" disabled={isLoggingIn || (authMode === "login" ? !loginIdentifier.trim() || !accountPassword : !registerEmail.trim() || !registerDisplayName.trim() || accountPassword.length < 8)}>
                    <KeyRound size={13} aria-hidden="true" />{isLoggingIn ? "Please wait" : authMode === "login" ? "Sign In" : "Create"}
                  </button>
                  <button className="ghost-button" type="button" onClick={resetAuthForm} disabled={isLoggingIn}>Cancel</button>
                </div>
              </form>
            )}
            {(account.user || account.status === "checking" || account.status === "error" || account.status === "expired") && (
              <button className="ghost-button session-logout" type="button" onClick={logoutAccount}><LogOut size={13} aria-hidden="true" />{account.status === "checking" ? "Cancel and sign out" : "Sign Out"}</button>
            )}
          </section>
        )}

        <section className="tool-panel">
          <div className="section-heading">
            <h2>
              <Search size={16} aria-hidden="true" />
              Natural Search
            </h2>
            <span>{searchSource === "deepseek" ? "DeepSeek parser" : searchSource === "mock" ? "Demo rules" : "Rules parser"}</span>
          </div>
          <textarea value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} />
          <div className="scenario-grid">
            {exampleQueries.map((example) => (
              <button
                key={example}
                className="scenario-button"
                type="button"
                title={example}
                disabled={searchLoading || catalogLoading || catalog.length === 0}
                onClick={() => {
                  setQuery(example);
                  void runSearch(example);
                }}
              >
                {example.includes("FPS") ? "FPS rank" : example.includes("story") ? "Story picks" : example.includes("developer") ? "Dev lens" : "Survival deal"}
              </button>
            ))}
          </div>
          <button className="primary-button" type="button" onClick={() => void runSearch()} title="Parse query and update results" disabled={searchLoading || catalogLoading || catalog.length === 0}>
            <Sparkles size={16} aria-hidden="true" />
            {searchLoading ? "Searching…" : "Run Search"}
          </button>
          {searchError && <ErrorNotice message={searchError} onRetry={() => void runSearch()} />}
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
                  disabled={collectionDisabled}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {sessionUserId === null && <p className="mode-description">Sign in to load and save your collections.</p>}
          {collectionState.loading && <p role="status" className="mode-description">Loading collections…</p>}
          {collectionState.busy && <p role="status" className="mode-description">Saving change…</p>}
          <div className="collection-controls">
            <label className="field compact">
              <span>Collection</span>
              <select
                value={activeCollectionId ?? ""}
                onChange={(event) => selectCollection(Number(event.target.value))}
                disabled={collectionDisabled || collections.length === 0}
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
              disabled={collectionDisabled}
            >
              <Plus size={15} aria-hidden="true" />
            </button>
            <button
              className="icon-button"
              type="button"
              onClick={startEditingCollection}
              title="Rename collection"
              aria-label="Rename collection"
              disabled={collectionDisabled || !selectedCollection || isDefaultCollection}
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => void removeCollection()}
              title="Delete collection"
              aria-label="Delete collection"
              disabled={collectionDisabled || !selectedCollection || isDefaultCollection}
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
                disabled={collectionDisabled}
              />
              <button className="small-button" type="submit" disabled={collectionDisabled || !newCollectionName.trim()}>
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
                disabled={collectionDisabled}
              />
              <button className="small-button" type="submit" disabled={collectionDisabled || !editingCollectionName.trim()}>
                Save
              </button>
            </form>
          )}
          {collectionState.error && <ErrorNotice message={collectionState.error} onRetry={collectionState.retry} retryLabel="Reload collections" disabled={collectionState.busy} />}
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
            {savedGames.length === 0 && !collectionState.loading && !collectionState.error && selectedCollection && <div className="empty-state compact">No saved games in this collection.</div>}
          </div>
        </section>

        {collectionState.insightsError && <ErrorNotice message={collectionState.insightsError} onRetry={collectionState.retry} retryLabel="Retry collection intelligence" disabled={collectionState.busy} />}
        {shortlistInsights && (
          <section className="tool-panel shortlist-insight-panel">
            <div className="section-heading">
              <h2>
                <LineChart size={16} aria-hidden="true" />
                Collection Intelligence
              </h2>
              <span>{shortlistInsights.source === "deepseek" ? "DeepSeek" : shortlistInsights.source === "mock" ? "Demo rules" : "Rules"}</span>
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
        {catalogLoading && <p role="status" className="mode-description">Loading game catalog…</p>}
        {catalogError && <ErrorNotice message={catalogError} onRetry={() => setCatalogRevision((value) => value + 1)} retryLabel="Retry catalog" disabled={catalogLoading} />}
        {detailError && <ErrorNotice message={detailError} onRetry={() => setDetailRevision((value) => value + 1)} retryLabel="Retry game details" disabled={detailLoading} />}

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
                  disabled={collectionDisabled}
                >
                  {selectedIsSaved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                  {sessionUserId === null ? "Sign in to save" : selectedIsSaved ? `Saved (${selectedSavedCollectionIds.size})` : "Save"}
                </button>
                {isSaveMenuOpen && (
                  <div className="save-menu">
                    <div className="save-menu-header">
                      <strong>Choose Collection</strong>
                      <span>{selectedSavedCollectionIds.size} saved</span>
                    </div>
                    <p className="mode-description">{DATA_MODE === "demo" ? "Storage: this browser" : "Storage: your account"}</p>
                    {collectionState.error && <ErrorNotice message={collectionState.error} onRetry={collectionState.retry} retryLabel="Reload collections" disabled={collectionState.busy} />}
                    <div className="save-menu-list">
                      {collections.map((collection) => {
                        const isSaved = selectedSavedCollectionIds.has(collection.id);
                        return (
                          <button
                            key={collection.id}
                            className={`save-menu-option ${isSaved ? "active" : ""}`}
                            type="button"
                            onClick={() => void toggleSavedGameForCollection(selectedGame, collection)}
                            disabled={collectionDisabled}
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
                          disabled={collectionDisabled}
                        />
                        <button className="small-button" type="submit" disabled={collectionDisabled || !saveCollectionName.trim()}>
                          Create & Save
                        </button>
                      </form>
                    ) : (
                      <button className="save-menu-create-button" type="button" onClick={() => setIsCreatingSaveCollection(true)} disabled={collectionDisabled}>
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
              {filteredGames.length === 0 && !catalogLoading && !catalogError && <div className="empty-state">No games match these filters.</div>}
            </div>
          </div>

          <div className="insight-stack">
            {insightsError && <ErrorNotice message={insightsError} onRetry={() => setDetailRevision((value) => value + 1)} retryLabel="Retry game intelligence" disabled={detailLoading} />}
            {visibleInsights && <p className="mode-description">Intelligence source: {visibleInsights.source === "deepseek" ? "DeepSeek" : visibleInsights.source === "mock" ? "Demo rules" : "Backend rules"}</p>}
            <InsightPanel
              title={reviewInsight?.title ?? "Review Intelligence"}
              caption={reviewInsight?.caption ?? (detailLoading ? "Loading" : "Unavailable")}
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

function ErrorNotice({ message, onRetry, retryLabel = "Retry", disabled = false }: {
  message: string; onRetry: () => void; retryLabel?: string; disabled?: boolean;
}) {
  return <div className="error-notice" role="alert">
    <p>{message}</p>
    <button className="small-button" type="button" onClick={onRetry} disabled={disabled}><RefreshCcw size={13} aria-hidden="true" />{retryLabel}</button>
  </div>;
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
