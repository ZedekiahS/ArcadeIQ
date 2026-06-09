const games = [
  {
    id: 1,
    name: "Smalland: Survive the Wilds",
    price: 34.99,
    rating: 4.2,
    reviews: 128,
    developer: "Merge Games",
    publisher: "Maximum Entertainment",
    tags: ["Survival", "Multiplayer", "Open World", "Crafting"],
    summary: "A survival crafting title with strong multiplayer fit and clear collection mechanics.",
  },
  {
    id: 2,
    name: "Celeste",
    price: 19.99,
    rating: 4.8,
    reviews: 312,
    developer: "Maddy Makes Games",
    publisher: "Extremely OK Games",
    tags: ["Platformer", "Difficult", "Story Rich", "Singleplayer"],
    summary: "A precision platformer with exceptional review quality and lasting catalog value.",
  },
  {
    id: 3,
    name: "SIGNALIS",
    price: 19.99,
    rating: 4.6,
    reviews: 204,
    developer: "rose-engine",
    publisher: "Humble Games",
    tags: ["Survival Horror", "Atmospheric", "Story Rich", "Singleplayer"],
    summary: "A high-sentiment horror game with strong narrative identity and review consistency.",
  },
  {
    id: 4,
    name: "Riven",
    price: 34.99,
    rating: 4.3,
    reviews: 84,
    developer: "Cyan Worlds",
    publisher: "Cyan Worlds",
    tags: ["Puzzle", "Adventure", "Exploration", "Singleplayer"],
    summary: "A premium puzzle adventure with clear niche appeal and strong discovery potential.",
  },
  {
    id: 5,
    name: "Aimlabs",
    price: 0,
    rating: 4.1,
    reviews: 455,
    developer: "State Space Labs",
    publisher: "State Space Labs",
    tags: ["FPS", "Shooter", "Multiplayer", "Training"],
    summary: "A free-to-play aim trainer with broad acquisition value and competitive positioning.",
  },
  {
    id: 6,
    name: "Mind Over Magic",
    price: 24.99,
    rating: 4.0,
    reviews: 76,
    developer: "Sparkypants",
    publisher: "Klei Publishing",
    tags: ["Survival", "Management", "Strategy", "Crafting"],
    summary: "A management sim with survival hooks and a clear strategy audience.",
  },
  {
    id: 7,
    name: "EVERSPACE 2",
    price: 49.99,
    rating: 4.4,
    reviews: 143,
    developer: "ROCKFISH Games",
    publisher: "ROCKFISH Games",
    tags: ["Shooter", "Space", "RPG", "Exploration"],
    summary: "A premium space RPG with strong genre alignment and high-value positioning.",
  },
  {
    id: 8,
    name: "ANIMAL WELL",
    price: 24.99,
    rating: 4.7,
    reviews: 229,
    developer: "Billy Basso",
    publisher: "Bigmode",
    tags: ["Metroidvania", "Puzzle", "Exploration", "Atmospheric"],
    summary: "A compact exploration game with unusually strong sentiment and discovery momentum.",
  },
];

const state = {
  maxPrice: 35,
  requiredTags: [],
  hasReviews: true,
  selectedId: games[0].id,
};

const elements = {
  nlSearch: document.querySelector("#nl-search"),
  parseSearch: document.querySelector("#parse-search"),
  parsedQuery: document.querySelector("#parsed-query"),
  maxPrice: document.querySelector("#max-price"),
  priceLabel: document.querySelector("#price-label"),
  tagFilter: document.querySelector("#tag-filter"),
  reviewFilter: document.querySelector("#review-filter"),
  catalogCount: document.querySelector("#catalog-count"),
  avgPrice: document.querySelector("#avg-price"),
  avgRating: document.querySelector("#avg-rating"),
  resultCount: document.querySelector("#result-count"),
  gameList: document.querySelector("#game-list"),
  selectedTitle: document.querySelector("#selected-title"),
  selectedSummary: document.querySelector("#selected-summary"),
  selectedRating: document.querySelector("#selected-rating"),
  selectedPrice: document.querySelector("#selected-price"),
  selectedSignal: document.querySelector("#selected-signal"),
  reviewInsight: document.querySelector("#review-insight"),
  developerInsight: document.querySelector("#developer-insight"),
};

