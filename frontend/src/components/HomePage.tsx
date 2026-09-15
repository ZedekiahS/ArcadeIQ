import { ArrowUpRight, BarChart3, Compass, Gamepad2, Sparkles } from "lucide-react";
import { useI18n } from "../i18n";
import { GameArtwork } from "./GameArtwork";
import "./home-page.css";

export function HomePage() {
  const { t } = useI18n();
  return <main className="home-page" aria-labelledby="home-title">
    <section className="home-intro">
      <div className="home-intro-copy">
        <p className="eyebrow"><Compass size={15} aria-hidden="true" /> {t("A new perspective on games", "换个视角，探索游戏")}</p>
        <h2 id="home-title" tabIndex={-1}>{t("Your next chapter.", "你的下一局，")}<br /><span>{t("Starts here.", "从这里开始。")}</span></h2>
        <p className="home-description">{t("Find a game worth your time, or explore what makes one stand out. Choose your way in.", "寻找值得投入的游戏，或研究好游戏背后的机会。选择你的探索方式。")}</p>
        <div className="home-capabilities"><Sparkles size={15} aria-hidden="true" /><span>{t("Natural-language search · Game insights · Collections", "自然语言搜索 · 游戏洞察 · 收藏管理")}</span></div>
      </div>
      <div className="home-art-stage" aria-hidden="true">
        <div className="home-orbit" />
        <figure className="home-art home-art-back"><GameArtwork name="Outer Wilds" priority /><figcaption>OUTER WILDS</figcaption></figure>
        <figure className="home-art home-art-front"><GameArtwork name="Hades" priority /><figcaption>HADES <ArrowUpRight size={16} /></figcaption></figure>
        <span className="home-stage-label">EXPLORE WHAT'S NEXT / ARCADEIQ</span>
      </div>
    </section>

    <section className="entry-section" aria-labelledby="entry-title">
      <div className="entry-section-heading"><h3 id="entry-title">{t("How will you explore?", "今天，以什么身份出发？")}</h3><span>{t("Two perspectives. One game library.", "同一个游戏世界，两种探索视角。")}</span></div>
      <div className="entry-grid">
        <a className="entry-card entry-player" href="#player" aria-label={t("Enter as player", "以玩家身份进入")}>
          <div className="entry-card-top"><span className="entry-icon"><Gamepad2 size={24} aria-hidden="true" /></span><span className="entry-index">01 / PLAYER</span></div>
          <h3>{t("Here to play.", "我是玩家")}</h3>
          <p>{t("Find your next obsession. Match your taste, check the price, and build your next-play list.", "按喜好发现游戏，看看价格与推荐理由，收藏下一款想玩的作品。")}</p>
          <div className="entry-tags" aria-hidden="true"><span>{t("Discover", "找游戏")}</span><span>{t("Find your fit", "看推荐")}</span><span>{t("Save favorites", "收好游戏")}</span></div>
          <span className="entry-cta">{t("Enter as player", "以玩家身份进入")}<ArrowUpRight size={20} aria-hidden="true" /></span>
        </a>
        <a className="entry-card entry-developer" href="#developer" aria-label={t("Enter as developer", "以开发者身份进入")}>
          <div className="entry-card-top"><span className="entry-icon"><BarChart3 size={24} aria-hidden="true" /></span><span className="entry-index">02 / DEVELOPER</span></div>
          <h3>{t("Here to create.", "我是开发者")}</h3>
          <p>{t("Study the games around your idea. Explore catalog signals, estimated reach, and opportunities.", "研究同类作品，查看评价表现、市场规模估算与机会分析，为创作寻找参考。")}</p>
          <div className="entry-tags" aria-hidden="true"><span>{t("Research titles", "研究作品")}</span><span>{t("Read signals", "看市场信号")}</span><span>{t("Collect references", "积累参考")}</span></div>
          <span className="entry-cta">{t("Enter as developer", "以开发者身份进入")}<ArrowUpRight size={20} aria-hidden="true" /></span>
        </a>
      </div>
      <p className="entry-footnote">{t("You can return home to choose another perspective. Your saved collections stay with you.", "随时返回首页，换一种视角继续探索。已保存的收藏会保留。")}</p>
    </section>
  </main>;
}
