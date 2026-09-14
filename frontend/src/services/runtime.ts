export type DataMode = "demo" | "api";

function readDataMode(): DataMode {
  const requestedMode = new URLSearchParams(window.location.search).get("mode");
  if (requestedMode === "demo" || requestedMode === "api") return requestedMode;
  return import.meta.env.VITE_DATA_MODE === "api" ? "api" : "demo";
}

// A mode switch requires a page load, so one view cannot mix API and demo data.
export const DATA_MODE: DataMode = readDataMode();
export const API_BASE_URL = new URL(
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8000/api",
  window.location.origin,
).href.replace(/\/+$/, "");
