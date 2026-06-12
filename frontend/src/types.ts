export type GameSignal = "Strong" | "Watch" | "Risk";
export type SearchSortBy = "name" | "price" | "rating" | "review_count" | "release_year" | "revenue" | "ownership";

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
  sortBy: SearchSortBy | null;
  sortDirection: "asc" | "desc";
  limit: number | null;
  offset: number;
}

export interface SearchResponse {
  intent: SearchIntent;
  games: Game[];
  source: "rules" | "deepseek" | "mock";
}

export type UserRole = "guest" | "player" | "developer" | "admin";

export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: "bearer";
  expiresIn: number;
  user: UserProfile;
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

export interface GameCollection {
  id: number;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface SavedGame {
  id: number;
  userId: string;
  collectionId: number;
  gameId: number;
  createdAt: string;
  game: Game;
}

export interface ShortlistInsights {
  userId: string;
  savedCount: number;
  averagePrice: number;
  averageRating: number;
  totalVisibleRevenue: number;
  topTags: string[];
  strategy: InsightPanelContent;
  source: "rules" | "deepseek" | "mock";
}
