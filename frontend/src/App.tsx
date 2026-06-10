import {
  BarChart3,
  Brain,
  CircleDollarSign,
  Gamepad2,
  LineChart,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getCatalog, searchCatalog } from "./services/catalog";
import type { Game, SearchIntent } from "./types";
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

export default function App() {
  const [catalog, setCatalog] = useState<Game[]>([]);
  const [query, setQuery] = useState(exampleQueries[0]);
  const [intent, setIntent] = useState<SearchIntent>(initialIntent);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [view, setView] = useState<"player" | "developer">("player");
  const [searchResults, setSearchResults] = useState<Game[] | null>(null);
  const [searchSource, setSearchSource] = useState<"rules" | "deepseek" | "mock">("rules");

  useEffect(() => {
    getCatalog().then((items) => {
      setCatalog(items);
      setSelectedId(items[0]?.id ?? null);
    });
  }, []);

  const tags = useMemo(() => [...new Set(catalog.flatMap((game) => game.tags))].sort(), [catalog]);
  const filteredGames = useMemo(() => searchResults ?? filterGames(catalog, intent), [catalog, intent, searchResults]);
  const selectedGame = useMemo(() => {
    return filteredGames.find((game) => game.id === selectedId) ?? filteredGames[0] ?? catalog[0];
  }, [catalog, filteredGames, selectedId]);

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

  const signal = selectedGame ? getSignal(selectedGame) : "Watch";
  const signalClass = `signal ${signal.toLowerCase()}`;

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
          <Metric label="Catalog" value={catalog.length.toString()} />
          <Metric label="Visible Revenue" value={`$${formatCompact(metrics.revenue)}`} />
          <Metric label="Avg Rating" value={metrics.avgRating.toFixed(1)} />
        </section>
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
              title="Review Intelligence"
              caption="Generated preview"
              icon={<Brain size={16} />}
              body={
                selectedGame
                  ? `${selectedGame.name} is showing ${selectedGame.rating >= 4.5 ? "very strong" : "steady"} review sentiment. The strongest positioning comes from ${selectedGame.tags.slice(0, 2).join(" and ")} demand.`
                  : "Select a game to inspect review intelligence."
              }
              bullets={
                selectedGame
                  ? [
                      `Common praise: ${selectedGame.tags[0]} identity and clear audience fit.`,
                      `Review volume: ${selectedGame.reviewCount} player reviews available for summarization.`,
                      `Recommendation: surface to players who prefer ${selectedGame.tags.slice(1, 3).join(" and ")}.`,
                    ]
                  : []
              }
            />
            <InsightPanel
              title={view === "developer" ? "Developer Copilot" : "Player Recommendation"}
              caption={view === "developer" ? "Revenue lens" : "Discovery lens"}
              icon={<BarChart3 size={16} />}
              body={
                selectedGame && view === "developer"
                  ? `${selectedGame.developer} can use this title as a ${getSignal(selectedGame).toLowerCase()} catalog signal with ${formatCompact(selectedGame.ownership)} owners and $${formatCompact(selectedGame.revenue)} visible revenue.`
                  : selectedGame
                    ? `This is a good match for players who want ${selectedGame.tags.slice(0, 2).join(" and ")} with a ${selectedGame.price <= 25 ? "friendly" : "premium"} price point.`
                    : "Select a game to inspect recommendation signals."
              }
              bullets={
                selectedGame
                  ? [
                      `Price signal: ${selectedGame.price <= 25 ? "accessible" : "premium"} price positioning.`,
                      `Bundle opportunity: pair with adjacent ${selectedGame.tags[0].toLowerCase()} games.`,
                      "Next step: connect this panel to real ownership, purchase, and review tables.",
                    ]
                  : []
              }
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
