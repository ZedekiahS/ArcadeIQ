const examples = [
  ["Find the second most expensive FPS game", "找第二贵的FPS游戏"],
  ["Celeste", "Celeste"],
  ["Find cheap multiplayer survival games with good reviews", "找便宜且有评价的多人生存游戏"],
  ["Show highly rated story rich games under 25 dollars", "找25美元以下的高评分剧情游戏"],
  ["Find exploration games for developer catalog analysis", "为开发者分析探索类游戏"],
] as const;

// Only translate our preset prompts. User-written queries retain their exact wording.
export function localizeExampleQuery(query: string, language: "en" | "zh") {
  const match = examples.find(([english, chinese]) => query === english || query === chinese);
  return match ? match[language === "zh" ? 1 : 0] : query;
}
