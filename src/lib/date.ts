// Ngày được lưu dạng "YYYY-MM-DD" theo giờ địa phương.
// Phép cộng/trừ ngày làm trên UTC để không bị lệch do giờ mùa hè.

const DAY_MS = 86_400_000;

export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function keyToUtc(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcToKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: string, days: number): string {
  return utcToKey(keyToUtc(key) + days * DAY_MS);
}

/** Số ngày từ `from` đến `to` (to - from). */
export function diffDays(from: string, to: string): number {
  return Math.round((keyToUtc(to) - keyToUtc(from)) / DAY_MS);
}

/** Thứ Hai của tuần chứa ngày `key`. */
export function startOfWeek(key: string): string {
  const dow = new Date(keyToUtc(key)).getUTCDay(); // 0 = Chủ nhật
  const offset = (dow + 6) % 7;
  return addDays(key, -offset);
}

/** Tuần ISO 8601, ví dụ "2026-10-17" -> "2026-W42". Tuần bắt đầu thứ Hai; tuần 1 chứa ngày 4/1. */
export function isoWeek(key: string): string {
  const monday = startOfWeek(key);
  const thursday = addDays(monday, 3);
  const year = Number(thursday.slice(0, 4));
  const firstMonday = startOfWeek(`${year}-01-04`);
  const week = Math.floor(diffDays(firstMonday, monday) / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/** "2026-10-17" -> "17/10" */
export function formatShort(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
}

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

/** "2026-10-17" -> "Thứ Bảy, 17/10/2026" */
export function formatLong(key: string): string {
  const [y, m, d] = key.split("-");
  const dow = new Date(keyToUtc(key)).getUTCDay();
  return `${WEEKDAYS[dow]}, ${d}/${m}/${y}`;
}
