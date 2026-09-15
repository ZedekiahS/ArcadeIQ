import { ArrowLeft, Gamepad2, Languages } from "lucide-react";
import { useEffect, useRef } from "react";
import { LanguageProvider, useI18n } from "./i18n";
import { useAccount } from "./hooks/useAccount";
import { useCollections } from "./hooks/useCollections";
import { useDiscovery } from "./hooks/useDiscovery";
import { DATA_MODE } from "./services/runtime";
import { AccountPanel } from "./components/AccountPanel";
import { CollectionsPanel } from "./components/CollectionsPanel";
import { SaveGameMenu } from "./components/SaveGameMenu";
import { GameWorkspace } from "./components/GameWorkspace";
import { HomePage } from "./components/HomePage";
import { usePage, type WorkspaceView } from "./hooks/usePage";

export default function App() {
  return <LanguageProvider><ArcadeApp /></LanguageProvider>;
}

function ArcadeApp() {
  const { language, setLanguage, t } = useI18n();
  const page = usePage();
  const pageContent = useRef<HTMLDivElement>(null);
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    const heading = pageContent.current?.querySelector<HTMLElement>("main h2");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark"><Gamepad2 size={22} aria-hidden="true" /></div>
          <div><h1>Arcade<span>IQ</span></h1><p>{t("Discover games. Find your perspective.", "探索游戏，发现你的视角")}</p></div>
        </div>
        <div className="runtime-info">
          <div className="language-switch" role="group" aria-label={t("Interface language", "界面语言")}>
            <Languages size={16} aria-hidden="true" />
            <button type="button" lang="zh-CN" aria-label="中文" aria-pressed={language === "zh"} onClick={() => setLanguage("zh")}>中文</button>
            <button type="button" lang="en" aria-label="English" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
          </div>
          <p className="runtime-status">
            <strong>{DATA_MODE === "demo" ? t("Sample demo", "示例演示") : t("API mode", "API 模式")}</strong>
            <span>{DATA_MODE === "demo" ? t("Saves in this browser", "收藏保存在此浏览器") : t("Saves to your account", "收藏保存到你的账号")}</span>
          </p>
          <details className="mode-disclosure">
            <summary>{t("Data & setup", "数据与设置")}</summary>
            <div className="mode-options">
              <p className="mode-description">{DATA_MODE === "demo"
                ? t("Explore a fixed sample catalog with local rules. Collections are saved only in this browser.", "使用本地规则探索固定的示例游戏目录。收藏仅保存在此浏览器中。")
                : t("The catalog and insights come from the API. Sign in to save collections to your account.", "游戏目录与洞察来自 API。登录后可将收藏保存到账号。")}</p>
              <nav className="data-mode-links" aria-label={t("Data mode", "数据模式")}>
                <a href="?mode=demo" aria-current={DATA_MODE === "demo" ? "page" : undefined}>{t("Sample demo", "示例演示")}</a>
                <a href="?mode=api" aria-current={DATA_MODE === "api" ? "page" : undefined}>{t("API mode", "API 模式")}</a>
              </nav>
              <p className="supporting-note">{t("Switching modes reloads the page. Demo saves and account collections are separate.", "切换数据模式会刷新页面。演示收藏与账号收藏互相独立。")}</p>
            </div>
          </details>
        </div>
      </header>
      <div ref={pageContent}>
        {page ? <WorkspaceSession key={page} view={page} /> : <HomePage />}
      </div>
    </div>
  );
}

function WorkspaceSession({ view }: { view: WorkspaceView }) {
  const { t } = useI18n();
  const account = useAccount();
  const discovery = useDiscovery(view);
  const sessionUserId = DATA_MODE === "demo" ? "demo-user" : account.user?.id ?? null;
  const collections = useCollections(discovery.catalog, sessionUserId, account.revision);
  const sessionKey = `${sessionUserId ?? "anonymous"}:${account.revision}`;

  return <>
      <nav className="workspace-navigation" aria-label={t("Page navigation", "页面导航")}>
        <a href="#home"><ArrowLeft size={15} aria-hidden="true" />{t("Home", "首页")}</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{view === "developer" ? t("Developer research", "开发者研究") : t("Player discovery", "玩家探索")}</span>
      </nav>
      <GameWorkspace
        discovery={discovery}
        renderSaveMenu={(game) => <SaveGameMenu
          key={`${sessionKey}:${game.id}`}
          state={collections}
          sessionUserId={sessionUserId}
          game={game}
        />}
        collectionPanel={<aside className="sidebar" aria-label={t("Your account and collections", "你的账号与收藏")}>
          {DATA_MODE === "api" && <AccountPanel account={account} />}
          <CollectionsPanel
            key={sessionKey}
            state={collections}
            sessionUserId={sessionUserId}
            selectedId={discovery.selectedId}
            onSelectGame={discovery.selectGame}
            view={view}
          />
        </aside>}
      />
  </>;
}
