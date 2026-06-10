export type GameSignal = "Strong" | "Watch" | "Risk";

export interface Game {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  releaseYear: number;
  developer: string;
  publisher: string;
  tags: string[];
  summary: string;
  revenue: number;
  ownership: number;
}

export interface SearchIntent {
  maxPrice: number;
  minRating: number;
  hasReviews: boolean;
  tags: string[];
  mode: "player" | "developer";
}

export interface SearchResponse {
  intent: SearchIntent;
  games: Game[];
  source: "rules" | "deepseek" | "mock";
}

export interface InsightPanelContent {
  title: string;
  caption: string;
  body: string;
  bullets: string[];
}

export interface GameInsights {
  gameId: number;
  signal: GameSignal;
  reviewIntelligence: InsightPanelContent;
  developerOpportunity: InsightPanelContent;
  playerRecommendation: InsightPanelContent;
  source: "rules" | "deepseek" | "mock";
}

export interface SavedGame {
  id: number;
  userId: string;
  gameId: number;
  createdAt: string;
  game: Game;
}
