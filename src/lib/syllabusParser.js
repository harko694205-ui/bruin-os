import { toDateStr, addDays } from './dates';

const MONTHS = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3,
  may: 4, june: 5, jun: 5, july: 6, jul: 6, august: 7, aug: 7,
  september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10, nov: 10,
  december: 11, dec: 11,
};

// Order matters: more specific categories are checked before generic catch-alls
// like "final" or "exam" so lines such as "Final project proposal due" or
// "Final paper due" classify as project/paper rather than exam.
const TYPE_KEYWORDS = [
  { type: 'presentation', words: ['presentation', 'present', 'pitch'] },
  { type: 'project', words: ['project', 'deliverable', 'milestone', 'capstone'] },
  { type: 'paper', words: ['paper', 'essay', 'draft', 'reflection'] },
  { type: 'quiz', words: ['quiz', 'pop quiz'] },
  { type: 'homework', words: ['homework', 'hw', 'problem set', 'pset'] },
  { type: 'exam', words: ['final exam', 'midterm exam', 'midterm', 'final', 'exam'] },
  { type: 'assignment', words: ['assignment', 'due', 'submission', 'submit'] },
];

function classifyType(line) {
  const lower = line.toLowerCase();
  for (const { type, words } of TYPE_KEYWORDS) {
    for (const w of words) {
      if (lower.includes(w)) return type;
    }
  }
  return 'assignment';
}

const WEEKDAY_PREFIX_RE = /^(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:rs(?:day)?)?|fri(?:day)?|sat(?:urday)?)\.?,?\s*/i;

function cleanTitle(line, matchedText) {
  let title = line.replace(matchedText, '').trim();
  // strip a leading weekday name that isn't part of the matched date (e.g. "Monday, November 2 - ...")
  title = title.replace(WEEKDAY_PREFIX_RE, '');
  // strip common separators/bullets at edges
  title = title.replace(/^[-–—:,*•\s]+/, '').replace(/[-–—:*•\s]+$/, '');
  title = title.replace(/\s{2,}/g, ' ');
  if (title.length < 3) {
    // fall back to whole line minus punctuation
    title = line.replace(/[-–—:*•]/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }
  if (title.length > 90) title = title.slice(0, 90).trim() + '…';
  if (!title) title = 'Untitled item';
  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function resolveYear(month, day, referenceYear) {
  // Academic syllabi often span two calendar years (e.g. Fall term).
  // Heuristic: pick the year (referenceYear or referenceYear+1) that keeps
  // the date from being more than ~4 months in the past relative to today.
  const now = new Date();
  const candidates = [referenceYear - 1, referenceYear, referenceYear + 1];
  let best = referenceYear;
  let bestDiff = Infinity;
  for (const y of candidates) {
    const d = new Date(y, month, day);
    const diffDays = Math.abs((d - now) / (1000 * 60 * 60 * 24));
    if (diffDays < bestDiff) {
      bestDiff = diffDays;
      best = y;
    }
  }
  return best;
}

// Each matcher returns { index, length, month, day, year (optional) } or null
function findDateMatches(line, referenceYear) {
  const matches = [];

  // 1. Month name + day (+ optional year): "September 24", "Sep 24, 2026", "Sept. 24"
  const monthDayRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/gi;
  let m;
  while ((m = monthDayRe.exec(line)) !== null) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = parseInt(m[2], 10);
    if (day < 1 || day > 31) continue;
    const year = m[3] ? parseInt(m[3], 10) : resolveYear(month, day, referenceYear);
    matches.push({ index: m.index, length: m[0].length, month, day, year });
  }

  // 2. Numeric: 9/24, 09/24/2026, 9-24-26
  const numericRe = /\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/g;
  while ((m = numericRe.exec(line)) !== null) {
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    if (a < 1 || a > 12 || b < 1 || b > 31) continue;
    let year = m[3] ? parseInt(m[3], 10) : null;
    if (year !== null && year < 100) year += 2000;
    if (year === null) year = resolveYear(a - 1, b, referenceYear);
    // avoid double counting overlap with a month-name match at same index
    const overlaps = matches.some((mm) => m.index < mm.index + mm.length && mm.index < m.index + m[0].length);
    if (overlaps) continue;
    matches.push({ index: m.index, length: m[0].length, month: a - 1, day: b, year });
  }

  // 3. "Week N" — resolved later relative to quarter/term start if available
  const weekRe = /\bweek\s+(\d{1,2})\b/gi;
  while ((m = weekRe.exec(line)) !== null) {
    matches.push({ index: m.index, length: m[0].length, weekNum: parseInt(m[1], 10) });
  }

  // 4. Weekday names alone won't resolve to a date reliably without more context, skip.

  return matches;
}

/**
 * Parse raw syllabus text into an array of proposed events.
 * @param {string} text raw pasted syllabus text
 * @param {object} opts { referenceYear, termStart (YYYY-MM-DD) }
 */
export function parseSyllabus(text, opts = {}) {
  const referenceYear = opts.referenceYear || new Date().getFullYear();
  const termStart = opts.termStart || null;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const results = [];
  const seen = new Set();

  lines.forEach((line, lineIdx) => {
    // Skip lines that are clearly headers/too short to be useful, but keep permissive.
    const dateMatches = findDateMatches(line, referenceYear);
    if (dateMatches.length === 0) return;

    // Use the first date match on the line as the anchor date for the item.
    const primary = dateMatches[0];
    let dateStr = null;

    if (primary.weekNum != null) {
      if (termStart) {
        dateStr = addDays(termStart, (primary.weekNum - 1) * 7);
      } else {
        return; // can't resolve week number without a term start date
      }
    } else {
      const d = new Date(primary.year, primary.month, primary.day);
      if (isNaN(d.getTime())) return;
      dateStr = toDateStr(d);
    }

    const type = classifyType(line);
    const matchedText = line.slice(primary.index, primary.index + primary.length);
    const title = cleanTitle(line, matchedText);

    const dedupeKey = `${dateStr}|${title.toLowerCase()}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    results.push({
      tempId: `parsed_${lineIdx}_${results.length}`,
      title,
      type,
      date: dateStr,
      sourceLine: line,
      include: true,
    });
  });

  // Sort chronologically, unresolvable (null) dates last
  results.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return results;
}

export const EVENT_TYPE_LABELS = {
  exam: 'Exam',
  quiz: 'Quiz',
  presentation: 'Presentation',
  paper: 'Paper',
  project: 'Project',
  homework: 'Homework',
  assignment: 'Assignment',
  personal: 'Personal',
  class: 'Class',
};
