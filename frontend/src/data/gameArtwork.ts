import catalog from "../../../catalog/demo-catalog.json";

// Official store headers cached for the portfolio demo; see
// docs/verification/game-artwork-sources.md. Match titles rather than database
// IDs, which differ between demo and API catalogs.
const artworkByTitle = new Map(
  catalog.map((record) => [record.name.toLowerCase(), record.artwork.slug]),
);

export function getGameArtwork(name: string): string | undefined {
  const title = name.trim().replace(/\s+/g, " ").toLowerCase();
  const slug = artworkByTitle.get(title);
  return slug ? `${import.meta.env.BASE_URL}game-art/${slug}.jpg` : undefined;
}
