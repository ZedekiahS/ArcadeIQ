export function formatMoney(value: number) {
  return value === 0 ? "Free" : `$${value.toFixed(2)}`;
}

export function formatCompact(value: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(value);
}
