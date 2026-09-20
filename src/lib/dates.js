// Date utilities. All "dateStr" values are 'YYYY-MM-DD' local-date strings to avoid timezone drift.

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_ABBR = MONTH_NAMES.map((m) => m.slice(0, 3));

export function todayStr() {
  return toDateStr(new Date());
}

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateStr(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, n) {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function daysBetween(fromStr, toStr) {
  const a = parseDateStr(fromStr);
  const b = parseDateStr(toStr);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function isSameDay(a, b) {
  return a === b;
}

export function isPast(dateStr) {
  if (!dateStr) return false;
  return dateStr < todayStr();
}

export function isToday(dateStr) {
  return dateStr === todayStr();
}

export function isTomorrow(dateStr) {
  return dateStr === addDays(todayStr(), 1);
}

export function isWithinDays(dateStr, n) {
  if (!dateStr) return false;
  const diff = daysBetween(todayStr(), dateStr);
  return diff >= 0 && diff <= n;
}

export function formatFriendlyDate(dateStr, opts = {}) {
  if (!dateStr) return 'No date';
  const d = parseDateStr(dateStr);
  const diff = daysBetween(todayStr(), dateStr);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < 0 && diff >= -6) return `Last ${DAY_NAMES[d.getDay()]}`;
  if (diff > 0 && diff <= 6) return DAY_NAMES[d.getDay()];
  const withYear = opts.withYear || d.getFullYear() !== new Date().getFullYear();
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}${withYear ? `, ${d.getFullYear()}` : ''}`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = parseDateStr(dateStr);
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(startTime, endTime) {
  if (!startTime) return '';
  return endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : formatTime(startTime);
}

export function getWeekStart(dateStr) {
  const d = parseDateStr(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toDateStr(d);
}

export function getWeekDates(weekStartStr) {
  const dates = [];
  for (let i = 0; i < 7; i++) dates.push(addDays(weekStartStr, i));
  return dates;
}

export function getMonthGrid(year, month) {
  // Returns array of weeks, each an array of 7 dateStrs (may spill into adjacent months)
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const weeks = [];
  let cursor = toDateStr(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export function getQuarterWeekNumber(quarterStart, dateStr) {
  if (!quarterStart) return null;
  const diff = daysBetween(quarterStart, dateStr);
  return Math.floor(diff / 7) + 1;
}

export function getQuarterWeeks(quarterStart, quarterEnd) {
  if (!quarterStart || !quarterEnd) return [];
  // Anchor "Week 1" at the exact term start date (not Sunday-aligned) so week
  // numbers here always match getQuarterWeekNumber() and the syllabus parser's
  // "Week N" resolution — otherwise the same label could point at different
  // date ranges in different parts of the app.
  const weeks = [];
  let cursor = quarterStart;
  let weekNum = 1;
  while (cursor <= quarterEnd) {
    const dates = Array.from({ length: 7 }, (_, i) => addDays(cursor, i));
    weeks.push({ weekNum, start: cursor, dates });
    cursor = addDays(cursor, 7);
    weekNum += 1;
  }
  return weeks;
}
