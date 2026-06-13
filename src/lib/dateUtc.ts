/** Formats a Date as a "YYYY-MM-DDTHH:mm" string for <input type="datetime-local">, in UTC. */
export function dateToUtcInputValue(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/** Parses a "YYYY-MM-DDTHH:mm" string (from <input type="datetime-local">) as a UTC instant. */
export function utcInputValueToDate(value: string): Date {
  return new Date(`${value}:00.000Z`);
}
