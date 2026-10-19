/**
 * Safe, timezone-aware date utilities for Yarnz.
 *
 * Backend databases and API endpoints (FastAPI, SQLite, Postgres) typically store
 * timestamps in UTC, but often serialize them without the trailing 'Z'
 * (e.g. "2026-10-18T23:57:45" or "2026-10-18 23:57:45").
 *
 * Without 'Z', JavaScript's Date constructor parses strings in the user's local timezone.
 * For users in UTC+1 (e.g. West Africa / Nigeria, UK BST), this creates an artificial
 * 1-hour gap where a brand new post immediately shows "1h ago"!
 *
 * Appending 'Z' when no timezone offset is present guarantees accurate UTC parsing.
 */

export function parseServerDate(dateStr: string | Date | undefined | null): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;

  let clean = String(dateStr).trim();

  // Convert "YYYY-MM-DD HH:mm:ss" to ISO "YYYY-MM-DDTHH:mm:ss"
  if (clean.includes(' ') && !clean.includes('T')) {
    clean = clean.replace(' ', 'T');
  }

  // If no timezone suffix ('Z' or '+/-HH:mm'), the server timestamp is in UTC
  if (!clean.endsWith('Z') && !/[+-]\d{2}(:?\d{2})?$/.test(clean)) {
    clean += 'Z';
  }

  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? new Date(dateStr) : parsed;
}

/**
 * Formats relative time Twitter-style:
 * - < 1 min: "just now"
 * - < 60 min: "1m", "5m", etc.
 * - < 24 hrs: "1h", "8h", etc.
 * - >= 24 hrs: "1d", "3d", etc.
 */
export function timeAgo(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return 'just now';

  const postTime = parseServerDate(dateStr).getTime();
  const diffMs = Math.max(0, Date.now() - postTime);

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'just now';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;

  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h`;

  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/**
 * Calculates remaining hours before the 24-hour self-destruct threshold.
 */
export function expiresIn(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '24h left';

  const postTime = parseServerDate(dateStr).getTime();
  const elapsedMs = Math.max(0, Date.now() - postTime);
  const elapsedHrs = Math.floor(elapsedMs / (1000 * 60 * 60));
  const remainingHrs = Math.max(0, 24 - elapsedHrs);

  if (remainingHrs === 0) return 'expiring soon';
  return `${remainingHrs}h left`;
}
