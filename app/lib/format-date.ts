export function formatDate(value: string | Date, locale = "id-ID") {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
}
