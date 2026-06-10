import { games } from "../data/games";
import { filterGames, parseSearchIntent } from "../lib/search";
import type { Game, SearchResponse } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

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
