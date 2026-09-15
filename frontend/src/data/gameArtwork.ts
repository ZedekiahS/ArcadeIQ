// Official store headers cached for the portfolio demo; see docs/verification/game-artwork-sources.md.
// Match titles rather than database IDs, which differ between demo and API catalogs.
const artworkByTitle = new Map<string, string>([
  ["smalland: survive the wilds", "smalland"],
  ["celeste", "celeste"],
  ["signalis", "signalis"],
  ["riven", "riven"],
  ["aimlabs", "aimlabs"],
  ["mind over magic", "mind-over-magic"],
  ["everspace 2", "everspace-2"],
  ["animal well", "animal-well"],
  ["valheim", "valheim"],
  ["deep rock galactic", "deep-rock-galactic"],
  ["project zomboid", "project-zomboid"],
  ["core keeper", "core-keeper"],
  ["subnautica", "subnautica"],
  ["outer wilds", "outer-wilds"],
  ["hades", "hades"],
  ["hollow knight", "hollow-knight"],
  ["slay the spire", "slay-the-spire"],
  ["balatro", "balatro"],
  ["stardew valley", "stardew-valley"],
  ["against the storm", "against-the-storm"],
  ["dredge", "dredge"],
  ["disco elysium", "disco-elysium"],
  ["no man's sky", "no-mans-sky"],
  ["lethal company", "lethal-company"],
]);

export function getGameArtwork(name: string): string | undefined {
  const title = name.trim().replace(/\s+/g, " ").toLowerCase();
  const slug = artworkByTitle.get(title);
  return slug ? `${import.meta.env.BASE_URL}game-art/${slug}.jpg` : undefined;
}
