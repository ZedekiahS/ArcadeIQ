import type { Game, GameInsights, InsightPanelContent, SavedGame, ShortlistInsights } from "../types";
import { translateTag } from "./tags";

type Language = "en" | "zh";

// Exact text keys keep changed API descriptions and external content intact.
const summaries: Record<string, string> = {
  "A survival crafting title with strong multiplayer fit and clear collection mechanics.": "一款生存建造游戏，适合多人同乐，收集机制清晰。",
  "A precision platformer with exceptional review quality and lasting catalog value.": "一款讲究精准操作的平台跳跃游戏，评价出色，具有持久的游戏库价值。",
  "A high-sentiment horror game with strong narrative identity and review consistency.": "一款口碑出色的恐怖游戏，叙事风格鲜明，评价稳定。",
  "A premium puzzle adventure with clear niche appeal and strong discovery potential.": "一款定位高端的解谜冒险游戏，受众明确，值得发掘。",
  "A free-to-play aim trainer with broad acquisition value and competitive positioning.": "一款免费瞄准训练游戏，具备广泛的获客价值，定位竞技玩家。",
  "A management sim with survival hooks and a clear strategy audience.": "一款融入生存要素的经营模拟游戏，面向策略游戏玩家。",
  "A premium space RPG with strong genre alignment and high-value positioning.": "一款定位高端的太空角色扮演游戏，类型特色鲜明，注重高价值体验。",
  "A compact exploration game with unusually strong sentiment and discovery momentum.": "一款小而精的探索游戏，口碑格外出色，关注度持续增长。",
  "A co-op survival sandbox with strong discovery fit for players who want long-form crafting loops.": "一款合作生存沙盒游戏，适合喜欢长线制作与建造体验的玩家。",
  "A co-op shooter with unusually durable retention signals and clear squad-based appeal.": "一款合作射击游戏，留存表现持久，组队特色鲜明。",
  "A systems-heavy survival game with strong multiplayer watchlist potential and long-tail demand.": "一款系统丰富的生存游戏，值得多人游戏爱好者关注，具有长尾需求。",
  "A cozy survival crafting title with strong collection value for exploration-led recommendations.": "一款轻松惬意的生存建造游戏，适合以探索体验为核心的推荐与收藏。",
  "A high-sentiment survival exploration game with strong atmospheric positioning.": "一款口碑出色的生存探索游戏，以独特氛围见长。",
  "A discovery-driven mystery game with exceptional sentiment and strong recommendation confidence.": "一款以探索发现为驱动的悬疑游戏，评价出色，推荐依据充分。",
  "A polished action roguelike with rare crossover strength between story and repeatable combat.": "一款打磨精良的动作肉鸽游戏，兼具出色叙事与值得反复体验的战斗。",
  "A low-price high-sentiment metroidvania with excellent value and evergreen discovery demand.": "一款价格亲民、口碑出色的类银河战士恶魔城游戏，性价比高，长期受到新玩家关注。",
  "A strategy deckbuilder with deep replay value and strong fit for analytical recommendations.": "一款策略牌组构筑游戏，重玩价值丰富，适合偏重策略分析的推荐。",
  "A compact card roguelike with exceptional price-to-sentiment performance.": "一款小而精的卡牌肉鸽游戏，价格与口碑之间的表现格外突出。",
  "A cozy farming sim with broad audience reach and strong multiplayer-adjacent appeal.": "一款轻松的农场模拟游戏，受众广泛，也适合关注多人体验的玩家。",
  "A settlement strategy game with survival pressure and strong developer-side category signals.": "一款带有生存压力的聚落策略游戏，可为开发者提供清晰的品类参考。",
  "An atmospheric adventure with strong hook clarity and approachable premium pricing.": "一款氛围鲜明的冒险游戏，核心吸引力清晰，付费定价易于接受。",
  "A narrative RPG with standout writing signals and strong story-rich recommendation fit.": "一款叙事角色扮演游戏，文本表现突出，适合推荐给重视剧情的玩家。",
  "A premium exploration sandbox with broad tag coverage and useful developer comparison signals.": "一款定位高端的探索沙盒游戏，涵盖多种类型，可为开发者提供比较参考。",
  "A low-price co-op horror title with strong social discovery and shortlist value.": "一款价格亲民的合作恐怖游戏，适合通过好友发掘，也值得加入收藏。",
};

