import { games } from "../data/games";
import type { Game } from "../types";

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