function money(value) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

function getSignal(game) {
  if (game.rating >= 4.6 && game.reviews >= 150) {
    return { label: "Strong", className: "signal-good" };
  }
  if (game.rating >= 4.1) {
    return { label: "Watch", className: "signal-watch" };
  }
  return { label: "Risk", className: "signal-risk" };
}

function parseNaturalLanguage() {
  const text = elements.nlSearch.value.toLowerCase();
  const parsed = {
    maxPrice: inferMaxPrice(text),
    hasReviews: text.includes("review") || text.includes("good") || text.includes("rated"),
    tags: [],
  };

  const knownTags = [...new Set(games.flatMap((game) => game.tags))];
  for (const tag of knownTags) {
    const normalizedTag = tag.toLowerCase();
    const leadingWord = normalizedTag.split(" ")[0];
    if (text.includes(normalizedTag) || (!normalizedTag.includes(" ") && text.includes(leadingWord))) {
      parsed.tags.push(tag);
    }
  }

  if (text.includes("multiplayer") && !parsed.tags.includes("Multiplayer")) {
    parsed.tags.push("Multiplayer");
  }
  if (text.includes("story") && !parsed.tags.includes("Story Rich")) {
    parsed.tags.push("Story Rich");
  }
  if (text.includes("horror") && !parsed.tags.includes("Survival Horror")) {
    parsed.tags.push("Survival Horror");
  }

  parsed.tags = prioritizeTags([...new Set(parsed.tags)], text);
  state.maxPrice = parsed.maxPrice;
  state.hasReviews = parsed.hasReviews;
  state.requiredTags = parsed.tags.slice(0, 3);

  elements.maxPrice.value = String(state.maxPrice);
  elements.reviewFilter.checked = state.hasReviews;
  elements.tagFilter.value = state.requiredTags[0] ?? "";
  elements.parsedQuery.textContent = JSON.stringify(parsed, null, 2);

  render();
}

function inferMaxPrice(text) {
  const explicitPrice = text.match(/(?:under|below|less than)\s+\$?(\d+)/);
  if (explicitPrice) {
    return Number(explicitPrice[1]);
  }
  if (text.includes("cheap") || text.includes("deal")) {
    return 35;
  }
  if (text.includes("premium")) {
    return 70;
  }
  return 70;
}

function prioritizeTags(tags, text) {
  const priority = [];
  const pushIfPresent = (tag) => {
    if (tags.includes(tag) && !priority.includes(tag)) {
      priority.push(tag);
    }
  };

  if (text.includes("multiplayer")) pushIfPresent("Multiplayer");
  if (text.includes("survival")) pushIfPresent("Survival");
  if (text.includes("story")) pushIfPresent("Story Rich");
  if (text.includes("exploration")) pushIfPresent("Exploration");
  if (text.includes("puzzle")) pushIfPresent("Puzzle");

  for (const tag of tags) {
    pushIfPresent(tag);
  }

  return priority;
}

function getFilteredGames() {
  return games.filter((game) => {
    const priceMatch = game.price <= state.maxPrice;
    const reviewMatch = !state.hasReviews || game.reviews > 0;
    const tagMatch = state.requiredTags.length === 0 || state.requiredTags.every((tag) => game.tags.includes(tag));
    return priceMatch && reviewMatch && tagMatch;
  });
}

function renderMetrics(filteredGames) {
  const avgPrice = filteredGames.reduce((sum, game) => sum + game.price, 0) / (filteredGames.length || 1);
  const avgRating = filteredGames.reduce((sum, game) => sum + game.rating, 0) / (filteredGames.length || 1);

  elements.catalogCount.textContent = String(games.length);
  elements.avgPrice.textContent = money(avgPrice);
  elements.avgRating.textContent = avgRating.toFixed(1);
  elements.resultCount.textContent = `${filteredGames.length} result${filteredGames.length === 1 ? "" : "s"}`;
}

