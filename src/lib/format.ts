export const formatMoney = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

const hasExplicitTimeZone = (value: string) => /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
const displayDate = (value: string) => new Date(hasExplicitTimeZone(value) ? value : `${value}Z`);

export const formatTime = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: hasExplicitTimeZone(value) ? timeZone : "UTC" }).format(displayDate(value));

export const formatDate = (value: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: hasExplicitTimeZone(value) ? timeZone : "UTC" }).format(displayDate(value));

export const formatDuration = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