export function localizeGameSummary(game: Game, language: Language): string {
  return language === "zh" ? summaries[game.summary] ?? game.summary : game.summary;
}

const signalLabels = { Strong: "强劲", Watch: "关注", Risk: "风险" };
const priceLabels: Record<string, string> = { friendly: "亲民", accessible: "亲民", premium: "高端", "free-to-play": "免费" };

function compact(value: number, source: "rules" | "mock") {
  if (source === "mock") return Intl.NumberFormat("en", { notation: "compact" }).format(value);
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function money(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

function translatePanel(panel: InsightPanelContent, expectedBody: string, translatedBody: string, entries: [string, string][]): InsightPanelContent {
  // Only a recognized body enables template translation; unknown bullets still pass through.
  if (panel.body !== expectedBody) return panel;
  const translations = new Map(entries);
  return {
    title: translations.get(panel.title) ?? panel.title,
    caption: translations.get(panel.caption) ?? panel.caption,
    body: translatedBody,
    bullets: panel.bullets.map((bullet) => translations.get(bullet) ?? bullet),
  };
}

/** Show an original-content notice whenever any body or bullet was not translated. */
export function hasOriginalInsightContent(original: InsightPanelContent, localized: InsightPanelContent, language: Language): boolean {
  return language === "zh" && (
    (Boolean(original.body) && original.body === localized.body) ||
    original.bullets.some((bullet, index) => Boolean(bullet) && bullet === localized.bullets[index])
  );
}

export function localizeGameInsights(game: Game, insights: GameInsights, language: Language): GameInsights {
  if (language === "en" || (insights.source !== "mock" && insights.source !== "rules")) return insights;
  const source = insights.source;
  const primary = game.tags[0] ?? "genre";
  const secondary = game.tags.slice(1, 3);
  const adjacent = secondary.length ? secondary : game.tags.slice(0, 1);
  const phrase = adjacent.length ? adjacent.join(" and ") : source === "rules" ? "adjacent audiences" : primary;
  const primaryZh = primary === "genre" ? "该类型" : translateTag(primary, "zh");
  const phraseZh = adjacent.length ? adjacent.map((tag) => translateTag(tag, "zh")).join("与") : source === "rules" ? "相近受众" : primaryZh;
  const playerTagsZh = [...new Set([primaryZh, ...adjacent.map((tag) => translateTag(tag, "zh"))])].join("、");
  const sentiment = source === "mock" ? (game.rating >= 4.5 ? "very strong" : "steady") : game.rating >= 4.6 ? "very strong" : game.rating >= 4.1 ? "steady" : "mixed";
  const sentimentZh = sentiment === "very strong" ? "非常积极" : sentiment === "steady" ? "稳定" : "褒贬不一";
  const pricePosition = source === "rules" && game.price === 0 ? "free-to-play" : game.price <= 25 ? "accessible" : "premium";
  const playerPrice = source === "mock" && game.price <= 25 ? "friendly" : pricePosition;
  const signal = insights.signal;
  const signalZh = signalLabels[signal];
  const ownerCount = compact(game.ownership, source);
  const revenue = compact(game.revenue, source);
  const captions: [string, string][] = [["Demo rules", "演示规则"], ["Rules preview", "规则预览"], ["Revenue lens", "营收视角"], ["Discovery lens", "发现视角"]];
  return {
    ...insights,
    reviewIntelligence: translatePanel(
      insights.reviewIntelligence,
      `${game.name} is showing ${sentiment} review sentiment. The strongest positioning comes from ${primary} identity and ${phrase} demand.`,
      `${game.name} 的评价倾向${sentimentZh}。其定位优势主要来自${primaryZh}特色，以及对${phraseZh}的需求。`,
      [...captions, ["Review Intelligence", "评价洞察"],
        [`Common praise: ${primary} identity and clear audience fit.`, `常见好评：${primaryZh}特色与清晰的受众定位。`],
        [`Review volume: ${game.reviewCount} player reviews available for summarization.`, `评价数量：${game.reviewCount} 条玩家评价可供汇总。`],
        [`Recommendation: surface to players who prefer ${phrase}.`, `推荐方向：喜欢${phraseZh}的玩家。`]],
    ),
    developerOpportunity: translatePanel(
      insights.developerOpportunity,
      `${game.developer} can use this title as a ${signal.toLowerCase()} catalog signal with ${ownerCount} owners and $${revenue} visible revenue.`,
      `${game.developer} 可将本作作为「${signalZh}」级别的游戏库信号参考；持有者为 ${ownerCount}，可见营收为 $${revenue}。`,
      [...captions, ["Developer Copilot", "开发者助手"],
        [`Market signal: ${primary} demand is visible in the local catalog.`, `市场信号：本地游戏库中可见对${primaryZh}的需求。`],
        [`Market signal: ${primary} demand is already visible in this seeded catalog.`, `市场信号：预置游戏库中已可见对${primaryZh}的需求。`],
        [`Price signal: ${pricePosition} positioning.`, `价格信号：${priceLabels[pricePosition]}定位。`],
        ["Next step: connect this panel to real ownership, purchase, and review tables.", "下一步：连接真实的持有、购买与评价数据表。"]],
    ),
    playerRecommendation: translatePanel(
      insights.playerRecommendation,
      `This is a good match for players who want ${primary} and ${phrase} with a ${playerPrice} price point.`,
      `适合喜欢${playerTagsZh}玩法的玩家，${playerPrice === "free-to-play" ? "可免费游玩" : `定价${priceLabels[playerPrice]}`}。`,
      [...captions, ["Player Recommendation", "玩家推荐"],
        [`Signal: ${signal} based on rating and review volume.`, `推荐信号：${signalZh}，依据评分与评价数量。`],
        [`Price: ${money(game.price)}.`, `价格：${game.price === 0 ? "免费" : money(game.price)}。`],
        [`Bundle opportunity: pair with adjacent ${primary.toLowerCase()} games.`, `组合推荐：搭配相近的${primaryZh}游戏。`]],
    ),
  };
}

export function localizeCollectionInsights(insights: ShortlistInsights, savedGames: SavedGame[], language: Language): ShortlistInsights {
  if (language === "en" || (insights.source !== "mock" && insights.source !== "rules")) return insights;
  const headings: [string, string][] = [["Collection Intelligence", "收藏洞察"], ["Demo rules", "演示规则"], ["Rules preview", "规则预览"]];
  if (savedGames.length === 0) {
    return { ...insights, strategy: translatePanel(insights.strategy,
      "Save games to this collection to compare pricing, sentiment, and genre concentration.",
      "将游戏加入这个收藏夹，比较价格、口碑与类型分布。",
      [...headings,
        ["Start with two or three games from different tags.", "先收藏两到三款不同类型的游戏。"],
        ["Use collections to separate player wishlists from developer research.", "用不同收藏夹分别整理玩家愿望单与开发者研究。"],
        ["Future AI summaries can use this endpoint as their context source.", "后续 AI 摘要可使用此接口提供的上下文。"]],
    ) };
  }
  const games = savedGames.map((saved) => saved.game);
  const averagePrice = games.reduce((sum, game) => sum + game.price, 0) / games.length;
  const strongest = games.reduce((best, game) => game.rating > best.rating ? game : best, games[0]);
  const position = averagePrice <= 25 ? "accessible" : "premium";
  const tags = insights.topTags.slice(0, 3);
  const phrase = tags.join(", ") || "mixed genres";
  const phraseZh = tags.map((tag) => translateTag(tag, "zh")).join("、") || "多种类型";
  const revenue = compact(insights.totalVisibleRevenue, insights.source);
  return { ...insights, strategy: translatePanel(insights.strategy,
    `This collection leans ${position} with ${phrase} demand. ${strongest.name} is the strongest sentiment anchor at ${strongest.rating.toFixed(1)} rating.`,
    `这个收藏夹的价格偏${priceLabels[position]}，主要关注${phraseZh}。${strongest.name} 的口碑最突出，评分为 ${strongest.rating.toFixed(1)}。`,
    [...headings,
      [`Saved games: ${insights.savedCount}.`, `已收藏游戏：${insights.savedCount} 款。`],
      [`Average price: ${money(averagePrice)}.`, `平均价格：${averagePrice === 0 ? "免费" : money(averagePrice)}。`],
      [`Visible revenue represented: $${revenue}.`, `对应的可见营收：$${revenue}。`],
      [`Top tags: ${phrase}.`, `主要类型：${phraseZh}。`]],
  ) };
}