function renderGameList(filteredGames) {
  elements.gameList.innerHTML = "";

  if (filteredGames.length === 0) {
    const empty = document.createElement("div");
    empty.className = "insight-body muted";
    empty.textContent = "No games match these filters. Try increasing max price or selecting another tag.";
    elements.gameList.appendChild(empty);
    return;
  }

  for (const game of filteredGames) {
    const button = document.createElement("button");
    button.className = `game-row${game.id === state.selectedId ? " selected" : ""}`;
    button.type = "button";
    button.addEventListener("click", () => {
      state.selectedId = game.id;
      render();
    });

    button.innerHTML = `
      <div>
        <h4>${game.name}</h4>
        <div class="tag-line">
          ${game.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </div>
      <div class="game-meta">
        <strong>${money(game.price)}</strong>
        ${game.rating.toFixed(1)} rating / ${game.reviews} reviews
      </div>
    `;

    elements.gameList.appendChild(button);
  }
}

function renderSelectedGame(filteredGames) {
  const selected =
    filteredGames.find((game) => game.id === state.selectedId) ??
    filteredGames[0] ??
    games.find((game) => game.id === state.selectedId) ??
    games[0];
  state.selectedId = selected.id;

  const signal = getSignal(selected);
  elements.selectedTitle.textContent = selected.name;
  elements.selectedSummary.textContent = selected.summary;
  elements.selectedRating.textContent = selected.rating.toFixed(1);
  elements.selectedPrice.textContent = money(selected.price);
  elements.selectedSignal.textContent = signal.label;
  elements.selectedSignal.className = signal.className;

  elements.reviewInsight.className = "insight-body";
  elements.reviewInsight.innerHTML = `
    <strong>${selected.name}</strong> is trending as a ${selected.tags.slice(0, 2).join(" / ")} title.
    Player sentiment is ${selected.rating >= 4.5 ? "very positive" : "positive but worth monitoring"}.
    <ul>
      <li>Common praise: ${selected.tags[0].toLowerCase()} identity and clear audience fit.</li>
      <li>Risk to inspect: pricing and long-term retention for this segment.</li>
      <li>Recommendation: surface it to players who engage with ${selected.tags.slice(1, 3).join(" and ")}.</li>
    </ul>
  `;

  elements.developerInsight.className = "insight-body";
  elements.developerInsight.innerHTML = `
    <strong>${selected.developer}</strong> should position this game around its strongest tags:
    ${selected.tags.slice(0, 3).join(", ")}.
    <ul>
      <li>Price signal: ${selected.price <= 25 ? "accessible price point" : "premium price point"}.</li>
      <li>Catalog opportunity: bundle with adjacent ${selected.tags[0].toLowerCase()} games.</li>
      <li>Next analysis: compare review sentiment against refund or ownership data once backend metrics are connected.</li>
    </ul>
  `;
}

function render() {
  elements.priceLabel.textContent = `$${state.maxPrice}`;
  const filteredGames = getFilteredGames();
  renderMetrics(filteredGames);
  renderGameList(filteredGames);
  renderSelectedGame(filteredGames);

  const requiredText = state.requiredTags.length > 0 ? state.requiredTags.join(" + ") : "No tag focus";
  elements.parsedQuery.textContent = elements.parsedQuery.textContent.replace(
    /\n?Required tags:.*$/s,
    "",
  ) + `\nRequired tags: ${requiredText}`;
}

function initializeTags() {
  const tags = [...new Set(games.flatMap((game) => game.tags))].sort();
  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    elements.tagFilter.appendChild(option);
  }
}

elements.parseSearch.addEventListener("click", parseNaturalLanguage);
elements.maxPrice.addEventListener("input", (event) => {
  state.maxPrice = Number(event.target.value);
  render();
});
elements.tagFilter.addEventListener("change", (event) => {
  state.requiredTags = event.target.value ? [event.target.value] : [];
  render();
});
elements.reviewFilter.addEventListener("change", (event) => {
  state.hasReviews = event.target.checked;
  render();
});
document.querySelectorAll(".scenario-button").forEach((button) => {
  button.addEventListener("click", () => {
    elements.nlSearch.value = button.dataset.query;
    parseNaturalLanguage();
  });
});

initializeTags();
parseNaturalLanguage();
