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
