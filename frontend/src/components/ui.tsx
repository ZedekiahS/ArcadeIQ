import { RefreshCcw } from "lucide-react";
import { useI18n } from "../i18n";

export function ErrorNotice({ message, onRetry, retryLabel, disabled = false }: {
  message: string; onRetry: () => void; retryLabel?: string; disabled?: boolean;
}) {
  const { t, error } = useI18n();
  return <div className="error-notice" role="alert">
    <p>{error(message)}</p>
    <button className="small-button" type="button" onClick={onRetry} disabled={disabled}><RefreshCcw size={13} aria-hidden="true" />{retryLabel ?? t("Retry", "重试")}</button>
  </div>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
