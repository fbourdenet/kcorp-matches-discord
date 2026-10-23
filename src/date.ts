const PARIS = 'Europe/Paris';

const DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: PARIS,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * Calendar day in Europe/Paris, formatted YYYY-MM-DD.
 *
 * Intl has no ISO format and toISOString() works in UTC, so the formatter uses
 * the en-CA locale, which writes dates as YYYY-MM-DD.
 */
export function parisDay(date: Date): string {
  return DAY_FORMATTER.format(date);
}

/**
 * Time in Europe/Paris, formatted HH:mm.
 */
export function parisTime(date: Date): string {
  return TIME_FORMATTER.format(date);
}
