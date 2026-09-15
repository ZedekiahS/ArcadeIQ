import { apiCatalog } from "./catalog/api";
import { demoCatalog } from "./catalog/demo";
import { DATA_MODE } from "./runtime";

// Mode is fixed for this page; failed API requests never switch to demo storage.
const catalog = DATA_MODE === "demo" ? demoCatalog : apiCatalog;

export const {
  getCatalog,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  getSavedGames,
  getShortlistInsights,
  saveGame,
  removeSavedGame,
  clearSavedGames,
  getGameDetail,
  getGameInsights,
  searchCatalog,
} = catalog;
