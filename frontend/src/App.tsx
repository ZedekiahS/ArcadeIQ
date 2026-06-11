import {
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Brain,
  CircleDollarSign,
  Folder,
  Gamepad2,
  LineChart,
  Plus,
  RefreshCcw,
  Search,
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
  getCatalog,
  getCollections,
  getGameDetail,
  getGameInsights,
  getSavedGames,
  getShortlistInsights,
  removeSavedGame,
  saveGame,
  searchCatalog,
} from "./services/catalog";
import { createSessionUserId, getActiveSessionUserId, getKnownSessionUserIds, setActiveSessionUserId as persistSessionUserId } from "./services/session";
import type { Game, GameCollection, GameInsights, SavedGame, SearchIntent, ShortlistInsights } from "./types";
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

function formatMoney(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

function formatCompact(value: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function formatSessionLabel(userId: string) {
  return userId.length > 18 ? `${userId.slice(0, 18)}...` : userId;
}

export default function App() {
  const [sessionUserId, setSessionUserId] = useState(getActiveSessionUserId);
  const [knownSessionUserIds, setKnownSessionUserIds] = useState(getKnownSessionUserIds);
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
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [shortlistInsights, setShortlistInsights] = useState<ShortlistInsights | null>(null);

  useEffect(() => {
    getCatalog().then((items) => {
      setCatalog(items);
      setSelectedId(items[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCollections([]);
    setActiveCollectionId(null);
    setSavedGames([]);
    setShortlistInsights(null);

    getCollections(sessionUserId).then((items) => {
      if (cancelled) return;
      setCollections(items);
      setActiveCollectionId(items[0]?.id ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (catalog.length === 0 || activeCollectionId === null) {
      setSavedGames([]);
      return;
    }

    let cancelled = false;
    setSavedGames([]);
    getSavedGames(catalog, sessionUserId, activeCollectionId).then((items) => {
      if (!cancelled) setSavedGames(items);
    });

    return () => {
      cancelled = true;
    };
  }, [activeCollectionId, catalog, sessionUserId]);

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
  const selectedPreview = useMemo(() => {
    return filteredGames.find((game) => game.id === selectedId) ?? filteredGames[0] ?? catalog[0];
  }, [catalog, filteredGames, selectedId]);
  const selectedGame = selectedDetail?.id === selectedId ? selectedDetail : selectedPreview;
  const savedGameIds = useMemo(() => new Set(savedGames.map((savedGame) => savedGame.gameId)), [savedGames]);
  const selectedIsSaved = selectedGame ? savedGameIds.has(selectedGame.id) : false;

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

  async function toggleSavedGame(game: Game) {
    const collectionId = selectedCollection?.id ?? activeCollectionId ?? undefined;
    if (savedGameIds.has(game.id)) {
      await removeSavedGame(game.id, sessionUserId, collectionId);
      setSavedGames((current) => current.filter((savedGame) => savedGame.gameId !== game.id));
      return;
    }

    const savedGame = await saveGame(game, catalog, sessionUserId, collectionId);
    setSavedGames((current) => {
      if (current.some((item) => item.gameId === savedGame.gameId)) return current;
      return [savedGame, ...current];
    });
  }

  async function clearShortlist() {
    await clearSavedGames(sessionUserId, selectedCollection?.id ?? activeCollectionId ?? undefined);
    setSavedGames([]);
  }

  async function addCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;

    const collection = await createCollection(name, sessionUserId);
    setCollections((current) => {
      if (current.some((item) => item.id === collection.id)) return current;
      return [...current, collection];
    });
    setActiveCollectionId(collection.id);
    setNewCollectionName("");
    setIsCreatingCollection(false);
  }

  function activateSession(userId: string) {
    persistSessionUserId(userId);
    setSessionUserId(userId);
    setKnownSessionUserIds(getKnownSessionUserIds());
  }

  function startNewSession() {
    activateSession(createSessionUserId());
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
            <span>Local user</span>
          </div>
          <div className="session-controls">
            <select value={sessionUserId} onChange={(event) => activateSession(event.target.value)} aria-label="Session user">
              {knownSessionUserIds.map((userId) => (
                <option key={userId} value={userId}>
                  {formatSessionLabel(userId)}
                </option>
              ))}
            </select>
            <button className="icon-button" type="button" onClick={startNewSession} title="New session" aria-label="New session">
              <RefreshCcw size={15} aria-hidden="true" />
            </button>
          </div>
          <p className="session-id">{sessionUserId}</p>
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
                onChange={(event) => setActiveCollectionId(Number(event.target.value))}
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
              <button
                className={`save-button ${selectedIsSaved ? "active" : ""}`}
                type="button"
                onClick={() => void toggleSavedGame(selectedGame)}
                title={selectedIsSaved ? `Remove from ${selectedCollection?.name ?? "collection"}` : `Save to ${selectedCollection?.name ?? "collection"}`}
              >
                {selectedIsSaved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
                {selectedIsSaved ? "Saved" : "Save"}
              </button>
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
