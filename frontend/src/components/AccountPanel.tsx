import { KeyRound, LogOut, RefreshCcw, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import type { useAccount } from "../hooks/useAccount";
import { useI18n } from "../i18n";
import { formatRoleLabel } from "../services/users";

export function AccountPanel({ account }: { account: ReturnType<typeof useAccount> }) {
  const { t, error } = useI18n();
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const isLoggingIn = account.status === "checking";

  function resetAuthForm() {
    setAuthMode(null);
    setLoginIdentifier("");
    setAccountPassword("");
    setRegisterEmail("");
    setRegisterDisplayName("");
  }
  function openLoginForm() { resetAuthForm(); setAuthMode("login"); }
  function openRegisterForm() { resetAuthForm(); setAuthMode("register"); }
  async function loginAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginIdentifier.trim() || !accountPassword) return;
    if (await account.login(loginIdentifier.trim(), accountPassword)) resetAuthForm();
  }
  async function registerAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registerEmail.trim() || !registerDisplayName.trim() || accountPassword.length < 8) return;
    if (await account.register(registerEmail.trim(), registerDisplayName.trim(), accountPassword)) resetAuthForm();
  }
  function logoutAccount() { account.logout(); resetAuthForm(); }

  return (
    <section className="tool-panel session-panel">
      <div className="section-heading">
        <h2><UserRound size={16} aria-hidden="true" />{t("Account", "账号")}</h2>
        <span>{account.user ? t("Signed in", "已登录") : t("Sign-in required to save", "登录后即可收藏")}</span>
      </div>
      {account.user && (
        <div className="session-meta">
          <p className="session-id">{account.user.displayName}</p>
          <span className={`role-pill ${account.user.role}`}><ShieldCheck size={12} aria-hidden="true" />{t(formatRoleLabel(account.user.role), { admin: "管理员", developer: "开发者", player: "玩家", guest: "访客" }[account.user.role])}</span>
        </div>
      )}
      {account.status === "checking" && <p role="status" className="mode-description">{t("Checking account…", "正在验证账号…")}</p>}
      {account.error && <div className="form-error" role="alert">{error(account.error)}</div>}
      {account.status === "error" && <button className="small-button" type="button" onClick={() => void account.retry()}><RefreshCcw size={13} aria-hidden="true" />{t("Retry account", "重新验证账号")}</button>}
      {!account.user && authMode === null && (
        <div className="account-actions">
          <button className="small-button" type="button" onClick={openLoginForm} disabled={isLoggingIn}><KeyRound size={13} aria-hidden="true" />{t("Sign In", "登录")}</button>
          <button className="ghost-button" type="button" onClick={openRegisterForm} disabled={isLoggingIn}>{t("Create Account", "注册账号")}</button>
        </div>
      )}
      {authMode !== null && !account.user && (
        <form className="account-form" onSubmit={(event) => void (authMode === "login" ? loginAccount(event) : registerAccount(event))}>
          {authMode === "login" ? (
            <label className="field compact"><span>{t("User ID or Email", "用户 ID 或邮箱")}</span>
              <input className="text-input" type="text" autoComplete="username" value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} placeholder="player@example.com" aria-label={t("User ID or email", "用户 ID 或邮箱")} disabled={isLoggingIn} />
            </label>
          ) : (
            <>
              <label className="field compact"><span>{t("Email", "邮箱")}</span>
                <input className="text-input" type="email" autoComplete="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} placeholder="player@example.com" aria-label={t("Register email", "注册邮箱")} disabled={isLoggingIn} />
              </label>
              <label className="field compact"><span>{t("Display Name", "昵称")}</span>
                <input className="text-input" type="text" autoComplete="nickname" value={registerDisplayName} onChange={(event) => setRegisterDisplayName(event.target.value)} placeholder={t("Player name", "玩家昵称")} aria-label={t("Register display name", "注册昵称")} disabled={isLoggingIn} />
              </label>
            </>
          )}
          <label className="field compact"><span>{t("Password", "密码")}</span>
            <input className="text-input" type="password" autoComplete={authMode === "login" ? "current-password" : "new-password"} value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder={authMode === "login" ? t("Password", "密码") : t("8+ characters", "至少 8 个字符")} aria-label={authMode === "login" ? t("Account password", "账号密码") : t("Register password", "注册密码")} disabled={isLoggingIn} />
          </label>
          <div className="account-form-actions">
            <button className="small-button" type="submit" disabled={isLoggingIn || (authMode === "login" ? !loginIdentifier.trim() || !accountPassword : !registerEmail.trim() || !registerDisplayName.trim() || accountPassword.length < 8)}>
              <KeyRound size={13} aria-hidden="true" />{isLoggingIn ? t("Please wait", "请稍候") : authMode === "login" ? t("Sign In", "登录") : t("Create", "创建")}
            </button>
            <button className="ghost-button" type="button" onClick={resetAuthForm} disabled={isLoggingIn}>{t("Cancel", "取消")}</button>
          </div>
        </form>
      )}
      {(account.user || account.status === "checking" || account.status === "error" || account.status === "expired") && (
        <button className="ghost-button session-logout" type="button" onClick={logoutAccount}><LogOut size={13} aria-hidden="true" />{account.status === "checking" ? t("Cancel and sign out", "取消并退出登录") : t("Sign Out", "退出登录")}</button>
      )}
    </section>
  );
}
